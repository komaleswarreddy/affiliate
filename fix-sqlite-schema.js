import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

// Database configuration
const dbPath = process.env.SQLITE_DB_PATH || './sqlite.db';
const TRIAL_PERIOD_DAYS = 14;

console.log('SQLite Schema Fixer');
console.log('===================');
console.log('This script will recreate your SQLite database with the correct schema.');
console.log(`Using database at: ${dbPath}`);

// Delete the existing database if it exists
if (fs.existsSync(dbPath)) {
  console.log('Deleting existing database...');
  fs.unlinkSync(dbPath);
}

// Open a new SQLite database connection
const sqlite = new Database(dbPath);

// Hash password utility function
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function setupDatabase() {
  try {
    console.log('Creating new database schema...');
    
    // Create tenants table WITH settings column
    sqlite.exec(`
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
    
    // Create roles table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        permissions TEXT NOT NULL,
        is_custom INTEGER NOT NULL DEFAULT 0,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      )
    `);
    
    // Create users table
    sqlite.exec(`
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
        FOREIGN KEY (tenant_id) REFERENCES tenants(id),
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);
    
    // Create password reset tokens table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create demo data
    console.log('Creating demo data...');
    
    // Generate UUIDs for demo data
    const demoTenantId = uuidv4();
    const demoRoleId = uuidv4();
    const demoUserId = uuidv4();

    // Create trial expiry date
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + TRIAL_PERIOD_DAYS);
    const trialExpiryTimestamp = Math.floor(trialExpiry.getTime() / 1000);

    // Insert demo tenant
    console.log('Creating demo tenant...');
    sqlite.prepare(`
      INSERT INTO tenants (
        id, name, subdomain, domain, logo_url, primary_color, secondary_color, 
        subscription_tier, max_users, max_affiliates, status, created_at, expires_at, settings
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      demoTenantId, 
      'Demo Company', 
      'demo', 
      'demo.affiliatepro.com',
      null,
      '#3667CE',
      '#36A490',
      'trial',
      5,
      10,
      'active',
      Math.floor(Date.now() / 1000),
      trialExpiryTimestamp,
      '{}'
    );

    // Insert demo admin role
    console.log('Creating admin role...');
    sqlite.prepare(`
      INSERT INTO roles (
        id, tenant_id, name, description, permissions, is_custom, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      demoRoleId,
      demoTenantId,
      'admin',
      'Administrator with full access',
      JSON.stringify(['*']),
      0,
      'system',
      Math.floor(Date.now() / 1000)
    );

    // Hash the demo password
    console.log('Creating demo user...');
    const hashedPassword = await hashPassword('Demo123!');

    // Insert demo user
    sqlite.prepare(`
      INSERT INTO users (
        id, tenant_id, email, password, first_name, last_name, 
        country_code, timezone, language, role_id, terms_accepted, 
        marketing_consent, created_at, is_affiliate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      demoUserId,
      demoTenantId,
      'demo@example.com',
      hashedPassword,
      'Demo',
      'User',
      'US',
      'America/New_York',
      'en',
      demoRoleId,
      1,
      0,
      Math.floor(Date.now() / 1000),
      0
    );

    console.log('Demo account created:');
    console.log('- Email: demo@example.com');
    console.log('- Password: Demo123!');
    console.log('- Tenant: demo');
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    // Close database connection
    sqlite.close();
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('Schema fix process finished.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Schema fix failed:', err);
    process.exit(1);
  }); 