import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db';
import { users, tenants, passwordResetTokens, roles } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { hashPassword, comparePasswords } from '../utils/password';
import { TRIAL_PERIOD_DAYS } from '../../lib/constants';
import { generateUUID } from '../utils/uuid';
import { isDevelopment } from '../../lib/utils';

// Define schemas for validation
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenant: z.string(),
});

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string().min(1),
  companyName: z.string().min(1),
  tenant: z.string().min(1).regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, {
    message: 'Subdomain can only contain lowercase letters, numbers, and hyphens. It cannot start or end with a hyphen.',
  }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  tenant: z.string(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8),
  token: z.string(),
});

const verifyTokenSchema = z.object({
  token: z.string(),
});

// Helper function to generate JWT token
const generateToken = (payload: any) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set. Please set it in your .env file.');
  }
  return jwt.sign(
    payload,
    jwtSecret,
    { expiresIn: '24h' }
  );
};

export const authRoutes = async (server: FastifyInstance) => {
  // Login endpoint
  server.post('/login', async (request, reply) => {
    try {
      // Validate input
      let body;
      
      try {
        body = loginSchema.parse(request.body);
        
        // Check email format
        if (!body.email.includes('@')) {
          return reply.code(400).send({ 
            error: 'Invalid email format',
            field: 'email',
            message: 'Please provide a valid email address with @ character'
          });
        }
      } catch (validationError) {
        // Handle validation errors with detailed messages
        if (validationError instanceof z.ZodError) {
          const errors = validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }));
          
          return reply.code(400).send({
            error: 'Validation failed',
            details: errors
          });
        }
        throw validationError;
      }
      
      // Get tenant ID from subdomain
      const normalizedTenant = body.tenant.toLowerCase();
      
      // First find all tenants with matching subdomain (case-insensitive)
      const tenantsResult = await db
        .select()
        .from(tenants)
        .where(
          // Use direct string comparison
          eq(sql`LOWER(${tenants.subdomain})`, normalizedTenant)
        )
        .limit(1);

      if (tenantsResult.length === 0) {
        return reply.code(401).send({ error: 'Invalid tenant or credentials' });
      }

      const tenant = tenantsResult[0];

      // Find user in the specified tenant
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            // Case-insensitive email comparison
            sql`LOWER(${users.email}) = ${body.email.toLowerCase()}`,
            eq(users.tenantId, tenant.id)
          )
        )
        .limit(1);

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const isPasswordValid = await comparePasswords(body.password, user.password);
      if (!isPasswordValid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }
      
      // Get user roles and permissions
      let userRoles = ['user'];
      let userPermissions: string[] = [];
      
      if (user.roleId) {
        const [userRole] = await db
          .select()
          .from(roles)
          .where(eq(roles.id, user.roleId))
          .limit(1);
          
        if (userRole) {
          userRoles = [userRole.name];
          
          // Safely handle permissions with better error checking
          try {
            // First try to parse as JSON if it's a string
            if (typeof userRole.permissions === 'string') {
              try {
                const parsedPermissions = JSON.parse(userRole.permissions);
                if (Array.isArray(parsedPermissions)) {
                  userPermissions = parsedPermissions;
                } else if (typeof parsedPermissions === 'object' && parsedPermissions !== null) {
                  // If it's an object, extract values as an array
                  userPermissions = Object.values(parsedPermissions)
                    .filter(item => typeof item === 'string');
                } else {
                  userPermissions = [];
                  server.log.warn('Unexpected permissions format (not an array or object):', userRole.permissions);
                }
              } catch (parseError) {
                server.log.error('Error parsing permissions JSON:', parseError);
                userPermissions = [];
              }
            }
            // Handle if it's already an array
            else if (Array.isArray(userRole.permissions)) {
              userPermissions = userRole.permissions;
            }
            // Default to empty permissions if invalid format
            else {
              userPermissions = [];
              server.log.warn('Unexpected permissions format:', typeof userRole.permissions);
            }
          } catch (error) {
            server.log.error('Error handling permissions:', error);
            userPermissions = [];
          }
        }
      }
      
      // Generate JWT
      const token = generateToken({ 
        userId: user.id,
        email: user.email,
        tenantId: tenant.id,
        roles: userRoles
      });

      // Return token and user data
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          tenantId: tenant.id,
          roles: userRoles,
          permissions: userPermissions
        }
      };
    } catch (error) {
      server.log.error('Login error:', error);
      return reply.code(400).send({
        error: error instanceof Error ? error.message : 'An error occurred during login'
      });
    }
  });

  // Register endpoint
  server.post('/register', async (request, reply) => {
    try {
      // Parse and validate input
      let body;
      
      try {
        body = registerSchema.parse(request.body);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          const errors = validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }));
          
          return reply.code(400).send({
            error: 'Validation failed',
            details: errors
          });
        }
        throw validationError;
      }

      // Normalize subdomain to lowercase
      const normalizedSubdomain = body.tenant.toLowerCase();

      // Transaction to ensure atomicity
      try {
        // Check if tenant subdomain is available
        const existingTenant = await db
          .select()
          .from(tenants)
          .where(
            eq(sql`LOWER(${tenants.subdomain})`, normalizedSubdomain)
          )
          .limit(1);

        if (existingTenant.length > 0) {
          return reply.code(400).send({ error: 'Subdomain already in use' });
        }
        
        // Check if email is already registered
        const existingUser = await db
          .select()
          .from(users)
          .where(
            eq(sql`LOWER(${users.email})`, body.email.toLowerCase())
          )
          .limit(1);
          
        if (existingUser.length > 0) {
          return reply.code(400).send({ error: 'Email already in use' });
        }
        
        // Generate UUIDs
        const tenantId = generateUUID();
        const userId = generateUUID();

        // Set trial period
        const trialEnds = new Date();
        trialEnds.setDate(trialEnds.getDate() + TRIAL_PERIOD_DAYS);
        
        // Hash password
        const hashedPassword = await hashPassword(body.password);

        // Create tenant
        await db.insert(tenants).values({
          id: tenantId,
          name: body.companyName,
          subdomain: normalizedSubdomain,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active',
          planType: 'trial',
          trialEndsAt: trialEnds
        });
        
        // Create default admin role
        const adminRoleId = generateUUID();
        await db.insert(roles).values({
          id: adminRoleId,
          name: 'admin',
          tenantId: tenantId,
          permissions: JSON.stringify(['*']), // Admin has all permissions
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Create user
        await db.insert(users).values({
          id: userId,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email.toLowerCase(),
          password: hashedPassword,
          tenantId: tenantId,
          roleId: adminRoleId,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Generate token
        const token = generateToken({
          userId,
          email: body.email,
          tenantId,
          roles: ['admin']
        });
        
        // Return token and user data
        return {
          token,
          user: {
            id: userId,
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            tenantId: tenantId,
            roles: ['admin'],
            permissions: ['*']
          }
        };
      } catch (error) {
        // Log detailed error information
        console.error('================================');
        console.error('Database error during registration:');
        console.error('Request body:', request.body);
        
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
          console.error('Error name:', error.name);
          // Log all properties of the error
          console.error('Error properties:', Object.getOwnPropertyNames(error).reduce((obj, prop) => {
            obj[prop] = (error as any)[prop];
            return obj;
          }, {} as any));
        }
        console.error('================================');
        
        // Improved error message for database errors
        let errorMessage = 'Failed to create account. Please try again later.';
        
        // If it's a SQLite error, it might contain more specific info about column constraints
        if (error instanceof Error) {
          if (error.message.includes('UNIQUE constraint failed')) {
            if (error.message.includes('tenants.subdomain')) {
              errorMessage = 'This subdomain is already in use. Please choose another one.';
            } else if (error.message.includes('users.email')) {
              errorMessage = 'This email is already registered. Please use a different email.';
            }
          } else if (error.message.includes('no such column')) {
            server.log.error('Database schema error:', {
              message: error.message,
              stack: error.stack
            });
            errorMessage = 'Database configuration error. Please contact support.';
          } else if (error.message.includes('foreign key constraint failed')) {
            errorMessage = 'Database integrity error: Foreign key constraint failed.';
          }
        }
        
        return reply.code(500).send({
          error: errorMessage
        });
      }
    } catch (error) {
      server.log.error('Registration error:', error);
      return reply.code(400).send({
        error: error instanceof Error ? error.message : 'An error occurred during registration'
      });
    }
  });

  // Forgot password endpoint
  server.post('/forgot-password', async (request, reply) => {
    try {
      const body = forgotPasswordSchema.parse(request.body);
      
      // Find the tenant
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.subdomain, body.tenant))
        .limit(1);
        
      if (!tenant) {
        // Do not reveal if tenant exists or not for security
        return { success: true };
      }
      
      // Find the user
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, body.email),
            eq(users.tenantId, tenant.id)
          )
        )
        .limit(1);
        
      if (!user) {
        // Do not reveal if user exists or not for security
        return { success: true };
      }
      
      // Generate a secure reset token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenId = generateUUID();
      
      // Set expiry to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Store token in database
      await db.insert(passwordResetTokens).values({
        id: tokenId,
        userId: user.id,
        token: token,
        expiresAt: expiresAt
      });
      
      // In a real application, send email with reset link
      // For development, log the token
      if (isDevelopment) {
        console.log(`Password reset token for ${user.email}: ${token}`);
      }
      
      return { success: true };
    } catch (error) {
      server.log.error(error);
      return reply.code(400).send({
        error: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  });

  // Reset password endpoint
  server.post('/reset-password', async (request, reply) => {
    try {
      const body = resetPasswordSchema.parse(request.body);
      
      // Find the reset token
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, body.token))
        .limit(1);
        
      if (!resetToken) {
        return reply.code(400).send({ error: 'Invalid or expired token' });
      }
      
      // Check if token is expired
      const now = new Date();
      if (resetToken.expiresAt < now) {
        // Delete expired token
        await db
          .delete(passwordResetTokens)
          .where(eq(passwordResetTokens.id, resetToken.id));
          
        return reply.code(400).send({ error: 'Token has expired' });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(body.password);
      
      // Update user's password
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, resetToken.userId));
        
      // Delete the used token
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.id, resetToken.id));
        
      return { success: true };
    } catch (error) {
      server.log.error(error);
      return reply.code(400).send({
        error: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  });

  // Verify token endpoint
  server.post('/verify-token', async (request, reply) => {
    try {
      const body = verifyTokenSchema.parse(request.body);
      
      try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          throw new Error('JWT_SECRET environment variable is not set');
        }
        
        jwt.verify(body.token, jwtSecret);
        return { valid: true };
      } catch (error) {
        return { valid: false };
      }
    } catch (error) {
      server.log.error(error);
      return reply.code(400).send({
        error: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  });
}; 