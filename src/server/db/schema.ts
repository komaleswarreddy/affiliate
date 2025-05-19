import { pgTable, uuid, varchar, timestamp, jsonb, boolean, text, integer, decimal, primaryKey } from 'drizzle-orm/pg-core';

// Define tenants table
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  subdomain: varchar('subdomain').notNull().unique(),
  domain: varchar('domain'),
  logoUrl: varchar('logo_url'),
  primaryColor: varchar('primary_color').default('#3667CE'),
  secondaryColor: varchar('secondary_color').default('#36A490'),
  subscriptionTier: varchar('subscription_tier').notNull().default('standard'),
  maxUsers: integer('max_users').notNull().default(5),
  maxAffiliates: integer('max_affiliates').notNull().default(20),
  status: varchar('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
  settings: jsonb('settings').default({})
});

// Define users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  email: varchar('email').notNull().unique(),
  password: varchar('password').notNull(), // Hashed password
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
  phone: varchar('phone'),
  countryCode: varchar('country_code').default('US'),
  timezone: varchar('timezone').default('America/New_York'),
  language: varchar('language').default('en'),
  referralCode: varchar('referral_code'),
  roleId: uuid('role_id'),
  termsAccepted: boolean('terms_accepted').notNull().default(false),
  marketingConsent: boolean('marketing_consent').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  isAffiliate: boolean('is_affiliate').notNull().default(false)
});

