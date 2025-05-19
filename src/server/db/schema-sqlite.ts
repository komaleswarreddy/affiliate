import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

// Define tenants table
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
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
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  settings: text('settings').default('{}')
});

// Define users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  countryCode: text('country_code').default('US'),
  timezone: text('timezone').default('America/New_York'),
  language: text('language').default('en'),
  referralCode: text('referral_code'),
  roleId: text('role_id'),
  termsAccepted: integer('terms_accepted', { mode: 'boolean' }).notNull().default(0),
  marketingConsent: integer('marketing_consent', { mode: 'boolean' }).notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now),
  isAffiliate: integer('is_affiliate', { mode: 'boolean' }).notNull().default(0)
});

// Define roles table
export const roles = sqliteTable('roles', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  description: text('description'),
  permissions: text('permissions').notNull(),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(0),
  createdBy: text('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(Date.now)
});

// Define affiliates table
export const affiliates = sqliteTable('affiliates', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  userId: text('user_id').notNull().references(() => users.id),
  referralCode: text('referral_code').notNull().unique(),
  currentTierId: text('current_tier_id'),
  parentAffiliateId: text('parent_affiliate_id'),
  companyName: text('company_name'),
  websiteUrl: text('website_url'),
  socialMedia: text('social_media').default('{}'),
  taxId: text('tax_id'),
  taxFormType: text('tax_form_type'),
  paymentThreshold: text('payment_threshold').notNull().default('50'),
  preferredCurrency: text('preferred_currency').notNull().default('USD'),
  promotionalMethods: text('promotional_methods').default('[]'),
  status: text('status').notNull().default('pending'),
  approvedBy: text('approved_by'),
  approvedAt: integer('approved_at', { mode: 'timestamp' })
}); 