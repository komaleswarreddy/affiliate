import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import fastifyCors from '@fastify/cors';
import { isDevelopment } from '../lib/utils';

// Define type for JWT payload
export interface UserJwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  roles?: string[];
  permissions?: string[];
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
}

// Extend FastifyRequest to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: UserJwtPayload;
  }
}

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || '';

// Define route permissions directly in this file
const routePermissions: Record<string, string[]> = {
  '/api/affiliates': ['affiliates:read'],
  '/api/affiliates/create': ['affiliates:create'],
  '/api/affiliates/update': ['affiliates:update'],
  '/api/affiliates/delete': ['affiliates:delete'],
  
  '/api/campaigns': ['campaigns:read'],
  '/api/campaigns/create': ['campaigns:create'],
  '/api/campaigns/update': ['campaigns:update'],
  '/api/campaigns/delete': ['campaigns:delete'],
  
  '/api/commissions': ['commissions:read'],
  '/api/commissions/create': ['commissions:create'],
  '/api/commissions/update': ['commissions:update'],
  '/api/commissions/delete': ['commissions:delete'],

  '/api/reports': ['reports:read'],
  
  '/api/settings': ['settings:read'],
  '/api/settings/update': ['settings:update'],
  
  '/api/users': ['users:read'],
  '/api/users/create': ['users:create'],
  '/api/users/update': ['users:update'],
  '/api/users/delete': ['users:delete'],
  
  // Default public routes
  '/api/auth/login': [],
  '/api/auth/register': [],
  '/api/auth/forgot-password': [],
  '/api/auth/reset-password': [],
  '/api/auth/verify-token': [],
  '/api/health': []
};

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  { method: 'GET', url: '/' },
  { method: 'GET', url: '/api/health' },
  { method: 'POST', url: '/api/auth/login' },
  { method: 'POST', url: '/api/auth/register' },
  { method: 'POST', url: '/api/auth/request-password-reset' },
  { method: 'POST', url: '/api/auth/validate-reset-token' },
  { method: 'POST', url: '/api/auth/update-password' },
  { method: 'POST', url: '/api/auth/verify-token' },
  { method: 'OPTIONS', url: '/api/auth/*' },
  { method: 'OPTIONS', url: '/*' }
];

// Helper to check if user has required permission
const hasPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  // If the user has the wildcard permission, they can do everything
  if (userPermissions.includes('*')) {
    return true;
  }

  // Check if the user has all the required permissions
  return requiredPermissions.every(permission => {
    // Exact match
    if (userPermissions.includes(permission)) {
      return true;
    }

    // Wildcard match (e.g., 'users:*' matches 'users:create', 'users:read', etc.)
    const resourceType = permission.split(':')[0];
    return userPermissions.includes(`${resourceType}:*`);
  });
};

/**
 * Configure security for the Fastify server
 */
export function configureSecurity(server: FastifyInstance): void {
  // Configure CORS settings
  // In development mode, allow all origins. In production, restrict to specific origins.
  const allowedOrigins = isDevelopment 
    ? '*' 
    : [
        'https://affiliatemanagement.com',
        'https://*.affiliatemanagement.com',
        'http://localhost:3000',
        'http://localhost:5173'
      ];
  
  server.register(fastifyCors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'Accept'],
    credentials: true,
    maxAge: 86400, // Cache preflight response for 24 hours (in seconds)
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Global hook to log all requests in development mode
  if (isDevelopment) {
    server.addHook('onRequest', (request, reply, done) => {
      server.log.debug(`Request: ${request.method} ${request.url}`);
      done();
    });
  }

  // Add JWT verification hook
  server.addHook('onRequest', async (request, reply) => {
    // Skip authentication for public routes
    const isPublicRoute = PUBLIC_ROUTES.some(route => {
      // Exact match
      if (route.method === request.method && route.url === request.url) {
        return true;
      }
      
      // Wildcard match
      if (route.method === request.method && route.url.endsWith('/*')) {
        const baseUrl = route.url.slice(0, -1); // Remove the trailing '*'
        if (request.url.startsWith(baseUrl)) {
          return true;
        }
      }
      
      return false;
    });

    if (isPublicRoute) {
      return;
    }

    try {
      // Extract and verify JWT token from Authorization header
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid authorization header');
      }
      
      const token = authHeader.substring(7); // Remove "Bearer " prefix
      const decoded = jwt.verify(token, JWT_SECRET) as UserJwtPayload;
      
      // Attach user to request
      request.user = decoded;
      
      // JWT is valid, now check tenant isolation
      const tenantId = request.headers['x-tenant-id'] as string;
      
      // Skip tenant check for super admins
      if (decoded.roles && decoded.roles.includes('super_admin')) {
        return;
      }
      
      // For regular users, ensure tenant ID matches
      if (tenantId && decoded.tenantId && tenantId !== decoded.tenantId) {
        throw new Error('Tenant ID mismatch');
      }
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized', message: 'You must be logged in to access this resource' });
    }
  });

  // Role-based access control
  server.addHook('onRequest', async (request, reply) => {
    // Skip RBAC for public routes and health check
    if (request.url.startsWith('/api/auth/login') || 
        request.url.startsWith('/api/auth/register') || 
        request.url.startsWith('/api/auth/forgot-password') ||
        request.url === '/api/health') {
      return;
    }

    const user = request.user;
    if (!user) {
      return reply.code(403).send({ error: 'Access denied - Authentication required' });
    }

    // Check if user has roles and permissions
    if (!user.roles || !user.permissions) {
      return reply.code(403).send({ error: 'Access denied - No roles/permissions assigned' });
    }

    // Admin users with * permission have access to everything
    if (user.permissions.includes('*')) {
      return;
    }

    // Find matching route permissions
    const route = Object.keys(routePermissions).find(path => request.url.startsWith(path));
    if (route) {
      const requiredPermissions = routePermissions[route];
      if (!hasPermission(user.permissions, requiredPermissions)) {
        return reply.code(403).send({ error: 'Access denied - Insufficient permissions' });
      }
    }
  });

  // Tenant isolation
  server.addHook('onRequest', async (request, reply) => {
    // Skip tenant check for public routes and health check
    if (request.url.startsWith('/api/auth/login') || 
        request.url.startsWith('/api/auth/register') || 
        request.url.startsWith('/api/auth/forgot-password') ||
        request.url === '/api/health') {
      return;
    }
    
    const user = request.user;
    if (!user || !user.tenantId) {
      return reply.code(403).send({ error: 'Access denied - No tenant assigned' });
    }

    // Ensure tenant header matches the user's tenant
    const tenantHeader = request.headers['x-tenant-id'];
    if (tenantHeader && tenantHeader !== user.tenantId) {
      return reply.code(403).send({ error: 'Invalid tenant access' });
    }
    
    // Add tenant ID to all request headers for database filtering
    request.headers['x-tenant-id'] = user.tenantId;
  });
}