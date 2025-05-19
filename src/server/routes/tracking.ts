import { FastifyInstance } from 'fastify';

/**
 * Tracking link routes for tracking affiliate referrals
 */
export const trackingRoutes = async (fastify: FastifyInstance) => {
  // Get all tracking links for a tenant
  fastify.get('/', async (request, reply) => {
    // This would normally fetch from the database
    // Sending mock data for now
    return {
      links: [
        {
          id: '1',
          affiliateId: '1',
          name: 'Homepage Link',
          url: 'https://example.com?ref=JANE2025',
          parameters: { utm_source: 'affiliate', utm_medium: 'referral' },
          clicks: 325,
          conversions: 28,
          createdAt: '2025-01-15T10:30:00Z'
        },
        {
          id: '2',
          affiliateId: '2',
          name: 'Product Page Link',
          url: 'https://example.com/product?ref=ALEX2025',
          parameters: { utm_source: 'affiliate', utm_medium: 'referral' },
          clicks: 215,
          conversions: 17,
          createdAt: '2025-02-10T14:20:00Z'
        }
      ]
    };
  });

  // Get a specific tracking link
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    // This would normally fetch from the database
    return {
      id,
      affiliateId: '1',
      name: 'Homepage Link',
      url: 'https://example.com?ref=JANE2025',
      parameters: { utm_source: 'affiliate', utm_medium: 'referral' },
      clicks: 325,
      conversions: 28,
      createdAt: '2025-01-15T10:30:00Z'
    };
  });

  // Create a new tracking link
  fastify.post('/', async (request, reply) => {
    const payload = request.body as any;
    
    // This would normally save to the database
    return {
      id: '3',
      ...payload,
      clicks: 0,
      conversions: 0,
      createdAt: new Date().toISOString()
    };
  });

  // Update a tracking link
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const payload = request.body as any;
    
    // This would normally update in the database
    return {
      id,
      ...payload,
      updatedAt: new Date().toISOString()
    };
  });

  // Delete a tracking link
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    // This would normally delete from the database
    return { success: true, message: `Tracking link ${id} deleted successfully` };
  });

  // Track a click on a tracking link
  fastify.post('/click/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { referrer, userAgent, ip } = request.body as any;
    
    // This would normally record the click in the database
    return { 
      success: true, 
      message: `Click recorded for tracking link ${id}`,
      redirectUrl: 'https://example.com'
    };
  });

  // Record a conversion from a tracking link
  fastify.post('/conversion/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { orderId, amount, products } = request.body as any;
    
    // This would normally record the conversion in the database
    return { 
      success: true, 
      message: `Conversion recorded for tracking link ${id}` 
    };
  });
}; 