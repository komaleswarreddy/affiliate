import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { JWTPayload, User, Tenant } from '../types';

// Create two clients - one for auth operations and one for service role operations
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceKey);

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  websiteUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
  phoneNumber: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Signup route
  fastify.post('/signup', async (request, reply) => {
    try {
      // Log the raw request body for debugging
      request.log.info('Raw request body:', request.body);

      const data = signupSchema.parse(request.body);
      request.log.info('Parsed signup data:', { 
        email: data.email, 
        companyName: data.companyName,
        hasPassword: !!data.password,
        hasFullName: !!data.fullName
      });

      // Create user in auth.users first - USING ADMIN CLIENT FOR DIRECT CREATION
      request.log.info('Creating auth user...');
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // This ensures the email is confirmed immediately
        user_metadata: {
          full_name: data.fullName,
          role: 'admin'
        }
      });

      if (authError) {
        request.log.error('Auth user creation error:', {
          error: authError,
          message: authError.message,
          status: authError.status
        });
        // If user already exists, return 400
        if (authError.status === 400 && authError.message.includes('already an existing user')) {
             return reply.status(400).send({ error: 'User with this email already exists' });
        }
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      if (!authUser.user) {
        request.log.error('No user data returned from auth.signUp');
        throw new Error('Auth user creation succeeded but no user data returned');
      }

      request.log.info('Auth user created successfully:', { 
        userId: authUser.user.id,
        email: authUser.user.email,
        metadata: authUser.user.user_metadata
      });

      // Wait a short moment to ensure the auth user is fully created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify the user exists in auth.users using RPC
      const { data: verifyUser, error: verifyError } = await supabase
        .rpc('verify_auth_user', {
          p_user_id: authUser.user.id
        });

      if (verifyError || !verifyUser) {
        request.log.error('Failed to verify auth user:', { 
          error: verifyError,
          userId: authUser.user.id
        });
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error('Failed to verify auth user creation');
      }

      request.log.info('Verified auth user exists:', { userId: verifyUser.id });

      // Create tenant with the user's ID
      const tenantData = {
        name: data.companyName,
        plan: 'trial',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: authUser.user.id
      };
      
      request.log.info('Creating tenant with data:', tenantData);

      // Use RPC function to create tenant with proper permissions
      const { data: tenant, error: tenantError } = await supabase
        .rpc('create_tenant', {
          p_name: data.companyName,
          p_created_by: authUser.user.id
        });

      if (tenantError) {
        request.log.error('Tenant creation error:', {
          error: tenantError,
          code: tenantError.code,
          message: tenantError.message,
          details: tenantError.details,
          hint: tenantError.hint,
          userId: authUser.user.id
        });
        // If tenant creation fails, we should clean up the auth user
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
      }

      if (!tenant) {
        request.log.error('No tenant data returned after creation');
        throw new Error('Tenant creation succeeded but no data returned');
      }

      request.log.info('Tenant created successfully:', { tenantId: tenant.id });

      // Create user in public.users
      const userData = {
        id: authUser.user.id,
        email: data.email,
        role: 'admin',
        tenant_id: tenant.id
      };

      request.log.info('Creating public user with data:', userData);

      const { data: user, error: userError } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (userError) {
        request.log.error('Public user creation error:', {
          error: userError,
          code: userError.code,
          message: userError.message,
          details: userError.details,
          hint: userError.hint
        });
        // Clean up both auth user and tenant if user creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        await supabase.from('tenants').delete().eq('id', tenant.id);
        throw new Error(`Failed to create public user: ${userError.message}`);
      }

      if (!user) {
        request.log.error('No user data returned after creation');
        throw new Error('Public user creation succeeded but no data returned');
      }

      request.log.info('Public user created successfully:', { userId: user.id });

      // Create subscription
      const subscriptionData = {
        tenant_id: tenant.id,
        plan: 'trial',
        status: 'trial',
        is_trial: true,
        start_date: new Date().toISOString(),
      };

      request.log.info('Creating subscription with data:', subscriptionData);

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([subscriptionData]);

      if (subscriptionError) {
        request.log.error('Subscription creation error:', {
          error: subscriptionError,
          code: subscriptionError.code,
          message: subscriptionError.message,
          details: subscriptionError.details,
          hint: subscriptionError.hint
        });
        throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
      }

      request.log.info('Subscription created successfully');

      // Generate JWT token
      const token = fastify.jwt.sign({ 
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
      } as JWTPayload);

      request.log.info('Signup successful:', { 
        userId: user.id,
        tenantId: tenant.id,
        email: user.email
      });

      return { token, user };
    } catch (error) {
      request.log.error('Signup error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }

      // Send a more detailed error message to the client
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return reply.status(500).send({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Login route
  fastify.post('/login', async (request, reply) => {
    try {
      const data = loginSchema.parse(request.body);
      request.log.info('Login attempt for:', { email: data.email });

      // First, check if the user exists in auth.users
      const { data: userCheck, error: userCheckError } = await supabaseAdmin
        .auth
        .admin
        .listUsers();

      // Filter users manually since the filters param is not in the type definition
      const matchingUsers = userCheck?.users?.filter(u => u.email === data.email) || [];
      
      if (userCheckError) {
        request.log.error('Error checking if user exists:', userCheckError);
      } else {
        request.log.info('User check result:', { 
          found: matchingUsers.length > 0,
          userCount: matchingUsers.length
        });
      }

      // Authenticate user with Supabase Auth
      let authData = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authData.error) {
        request.log.error('Supabase Auth login error:', {
          error: authData.error,
          message: authData.error.message,
          status: authData.error.status
        });
        
        // Try to provide more specific error messages
        if (authData.error.message.includes('Email not confirmed')) {
          // If the issue is unconfirmed email, let's auto-confirm it
          request.log.info('Attempting to auto-confirm email for user:', data.email);
          
          // Find the user ID first
          const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
          const matchingUser = userData?.users?.find(u => u.email === data.email);
          
          if (matchingUser) {
            const userId = matchingUser.id;
            
            // Update user to confirm email
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              email_confirm: true
            });
            
            request.log.info('Email confirmed for user, retrying login');
            
            // Try login again
            const retryAuthData = await supabase.auth.signInWithPassword({
              email: data.email,
              password: data.password,
            });
            
            if (retryAuthData.error) {
              request.log.error('Retry login failed:', retryAuthData.error);
              return reply.status(401).send({ error: 'Invalid email or password' });
            }
            
            // If retry succeeded, replace the auth data
            authData = retryAuthData;
          } else {
            return reply.status(401).send({ error: 'Invalid email or password' });
          }
        } else {
          // For other auth errors
          return reply.status(401).send({ error: 'Invalid email or password' });
        }
      }

      if (!authData.data || !authData.data.user) {
        request.log.error('Supabase Auth login succeeded but no user data returned');
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      request.log.info('Auth login successful, fetching user profile:', { userId: authData.data.user.id });

      // Fetch user from public.users table using the authenticated user's ID
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, role, tenant_id') // Select relevant fields, exclude password
        .eq('id', authData.data.user.id)
        .single();

      if (userError) {
        request.log.error('Public user fetch error after auth login:', userError);
        
        // Special handling for "no rows returned" - this means the user exists in auth but not in public.users
        if (userError.code === 'PGRST116') {
          request.log.info('User exists in auth but not in public.users, creating public user record');
          
          // Try to create the public user record
          const { data: tenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('created_by', authData.data.user.id)
            .single();
            
          if (tenant) {
            // Create user in public.users
            const userData = {
              id: authData.data.user.id,
              email: data.email,
              role: 'admin',
              tenant_id: tenant.id
            };
            
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert([userData])
              .select()
              .single();
              
            if (createError) {
              request.log.error('Failed to create missing public user:', createError);
              return reply.status(500).send({ error: 'Failed to complete login process' });
            }
            
            // Use the newly created user
            user = newUser;
          } else {
            request.log.error('Could not find tenant for auth user:', authData.data.user.id);
            return reply.status(500).send({ error: 'Account setup incomplete' });
          }
        } else {
          return reply.status(500).send({ error: 'Internal server error' });
        }
      }

      if (!user) {
        request.log.error('Public user not found after successful auth login for user ID:', authData.data.user.id);
        return reply.status(500).send({ error: 'Internal server error' });
      }

        // Generate JWT token
        const token = fastify.jwt.sign({
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          tenantId: existingUser.tenant_id,
        } as JWTPayload);

        request.log.info('Login successful:', { 
          userId: existingUser.id,
          role: existingUser.role,
          email: existingUser.email 
        });

        // Return token and user data
        return { token, user: existingUser };
      } catch (authError) {
        request.log.error('Authentication error:', {
          error: authError,
          message: authError instanceof Error ? authError.message : 'Unknown error',
          stack: authError instanceof Error ? authError.stack : undefined
        });
        return reply.status(401).send({ error: 'Invalid credentials' });
      }
    } catch (error) {
      request.log.error('Login error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
} 