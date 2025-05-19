/**
 * SQLite Setup Script
 * 
 * This script initializes the SQLite database schema.
 * It creates all necessary tables and indexes for the application.
 */

import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

console.log('Setting up SQLite database...');

// Create a simple password hashing function since we can't import TypeScript directly
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Connect to SQLite
const dbPath = process.env.SQLITE_DB_PATH || './sqlite.db';
console.log(`Using SQLite database at: ${dbPath}`);

// Ensure directory exists if dbPath contains directories
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Create demo data if needed
const TRIAL_PERIOD_DAYS = 14;

async function setupDatabase() {
  try {
    // Ensure migrations directory exists
    const migrationsDir = path.join(process.cwd(), 'drizzle', 'migrations-sqlite');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Run migrations
    console.log('Running database migrations...');
    
    // Check if table exists
    const tableExists = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='tenants'
    `).get();
    
    if (!tableExists) {
      console.log('Creating tables from schema...');
      
      // Create tenants table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS tenants (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          subdomain TEXT NOT NULL UNIQUE,
          domain TEXT,
          logo_url TEXT,
          primary_color TEXT,
          secondary_color TEXT,
          subscription_tier TEXT NOT NULL,
          max_users INTEGER NOT NULL,
          max_affiliates INTEGER NOT NULL,
          status TEXT NOT NULL,
          created_at DATETIME NOT NULL,
          expires_at DATETIME
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
          is_custom BOOLEAN NOT NULL,
          created_by TEXT NOT NULL,
          created_at DATETIME NOT NULL,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        )
      `);
      
      // Create users table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          email TEXT NOT NULL,
          password TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          country_code TEXT,
          timezone TEXT,
          language TEXT,
          role_id TEXT,
          terms_accepted BOOLEAN NOT NULL,
          marketing_consent BOOLEAN NOT NULL,
          created_at DATETIME NOT NULL,
          is_affiliate BOOLEAN NOT NULL DEFAULT FALSE,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id),
          FOREIGN KEY (role_id) REFERENCES roles(id)
        )
      `);
      
      // Create additional tables for affiliates, commissions, etc. as needed
      
      // Check if demo data needs to be created
      console.log('Checking if demo data exists...');
      const tenantCount = sqlite.prepare('SELECT COUNT(*) as count FROM tenants').get();
      
      if (tenantCount.count === 0) {
        console.log('No tenants found, creating demo data...');
        
        // Generate UUIDs for demo data
        const demoTenantId = uuidv4();
        const demoRoleId = uuidv4();
        const demoUserId = uuidv4();

        // Create trial expiry date
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + TRIAL_PERIOD_DAYS);

        // Insert demo tenant
        console.log('Creating demo tenant...');
        sqlite.prepare(`
          INSERT INTO tenants (
            id, name, subdomain, domain, logo_url, primary_color, secondary_color, 
            subscription_tier, max_users, max_affiliates, status, created_at, expires_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          new Date().toISOString(),
          trialExpiry.toISOString()
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
          new Date().toISOString()
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
          new Date().toISOString(),
          0
        );

        console.log('Demo account created:');
        console.log('- Email: demo@example.com');
        console.log('- Password: Demo123!');
        console.log('- Tenant: demo');
      } else {
        console.log('Database already contains data, skipping demo data creation');
      }
    } else {
      console.log('Tables already exist, skipping schema creation');
    }
    
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
    console.log('Setup process finished.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
  }); 