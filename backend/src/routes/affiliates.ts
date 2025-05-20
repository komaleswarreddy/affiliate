import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import nodemailer from 'nodemailer';

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey || '');

// Validation schemas
const inviteAffiliateSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  productId: z.string().uuid('Invalid product ID'),
});

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.emailUser,
    pass: config.emailPassword,
  },
});

export async function affiliateRoutes(fastify: FastifyInstance) {
  // 1. Public route FIRST
  fastify.post('/accept-invite/:inviteId', { preHandler: [] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { inviteId } = request.params as { inviteId: string };

      // Get invite with a lock to prevent concurrent processing
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('id', inviteId)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invite) {
        return reply.status(404).send({ error: 'Invite not found or already processed' });
      }

      // Generate a random password for the affiliate
      const randomPassword = Math.random().toString(36).slice(-10);

      try {
        // Try to create the user in Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: invite.email,
          password: randomPassword,
          email_confirm: true,
        });

        let userId;
        if (authError && authError.status === 422 && authError.code === 'email_exists') {
          // User already exists in auth.users, fetch their id
          const { data: userList, error: fetchUserError } = await supabaseAdmin.auth.admin.listUsers();
          if (fetchUserError || !userList || !userList.users) {
            return reply.status(500).send({ error: 'User already exists but could not fetch user id', details: fetchUserError?.message });
          }
          const foundUser = userList.users.find(u => u.email === invite.email);
          if (!foundUser) {
            return reply.status(500).send({ error: 'User already exists but could not fetch user id', details: 'User not found in list.' });
          }
          userId = foundUser.id;
        } else if (authError) {
          // Log the error but don't fail if it's just a duplicate user
          if (authError.code === 'unexpected_failure' && authError.message?.includes('already exists')) {
            // Try to fetch the existing user
            const { data: userList, error: fetchUserError } = await supabaseAdmin.auth.admin.listUsers();
            if (fetchUserError || !userList || !userList.users) {
              return reply.status(500).send({ error: 'User already exists but could not fetch user id', details: fetchUserError?.message });
            }
            const foundUser = userList.users.find(u => u.email === invite.email);
            if (!foundUser) {
              return reply.status(500).send({ error: 'User already exists but could not fetch user id', details: 'User not found in list.' });
            }
            userId = foundUser.id;
          } else {
            console.error('Supabase Admin createUser error:', authError);
            return reply.status(500).send({ error: 'Failed to create auth user', details: authError?.message });
          }
        } else {
          userId = authUser.user.id;
        }

        // Now insert into public.users if not already present
        const { data: userProfile, error: userProfileError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: invite.email,
            role: 'affiliate',
            tenant_id: invite.tenant_id,
            invited_by: invite.created_by,
          }, { onConflict: 'id' }) // upsert by id
          .select()
          .single();

        if (userProfileError) {
          return reply.status(500).send({ error: 'Failed to create user profile', details: userProfileError.message });
        }

        // Get bronze commission tier
        const { data: bronzeTier } = await supabase
          .from('commission_tiers')
          .select('id')
          .eq('name', 'Bronze')
          .single();

        // Create affiliate record
        const { data: affiliate, error: affiliateError } = await supabase
          .from('affiliates')
          .insert({
            user_id: userProfile.id,
            tenant_id: invite.tenant_id,
            commission_tier_id: bronzeTier?.id,
            status: 'active',
          })
          .select()
          .single();

        if (affiliateError) {
          if (affiliateError.code === '23505') { // unique_violation
            // Instead of returning an error, fetch the existing affiliate's details
            const { data: existingAffiliate, error: fetchError } = await supabase
              .from('affiliates')
              .select(`
                *,
                users:user_id (
                  email
                )
              `)
              .eq('user_id', userProfile.id)
              .eq('tenant_id', invite.tenant_id)
              .single();

            if (fetchError) {
              return reply.status(500).send({ error: 'Failed to fetch existing affiliate details' });
            }

            // Update invite status
            await supabase
              .from('invites')
              .update({ status: 'accepted', accepted_at: new Date().toISOString() })
              .eq('id', inviteId);

            // Return success with existing user's email
            return reply.send({
              message: 'Welcome back! You are already an affiliate.',
              email: existingAffiliate.users.email,
              isExistingUser: true
            });
          }
          return reply.status(500).send({ error: 'Failed to create affiliate record', details: affiliateError.message });
        }

        // Update invite status
        await supabase
          .from('invites')
          .update({ status: 'accepted', accepted_at: new Date().toISOString() })
          .eq('id', inviteId);

        // Return credentials as JSON
        return reply.send({
          message: 'Invite accepted successfully',
          email: invite.email,
          password: randomPassword,
        });
      } catch (error) {
        console.error('Error processing invite:', error);
        return reply.status(500).send({ error: 'Failed to process invite', details: error instanceof Error ? error.message : 'Unknown error' });
      }
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // 2. Auth middleware as a function
  const requireAuth = async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) throw new Error('No authorization header');
      const token = authHeader.split(' ')[1];
      const decoded = fastify.jwt.verify(token);
      request.user = decoded;
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  };

  // 3. Protected routes use onRequest: requireAuth
  fastify.get('/', { onRequest: requireAuth }, async (request, reply) => {
    try {
      const user = request.user as { tenantId: string };
      if (!user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { data: affiliates, error } = await supabase
        .from('affiliates')
        .select(`
          *,
          users:user_id (
            id,
            email,
            role,
            created_at
          ),
          commission_tiers:commission_tier_id (
            name,
            commission_rate
          )
        `)
        .eq('tenant_id', user.tenantId);

      if (error) throw error;

      return { affiliates };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Invite new affiliate
  fastify.post('/invite', { onRequest: requireAuth }, async (request, reply) => {
    try {
      const user = request.user as { role: string; tenantId: string; id: string };
      if (!user || user.role !== 'admin') {
        return reply.status(403).send({ error: 'Only admins can invite affiliates' });
      }
      console.log(user);

      const data = inviteAffiliateSchema.parse(request.body);
      console.log(data);
      // Verify product belongs to tenant
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', data.productId)
        .eq('tenant_id', user.tenantId)
        .single();

      if (productError || !product) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      // Check if invite already exists
      const { data: existingInvite } = await supabase
        .from('invites')
        .select('*')
        .eq('email', data.email)
        .eq('tenant_id', user.tenantId)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        return reply.status(400).send({ error: 'An invite already exists for this email' });
      }

      // Create invite
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .insert([{
          email: data.email,
          tenant_id: user.tenantId,
          product_id: data.productId,
          created_by: user.id,
          status: 'pending'
        }])
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Send email
      const mailOptions = {
        from: config.emailUser,
        to: data.email,
        subject: 'Affiliate Program Invitation',
        html: `
          <h1>You've been invited to join our Affiliate Program!</h1>
          <p>You have been invited to promote the following product:</p>
          <h2>${product.name}</h2>
          <p>${product.description}</p>
          <p>Price: $${product.price}</p>
          <p>Commission Rate: ${product.product_commission}%</p>
          <p>Click the link below to accept the invitation:</p>
          <a href="${config.frontendUrl}/accept-invite/${invite.id}">Accept Invitation</a>
        `
      };

      await transporter.sendMail(mailOptions);

      return { message: 'Invitation sent successfully', invite };
    } catch (error) {
      request.log.error(error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get affiliate details
  fastify.get('/:id', { onRequest: requireAuth }, async (request, reply) => {
    try {
      const user = request.user as { tenantId: string };
      if (!user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params as { id: string };

      const { data: affiliate, error } = await supabase
        .from('affiliates')
        .select(`
          *,
          users:user_id (
            id,
            email,
            role,
            created_at
          ),
          commission_tiers:commission_tier_id (
            name,
            commission_rate
          )
        `)
        .eq('id', id)
        .eq('tenant_id', user.tenantId)
        .single();

      if (error) throw error;

      return { affiliate };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
} 