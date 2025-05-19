import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { JWTPayload, User, Tenant } from '../types';

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

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

      // Create user in auth.users first
      request.log.info('Creating auth user...');
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: 'admin'
          }
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

      request.log.info('Auth user created successfully:', { userId: authUser.user.id });

      // Create tenant with the user's ID
      const tenantData = {
        name: data.companyName,
        plan: 'trial',
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: authUser.user.id
      };
      
      request.log.info('Creating tenant with data:', tenantData);

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([tenantData])
        .select()
        .single();

      if (tenantError) {
        request.log.error('Tenant creation error:', {
          error: tenantError,
          code: tenantError.code,
          message: tenantError.message,
          details: tenantError.details,
          hint: tenantError.hint
        });
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

      // Authenticate user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        request.log.error('Supabase Auth login error:', authError);
        // Return 401 for invalid credentials as Supabase Auth errors don't always have a specific status for this
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      if (!authData.user) {
         request.log.error('Supabase Auth login succeeded but no user data returned');
         return reply.status(401).send({ error: 'Invalid credentials' });
      }

      // Fetch user from public.users table using the authenticated user's ID
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, role, tenant_id') // Select relevant fields, exclude password
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        request.log.error('Public user fetch error after auth login:', userError);
        return reply.status(500).send({ error: 'Internal server error' });
      }

      if (!user) {
         request.log.error('Public user not found after successful auth login for user ID:', authData.user.id);
         return reply.status(500).send({ error: 'Internal server error' });
      }

      // Generate JWT token
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
      } as JWTPayload);

      request.log.info('Login successful for user:', { userId: user.id });

      // Return token and user data (excluding password)
      return { token, user };
    } catch (error) {
      request.log.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
} 