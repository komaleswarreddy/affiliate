/**
 * Database Setup Script
 * 
 * This script initializes the database schema and creates initial development data.
 * Run it with: node -r esbuild-register src/server/db/setup.ts
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';
import { generateUUID } from '../utils/uuid';
import { hashPassword } from '../utils/password';
import { tenants, users, roles, passwordResetTokens } from './sqlite-schema';
import { TRIAL_PERIOD_DAYS } from '../../lib/constants';
import { eq } from 'drizzle-orm';

// DB path from environment or use default
const dbPath = process.env.VITE_DATABASE_URL?.replace('sqlite://', '') || './db/sqlite.db';

// Make path absolute if relative
const absoluteDbPath = dbPath.startsWith('.')
  ? path.resolve(process.cwd(), dbPath)
  : dbPath;

console.log(`Setting up SQLite database at: ${absoluteDbPath}`);

// Create directory if it doesn't exist
const dbDir = path.dirname(absoluteDbPath);
if (!fs.existsSync(dbDir)) {
  console.log(`Creating directory: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

// If the database file exists, try to delete it
let dbExists = false;
if (fs.existsSync(absoluteDbPath)) {
  dbExists = true;
  console.log('Existing database file found...');
  try {
    fs.unlinkSync(absoluteDbPath);
    console.log('Existing database removed successfully');
    dbExists = false;
  } catch (err) {
    console.warn('Could not remove existing database file. It may be in use:', err.message);
    console.log('Will try to connect to the existing database...');
  }
}

try {
  // Create a new database connection
  console.log('Creating database connection...');
  const sqlite = new Database(absoluteDbPath);
  const db = drizzle(sqlite);

  // If we need to create the schema
  if (!dbExists) {
    console.log('Creating database schema...');

    // Create tables
    db.run(sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subdomain TEXT NOT NULL UNIQUE,
        domain TEXT,
        logo_url TEXT,
        primary_color TEXT DEFAULT '#3667CE',
        secondary_color TEXT DEFAULT '#36A490',
        subscription_tier TEXT NOT NULL DEFAULT 'standard',
        max_users INTEGER NOT NULL DEFAULT 5,
        max_affiliates INTEGER NOT NULL DEFAULT 20,
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        expires_at INTEGER,
        settings TEXT DEFAULT '{}'
      )
    `);

    db.run(sql`
      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        permissions TEXT NOT NULL,
        is_custom INTEGER NOT NULL DEFAULT 0,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      )
    `);

    db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        country_code TEXT DEFAULT 'US',
        timezone TEXT DEFAULT 'America/New_York',
        language TEXT DEFAULT 'en',
        referral_code TEXT,
        role_id TEXT,
        terms_accepted INTEGER NOT NULL DEFAULT 0,
        marketing_consent INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        is_affiliate INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id),
        FOREIGN KEY (role_id) REFERENCES roles (id)
      )
    `);

    db.run(sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    console.log('Creating demo data...');

    // Check if demo data already exists
    const existingTenant = db.select().from(tenants).where(eq(tenants.subdomain, 'demo')).get();
    
    if (!existingTenant) {
      // Generate UUIDs for demo data
      const demoTenantId = generateUUID();
      const demoRoleId = generateUUID();
      const demoUserId = generateUUID();

      // Create trial expiry date
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + TRIAL_PERIOD_DAYS);

      // Insert demo tenant
      db.insert(tenants).values({
        id: demoTenantId,
        name: 'Demo Company',
        subdomain: 'demo',
        domain: 'demo.affiliatepro.com',
        logoUrl: null,
        primaryColor: '#3667CE',
        secondaryColor: '#36A490',
        subscriptionTier: 'trial',
        maxUsers: 5,
        maxAffiliates: 10,
        status: 'active',
        expiresAt: Math.floor(trialExpiry.getTime() / 1000),
        settings: '{}'
      }).run();

      // Insert demo admin role with all permissions
      db.insert(roles).values({
        id: demoRoleId,
        tenantId: demoTenantId,
        name: 'admin',
        description: 'Administrator with full access',
        permissions: JSON.stringify(['*']),
        isCustom: 0,
        createdBy: 'system'
      }).run();

      // Hash the demo password
      const hashedPassword = await hashPassword('Demo123!');

      // Insert demo user
      db.insert(users).values({
        id: demoUserId,
        tenantId: demoTenantId,
        email: 'demo@example.com',
        password: hashedPassword,
        firstName: 'Demo',
        lastName: 'User',
        phone: null,
        countryCode: 'US',
        timezone: 'America/New_York',
        language: 'en',
        referralCode: null,
        roleId: demoRoleId,
        termsAccepted: 1,
        marketingConsent: 0,
        isAffiliate: 0
      }).run();

      console.log('Demo account created:');
      console.log('- Email: demo@example.com');
      console.log('- Password: Demo123!');
      console.log('- Tenant: demo');
    } else {
      console.log('Demo data already exists, skipping creation');
    }
  } else {
    console.log('Using existing database, schema creation skipped');
  }

  console.log('Database setup complete!');
  
  // Close the database connection
  sqlite.close();
} catch (error) {
  console.error('Error setting up database:', error);
  process.exit(1);
}

// Helper function for raw SQL
function sql(strings: TemplateStringsArray, ...values: any[]) {
  return strings.join('');
}

// Helper function to check if a table exists
function eq(field: any, value: any) {
  return { field, value, operator: '=' };
} 