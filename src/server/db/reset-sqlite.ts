/**
 * SQLite Database Reset Script
 * 
 * This script completely resets the SQLite database, removing the old file
 * and recreating all tables from scratch without any PostgreSQL-specific functions.
 * Run it with: npm run reset-sqlite
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/password';
import { TRIAL_PERIOD_DAYS } from '../../lib/constants';

console.log('=== SQLite Database Reset Tool ===');

// Get DB path from environment or use default
const dbPath = process.env.VITE_DATABASE_URL?.replace('sqlite://', '') || './db/sqlite.db';

// Make path absolute if relative
const absoluteDbPath = dbPath.startsWith('.')
  ? path.resolve(process.cwd(), dbPath)
  : dbPath;

console.log(`Target SQLite database path: ${absoluteDbPath}`);

// Create directory if it doesn't exist
const dbDir = path.dirname(absoluteDbPath);
if (!fs.existsSync(dbDir)) {
  console.log(`Creating directory: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

// Delete the existing database if it exists
if (fs.existsSync(absoluteDbPath)) {
  console.log('Deleting existing database file...');
  try {
    fs.unlinkSync(absoluteDbPath);
    console.log('Existing database deleted');
  } catch (err) {
    console.error('Error deleting database:', err);
    console.log('Please close any connections to the database and try again.');
    process.exit(1);
  }
}

// Create a new SQLite database
console.log('Creating new database...');
const db = new Database(absoluteDbPath);

// Create tables with explicit schema
console.log('Creating tables...');

// Create tenants table
db.exec(`
  CREATE TABLE tenants (
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
db.exec(`
  CREATE TABLE roles (
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

// Create users table
db.exec(`
  CREATE TABLE users (
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

// Create password reset tokens table
db.exec(`
  CREATE TABLE password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
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

// Insert demo tenant
const insertTenantStmt = db.prepare(`
  INSERT INTO tenants (
    id, name, subdomain, domain, subscription_tier, max_users, max_affiliates, 
    status, expires_at, settings
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertTenantStmt.run(
  demoTenantId,
  'Demo Company',
  'demo',
  'demo.affiliatepro.com',
  'trial',
  5,
  10,
  'active',
  Math.floor(trialExpiry.getTime() / 1000),
  '{}'
);

// Insert demo admin role
const insertRoleStmt = db.prepare(`
  INSERT INTO roles (
    id, tenant_id, name, description, permissions, is_custom, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertRoleStmt.run(
  demoRoleId,
  demoTenantId,
  'admin',
  'Administrator with full access',
  JSON.stringify(['*']),
  0,
  'system'
);

// Hash the demo password and insert demo user
const createDemoUser = async () => {
  try {
    const hashedPassword = await hashPassword('Demo123!');
    
    const insertUserStmt = db.prepare(`
      INSERT INTO users (
        id, tenant_id, email, password, first_name, last_name, 
        country_code, timezone, language, role_id, terms_accepted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertUserStmt.run(
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
      1
    );
    
    console.log('Demo account created:');
    console.log('- Email: demo@example.com');
    console.log('- Password: Demo123!');
    console.log('- Tenant: demo');
    
    // Close the database connection
    db.close();
    
    console.log('Database reset complete!');
  } catch (error) {
    console.error('Error creating demo user:', error);
    process.exit(1);
  }
};

// Create the demo user
createDemoUser(); 