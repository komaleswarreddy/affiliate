import Fastify from 'fastify';
import * as dotenv from 'dotenv';
import { configureSecurity } from './security';
import { configureDatabase } from './db';
import { authRoutes } from './routes/auth';
import { isDevelopment } from '../lib/utils';

// Load environment variables from .env files
console.log('Loading environment variables...');
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

// Conditionally load environment-specific variables
if (isDevelopment) {
  console.log('Loading development environment variables...');
  dotenv.config({ path: '.env.development', override: true });
} else {
  console.log('Loading production environment variables...');
  dotenv.config({ path: '.env.production', override: true });
}

// Create the Fastify server
console.log('Creating Fastify server...');
const server = Fastify({
  logger: {
    level: isDevelopment ? 'debug' : 'info',
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  },
  disableRequestLogging: false,
});

// Log server configuration details
console.log(`Server environment: ${isDevelopment ? 'Development' : 'Production'}`);
console.log(`API URL: ${process.env.VITE_API_URL || 'Not set'}`);

const startServer = async () => {
  try {
    // Configure server components
    console.log('Configuring security settings...');
    configureSecurity(server);
    
    console.log('Configuring database connection...');
    await configureDatabase(server);
    
    // Register API routes
    console.log('Registering API routes...');
    
    // Register root route for quick test
    server.get('/', async (request, reply) => {
      reply.header('Access-Control-Allow-Origin', '*');
      return { 
        message: 'Affiliate Management Platform API', 
        status: 'ok',
        version: '1.0.0',
        environment: isDevelopment ? 'development' : 'production',
        endpoints: ['/api/auth', '/api/health']
      };
    });
    
    // Register health check route
    server.get('/api/health', async (request, reply) => {
      reply.header('Access-Control-Allow-Origin', '*');
      return { 
        status: 'ok', 
        mode: isDevelopment ? 'development' : 'production',
        timestamp: new Date().toISOString()
      };
    });
    
    // Register auth routes - explicitly set OPTIONS handler for CORS
    server.register(async (instance) => {
      // Register OPTIONS handler for auth routes
      instance.options('/*', (request, reply) => {
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Tenant-ID');
        reply.code(204).send();
      });
      
      // Register auth routes
      instance.register(authRoutes);
    }, { prefix: '/api/auth' });
    
    // Register affiliate routes
    server.register(async (instance) => {
      instance.get('/', async () => {
        return { message: 'Affiliate API' };
      });
    }, { prefix: '/api/affiliates' });
    
    // Set up global error handler
    server.setErrorHandler((error, request, reply) => {
      server.log.error(`Error processing request: ${error.message}`);
      console.error('Server error details:', error);
      reply.status(500).send({ 
        error: isDevelopment ? error.message : 'Internal Server Error',
        path: request.url
      });
    });
    
    // Start the server with a try-catch to handle port conflicts
    const port = parseInt(process.env.PORT || '3000', 10);
    console.log(`Starting server on port ${port}...`);
    try {
      await server.listen({ port, host: '0.0.0.0' });
      console.log(`Server is running on http://localhost:${port}`);
    } catch (err) {
      // Check if this is an "address in use" error
      if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'EADDRINUSE') {
        const alternatePort = port + 1;
        console.log(`Port ${port} is already in use, trying port ${alternatePort}...`);
        await server.listen({ port: alternatePort, host: '0.0.0.0' });
        console.log(`Server is running on http://localhost:${alternatePort}`);
      } else {
        throw err;
      }
    }
  } catch (err) {
    server.log.error(err);
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start the server
startServer().catch(err => {
  console.error('Unhandled error during server startup:', err);
  process.exit(1);
});