-- SQLite migration for initial schema

-- Create tenants table
CREATE TABLE IF NOT EXISTS "tenants" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "subdomain" TEXT NOT NULL UNIQUE,
  "domain" TEXT,
  "logo_url" TEXT,
  "primary_color" TEXT DEFAULT '#3667CE',
  "secondary_color" TEXT DEFAULT '#36A490',
  "subscription_tier" TEXT NOT NULL DEFAULT 'standard',
  "max_users" INTEGER NOT NULL DEFAULT 5,
  "max_affiliates" INTEGER NOT NULL DEFAULT 20,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" INTEGER NOT NULL DEFAULT (unixepoch()),
  "expires_at" INTEGER,
  "settings" TEXT DEFAULT '{}'
);

-- Create roles table
CREATE TABLE IF NOT EXISTS "roles" (
  "id" TEXT PRIMARY KEY,
  "tenant_id" TEXT NOT NULL REFERENCES "tenants"("id"),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "permissions" TEXT NOT NULL,
  "is_custom" INTEGER NOT NULL DEFAULT 0,
  "created_by" TEXT NOT NULL,
  "created_at" INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "tenant_id" TEXT NOT NULL REFERENCES "tenants"("id"),
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "phone" TEXT,
  "country_code" TEXT DEFAULT 'US',
  "timezone" TEXT DEFAULT 'America/New_York',
  "language" TEXT DEFAULT 'en',
  "referral_code" TEXT,
  "role_id" TEXT REFERENCES "roles"("id"),
  "terms_accepted" INTEGER NOT NULL DEFAULT 0,
  "marketing_consent" INTEGER NOT NULL DEFAULT 0,
  "created_at" INTEGER NOT NULL DEFAULT (unixepoch()),
  "is_affiliate" INTEGER NOT NULL DEFAULT 0
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id"),
  "token" TEXT NOT NULL UNIQUE,
  "expires_at" INTEGER NOT NULL,
  "created_at" INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create login_attempts table
CREATE TABLE IF NOT EXISTS "login_attempts" (
  "id" TEXT PRIMARY KEY,
  "tenant_id" TEXT NOT NULL REFERENCES "tenants"("id"),
  "user_id" TEXT REFERENCES "users"("id"),
  "email" TEXT,
  "ip_address" TEXT NOT NULL,
  "user_agent" TEXT,
  "success" INTEGER NOT NULL DEFAULT 0,
  "failure_reason" TEXT,
  "created_at" INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_users_tenant" ON "users" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_roles_tenant" ON "roles" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_reset_tokens_user" ON "password_reset_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_login_attempts_tenant" ON "login_attempts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_login_attempts_user" ON "login_attempts" ("user_id"); 