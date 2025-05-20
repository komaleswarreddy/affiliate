import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth';
import { tenantRoutes } from './routes/tenants';
import { userRoutes } from './routes/users';
import { productRoutes } from './routes/products';
import { affiliateRoutes } from './routes/affiliates';
import { config } from './config';

const server = Fastify({
  logger: true,
});

// Register plugins
server.register(cors, {
  origin: true, // Allow all origins in development
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
});

server.register(jwt, {
  secret: config.jwtSecret,
});

// Register routes
server.register(authRoutes, { prefix: '/api/auth' });
server.register(tenantRoutes, { prefix: '/api/tenants' });
server.register(userRoutes, { prefix: '/api/users' });
server.register(productRoutes, { prefix: '/api' });
server.register(affiliateRoutes, { prefix: '/api/affiliates' });

// Health check route
server.get('/health', async () => {
  return { status: 'ok' };
});

// Start server
const start = async () => {
  try {
    await server.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server listening on port ${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start(); 