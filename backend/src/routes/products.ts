import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  product_commission: z.number().min(0).max(100).optional(),
  image_url: z.string().url().optional(),
  is_active: z.boolean().optional(),
});

const updateProductSchema = createProductSchema.partial();

export async function productRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) throw new Error('No authorization header');
      const token = authHeader.split(' ')[1];
      const decoded = fastify.jwt.verify(token);
      request.user = decoded;
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Get all products for the tenant
  fastify.get('/products', async (request, reply) => {
    try {
      const user = request.user as { tenantId: string };
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', user.tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return products;
    } catch (error) {
      request.log.error('Error fetching products:', error);
      return reply.status(500).send({ error: error instanceof Error ? error.message : 'Failed to fetch products' });
    }
  });

  // Get a single product
  fastify.get('/products/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user as { tenantId: string };
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', user.tenantId)
        .single();
      if (error) throw error;
      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      return product;
    } catch (error) {
      request.log.error('Error fetching product:', error);
      return reply.status(500).send({ error: error instanceof Error ? error.message : 'Failed to fetch product' });
    }
  });

  // Create a new product
  fastify.post('/products', async (request, reply) => {
    try {
      const data = createProductSchema.parse(request.body);
      const user = request.user as { id: string; tenantId: string };
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });
      const { data: product, error } = await supabase
        .from('products')
        .insert([
          {
            ...data,
            tenant_id: user.tenantId,
            created_by: user.id,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return product;
    } catch (error) {
      request.log.error('Error creating product:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(500).send({ error: error instanceof Error ? error.message : 'Failed to create product' });
    }
  });

  // Update a product
  fastify.put('/products/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateProductSchema.parse(request.body);
      const user = request.user as { id: string; tenantId: string };
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });
      // First check if product exists and belongs to tenant
      const { data: existingProduct, error: fetchError } = await supabase
        .from('products')
        .select('id')
        .eq('id', id)
        .eq('tenant_id', user.tenantId)
        .single();
      if (fetchError || !existingProduct) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      const { data: product, error } = await supabase
        .from('products')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', user.tenantId)
        .select()
        .single();
      if (error) throw error;
      return product;
    } catch (error) {
      request.log.error('Error updating product:', error);
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      return reply.status(500).send({ error: error instanceof Error ? error.message : 'Failed to update product' });
    }
  });

  // Delete a product
  fastify.delete('/products/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const user = request.user as { id: string; tenantId: string };
      if (!user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      // First check if product exists and belongs to tenant
      const { data: existingProduct, error: fetchError } = await supabase
        .from('products')
        .select('id')
        .eq('id', id)
        .eq('tenant_id', user.tenantId)
        .single();
      if (fetchError || !existingProduct) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('tenant_id', user.tenantId);
      if (deleteError) {
        request.log.error('Supabase delete error:', deleteError);
        return reply.status(500).send({ error: deleteError.message || 'Failed to delete product' });
      }
      return { message: 'Product deleted successfully' };
    } catch (error) {
      request.log.error('Error deleting product:', error);
      return reply.status(500).send({ error: error instanceof Error ? error.message : 'Failed to delete product' });
    }
  });
} 