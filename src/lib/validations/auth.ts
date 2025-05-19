import { z } from 'zod';

// Tenant creation schema
export const tenantSchema = z.object({
  tenant_name: z.string().min(3, {
    message: 'Tenant name must be at least 3 characters.',
  }).max(255),
  domain: z.string().min(4, {
    message: 'Domain must be valid.',
  }).max(255).optional(),
  subdomain: z.string().min(3, {
    message: 'Subdomain must be at least 3 characters.',
  }).max(100)
    .regex(/^[a-z0-9-]+$/, {
      message: 'Subdomain can only contain lowercase letters, numbers, and hyphens.',
    }),
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, {
    message: 'Must be a valid hex color code.',
  }),
  secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i, {
    message: 'Must be a valid hex color code.',
  }),
  subscription_tier: z.enum(['free', 'starter', 'professional', 'enterprise']),
  max_users: z.number().int().positive(),
  max_affiliates: z.number().int().positive()
});

// User registration schema
export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, { message: 'First name is required' })
      .max(50, { message: 'First name must be less than 50 characters' }),
    lastName: z
      .string()
      .min(1, { message: 'Last name is required' })
      .max(50, { message: 'Last name must be less than 50 characters' }),
    email: z
      .string()
      .min(1, { message: 'Email is required' })
      .email({ message: 'Please enter a valid email address' }),
    password: z
      .string()
      .min(1, { message: 'Password is required' })
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
      .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password' }),
    companyName: z
      .string()
      .min(1, { message: 'Company name is required' })
      .max(100, { message: 'Company name must be less than 100 characters' }),
    tenant: z
      .string()
      .min(1, { message: 'Subdomain is required' })
      .max(50, { message: 'Subdomain must be less than 50 characters' })
      .regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, {
        message: 'Subdomain can only contain lowercase letters, numbers, and hyphens. It cannot start or end with a hyphen.',
      }),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: 'You must accept the terms and conditions',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Login schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' }),
  remember: z.boolean().optional().default(false),
  tenant: z.string().min(1, { message: 'Tenant is required' }),
});

// Password reset request schema
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  tenant: z.string().min(1, { message: 'Tenant is required' }),
});

// Password reset schema
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, { message: 'Password is required' })
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
      .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password' }),
    token: z.string().min(1, { message: 'Reset token is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Profile update schema
export const profileUpdateSchema = z.object({
  first_name: z.string().min(2, {
    message: 'First name must be at least 2 characters.',
  }).max(100),
  last_name: z.string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }).max(100),
  phone: z.string().optional(),
  country_code: z.string().length(2, {
    message: 'Please select a country.',
  }),
  timezone: z.string(),
  language: z.string().length(2, {
    message: 'Please select a language.',
  }),
  marketing_consent: z.boolean().optional()
});