// Define roles table
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name').notNull(),
  description: text('description'),
  permissions: jsonb('permissions').notNull(),
  isCustom: boolean('is_custom').notNull().default(false),
  createdBy: varchar('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Define fraud rules table
export const fraudRules = pgTable('fraud_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name').notNull(),
  description: text('description'),
  type: varchar('type').notNull(), // ip, transaction, behavior, pattern
  conditions: jsonb('conditions').notNull(),
  actions: jsonb('actions').notNull(),
  severity: varchar('severity').notNull().default('medium'), // low, medium, high, critical
  status: varchar('status').notNull().default('active'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Define fraud alerts table
export const fraudAlerts = pgTable('fraud_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  ruleId: uuid('rule_id').references(() => fraudRules.id),
  affiliateId: uuid('affiliate_id').references(() => affiliates.id),
  transactionId: varchar('transaction_id'),
  ipAddress: varchar('ip_address'),
  userAgent: varchar('user_agent'),
  details: jsonb('details').default({}),
  status: varchar('status').notNull().default('pending'), // pending, investigating, resolved, dismissed
  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Define login attempts table
export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  userId: uuid('user_id').references(() => users.id),
  email: varchar('email'),
  ipAddress: varchar('ip_address').notNull(),
  userAgent: varchar('user_agent'),
  success: boolean('success').notNull(),
  failureReason: varchar('failure_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Define marketing resources table
export const marketingResources = pgTable('marketing_resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  title: varchar('title').notNull(),
  description: text('description'),
  type: varchar('type').notNull(), // image, video, document, template
  category: varchar('category').notNull(),
  fileUrl: varchar('file_url').notNull(),
  thumbnailUrl: varchar('thumbnail_url'),
  fileSize: integer('file_size'),
  dimensions: varchar('dimensions'),
  tags: jsonb('tags').default([]),
  status: varchar('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Define marketing campaigns table
export const marketingCampaigns = pgTable('marketing_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name').notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  budget: decimal('budget'),
  status: varchar('status').notNull().default('draft'),
  goals: jsonb('goals').default([]),
  resources: jsonb('resources').default([]),
  metrics: jsonb('metrics').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Define influencers table
export const influencers = pgTable('influencers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name').notNull(),
  email: varchar('email'),
  bio: text('bio'),
  category: varchar('category').notNull(),
  platforms: jsonb('platforms').notNull(),
  followers: integer('followers').notNull(),
  engagementRate: decimal('engagement_rate'),
  contactInfo: jsonb('contact_info').default({}),
  pricing: jsonb('pricing').default({}),
  tags: jsonb('tags').default([]),
  status: varchar('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Define knowledge base table
export const knowledgeBase = pgTable('knowledge_base', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  title: varchar('title').notNull(),
  content: text('content').notNull(),
  category: varchar('category').notNull(),
  tags: jsonb('tags').default([]),
  status: varchar('status').notNull().default('published'),
  authorId: uuid('author_id').references(() => users.id),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Define notification templates table
export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name').notNull(),
  type: varchar('type').notNull(), // email, sms, push
  subject: varchar('subject'),
  content: text('content').notNull(),
  variables: jsonb('variables').default([]),
  status: varchar('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Define notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  templateId: uuid('template_id').notNull().references(() => notificationTemplates.id),
  recipientId: uuid('recipient_id').notNull().references(() => users.id),
  channel: varchar('channel').notNull(), // email, sms, push
  data: jsonb('data').default({}),
  status: varchar('status').notNull().default('pending'),
  scheduledFor: timestamp('scheduled_for'),
  sentAt: timestamp('sent_at'),
  readAt: timestamp('read_at'),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Define affiliates table first without the self-reference
export const affiliates = pgTable('affiliates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  referralCode: varchar('referral_code').notNull().unique(),
  currentTierId: uuid('current_tier_id'),
  parentAffiliateId: uuid('parent_affiliate_id'),
  companyName: varchar('company_name'),
  websiteUrl: varchar('website_url'),
  socialMedia: jsonb('social_media').default({}),
  taxId: varchar('tax_id'),
  taxFormType: varchar('tax_form_type'),
  paymentThreshold: decimal('payment_threshold').notNull().default('50'),
  preferredCurrency: varchar('preferred_currency').notNull().default('USD'),
  promotionalMethods: jsonb('promotional_methods').default([]),
  status: varchar('status').notNull().default('pending'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at')
});

// Define payment methods table
export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name').notNull(),
  description: text('description'),
  type: varchar('type').notNull(), // e.g., 'bank_transfer', 'paypal', 'stripe'
  config: jsonb('config').default({}),
  status: varchar('status').notNull().default('active'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Define commission tiers table
export const commissionTiers = pgTable('commission_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name').notNull(),
  level: integer('level').notNull(),
  baseCommissionRate: decimal('base_commission_rate').notNull(),
  rolloverRate: decimal('rollover_rate'),
  minMonthlySales: decimal('min_monthly_sales'),
  minActiveReferrals: integer('min_active_referrals'),
  bonusThreshold: decimal('bonus_threshold'),
  bonusAmount: decimal('bonus_amount'),
  recurringCommission: boolean('recurring_commission').default(false),
  recurringDuration: integer('recurring_duration'),
  effectiveDate: timestamp('effective_date').notNull(),
  expiryDate: timestamp('expiry_date'),
  status: varchar('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Define tracking links table
export const trackingLinks = pgTable('tracking_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
  destinationUrl: varchar('destination_url').notNull(),
  campaignName: varchar('campaign_name').notNull(),
  utmSource: varchar('utm_source').notNull(),
  utmMedium: varchar('utm_medium').notNull(),
  utmCampaign: varchar('utm_campaign'),
  utmContent: varchar('utm_content'),
  utmTerm: varchar('utm_term'),
  shortCode: varchar('short_code').notNull().unique(),
  qrCodeUrl: varchar('qr_code_url'),
  clickCount: integer('click_count').notNull().default(0),
  conversionCount: integer('conversion_count').notNull().default(0),
  status: varchar('status').notNull().default('active'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Define campaigns table
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name').notNull(),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  status: varchar('status').notNull().default('draft'),
  type: varchar('type').notNull(),
  requirements: jsonb('requirements').default({}),
  rewards: jsonb('rewards').notNull(),
  content: jsonb('content').notNull(),
  metrics: jsonb('metrics').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Define sales table
export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
  trackingLinkId: uuid('tracking_link_id').references(() => trackingLinks.id),
  orderId: varchar('order_id').notNull(),
  orderDate: timestamp('order_date').notNull(),
  customerEmail: varchar('customer_email'),
  total: decimal('total').notNull(),
  subtotal: decimal('subtotal').notNull(),
  tax: decimal('tax'),
  shipping: decimal('shipping'),
  discount: decimal('discount'),
  currency: varchar('currency').notNull().default('USD'),
  status: varchar('status').notNull().default('pending'),
  products: jsonb('products').default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Define payouts table
export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
  paymentMethodId: uuid('payment_method_id').notNull().references(() => paymentMethods.id),
  amount: decimal('amount').notNull(),
  currency: varchar('currency').notNull().default('USD'),
  status: varchar('status').notNull().default('pending'), // 'pending', 'approved', 'completed', 'rejected'
  notes: text('notes'),
  transactionId: varchar('transaction_id'),
  initiatedBy: uuid('initiated_by').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at')
});

// Define commission distributions table
export const commissionDistributions = pgTable('commission_distributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  saleId: uuid('sale_id').notNull().references(() => sales.id),
  beneficiaryId: uuid('beneficiary_id').notNull().references(() => affiliates.id),
  originatorId: uuid('originator_id').references(() => affiliates.id),
  tierId: uuid('tier_id').references(() => commissionTiers.id),
  amount: decimal('amount').notNull(),
  rate: decimal('rate').notNull(),
  type: varchar('type').notNull(), // direct, rollover, bonus
  status: varchar('status').notNull().default('pending'),
  payoutId: uuid('payout_id').references(() => payouts.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Define product commissions table
export const productCommissions = pgTable('product_commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  productId: varchar('product_id').notNull(),
  productName: varchar('product_name').notNull(),
  categoryId: varchar('category_id'),
  commissionType: varchar('commission_type').notNull(),
  commissionValue: decimal('commission_value').notNull(),
  tierOverrides: jsonb('tier_overrides').default({}),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  minQuantity: integer('min_quantity').default(1),
  maxQuantity: integer('max_quantity'),
  status: varchar('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Define campaignParticipations table
export const campaignParticipations = pgTable('campaign_participations', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id),
  affiliateId: uuid('affiliate_id').notNull().references(() => affiliates.id),
  status: varchar('status').notNull().default('pending'),
  metrics: jsonb('metrics').default({}),
  promotionalLinks: jsonb('promotional_links').default([]),
  promotionalCodes: jsonb('promotional_codes').default([]),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at')
});

// Create the password reset tokens table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});