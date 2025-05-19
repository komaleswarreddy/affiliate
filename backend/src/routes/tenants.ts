import { FastifyInstance } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import type { JWTPayload } from '../types';

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

export async function tenantRoutes(fastify: FastifyInstance) {
  // Get current tenant details
  fastify.get('/me', async (request, reply) => {
    try {
      const token = request.headers.authorization?.split(' ')[1];
      if (!token) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const decoded = fastify.jwt.verify(token) as JWTPayload;
      if (!decoded) {
        return reply.status(401).send({ error: 'Invalid token' });
      }

      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', decoded.tenantId)
        .single();

      if (error) {
        request.log.error('Tenant fetch error:', error);
        throw error;
      }

      return { tenant };
    } catch (error) {
      request.log.error('Get tenant error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Update tenant details
  fastify.put('/me', async (request, reply) => {
    try {
      const token = request.headers.authorization?.split(' ')[1];
      if (!token) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const decoded = fastify.jwt.verify(token) as JWTPayload;
      if (!decoded) {
        return reply.status(401).send({ error: 'Invalid token' });
      }

      // Only admin can update tenant details
      if (decoded.role !== 'admin') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { name, plan } = request.body as { name?: string; plan?: string };

      const { data: tenant, error } = await supabase
        .from('tenants')
        .update({ name, plan })
        .eq('id', decoded.tenantId)
        .select()
        .single();

      if (error) {
        request.log.error('Tenant update error:', error);
        throw error;
      }

      return { tenant };
    } catch (error) {
      request.log.error('Update tenant error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
} 