import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Define tenants table for SQLite
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(), // We'll manually generate UUIDs in JavaScript
  name: text('name').notNull(),
  subdomain: text('subdomain').notNull().unique(),
  domain: text('domain'),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#3667CE'),
  secondaryColor: text('secondary_color').default('#36A490'),
  subscriptionTier: text('subscription_tier').notNull().default('standard'),
  maxUsers: integer('max_users').notNull().default(5),
  maxAffiliates: integer('max_affiliates').notNull().default(20),
  status: text('status').notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  settings: text('settings').default('{}')
});

// Define users table for SQLite
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // We'll manually generate UUIDs in JavaScript
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // Hashed password
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  countryCode: text('country_code').default('US'),
  timezone: text('timezone').default('America/New_York'),
  language: text('language').default('en'),
  referralCode: text('referral_code'),
  roleId: text('role_id'),
  termsAccepted: integer('terms_accepted', { mode: 'boolean' }).notNull().default(false),
  marketingConsent: integer('marketing_consent', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  isAffiliate: integer('is_affiliate', { mode: 'boolean' }).notNull().default(false)
});

// Define roles table for SQLite
export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(), // We'll manually generate UUIDs in JavaScript
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  description: text('description'),
  permissions: text('permissions').notNull(), // JSON as string
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`)
});

// Create the password reset tokens table for SQLite
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(), // We'll manually generate UUIDs in JavaScript
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`)
});

// Helper function to create SQL expressions in SQLite
function sql(strings: TemplateStringsArray, ...values: any[]) {
  return { sql: strings.join('?'), values };
} 