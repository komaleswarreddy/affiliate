import { FastifyInstance } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { JWTPayload, User } from '../types';

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

export async function userRoutes(fastify: FastifyInstance) {
  // Get current user details
  fastify.get('/me', async (request, reply) => {
    try {
      const token = request.headers.authorization?.split(' ')[1];
      if (!token) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const decoded = fastify.jwt.verify<JWTPayload>(token);
      if (!decoded) {
        return reply.status(401).send({ error: 'Invalid token' });
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.id)
        .single();

      if (error) {
        request.log.error('User fetch error:', error);
        throw error;
      }

      // Remove password from user object
      const { password, ...userWithoutPassword } = user;

      return { user: userWithoutPassword };
    } catch (error) {
      request.log.error('Get user error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Update current user details
  fastify.put('/me', async (request, reply) => {
    try {
      const token = request.headers.authorization?.split(' ')[1];
      if (!token) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const decoded = fastify.jwt.verify<JWTPayload>(token);
      if (!decoded) {
        return reply.status(401).send({ error: 'Invalid token' });
      }

      const { full_name, email } = request.body as { full_name?: string; email?: string };

      const { data: user, error } = await supabase
        .from('users')
        .update({ full_name, email })
        .eq('id', decoded.id)
        .select()
        .single();

      if (error) {
        request.log.error('User update error:', error);
        throw error;
      }

      // Remove password from user object
      const { password, ...userWithoutPassword } = user;

      return { user: userWithoutPassword };
    } catch (error) {
      request.log.error('Update user error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get all users in tenant (admin only)
  fastify.get('/', async (request, reply) => {
    try {
      const token = request.headers.authorization?.split(' ')[1];
      if (!token) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const decoded = fastify.jwt.verify<JWTPayload>(token);
      if (!decoded) {
        return reply.status(401).send({ error: 'Invalid token' });
      }

      // Only admin can list users
      if (decoded.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', decoded.tenantId);

      if (error) {
        request.log.error('Users fetch error:', error);
        throw error;
      }

      // Remove passwords from user objects
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);

      return { users: usersWithoutPasswords };
    } catch (error) {
      request.log.error('List users error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
} 