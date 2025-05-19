/**
 * PostgreSQL Setup Script
 * 
 * This script initializes the PostgreSQL database schema.
 * It creates all necessary tables and indexes for the application.
 */

import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from './src/server/utils/password.js';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

console.log('Setting up PostgreSQL database...');

// Connect to PostgreSQL
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/affiliate_management';
console.log(`Using PostgreSQL connection string: ${connectionString}`);

const queryClient = postgres(connectionString, { max: 10 });
const db = drizzle(queryClient);

// Create demo data if needed
const TRIAL_PERIOD_DAYS = 14;

async function setupDatabase() {
  try {
    // Ensure migrations directory exists
    const migrationsDir = path.join(process.cwd(), 'drizzle', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Run migrations
    console.log('Running database migrations...');
    await migrate(db, { migrationsFolder: migrationsDir });
    
    // Check if demo data needs to be created
    console.log('Checking if demo data exists...');
    const { rows: tenantRows } = await queryClient.query('SELECT COUNT(*) as count FROM tenants');
    
    if (tenantRows[0].count === '0') {
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
      await queryClient.query(`
        INSERT INTO tenants (
          id, name, subdomain, domain, logo_url, primary_color, secondary_color, 
          subscription_tier, max_users, max_affiliates, status, created_at, expires_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
      `, [
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
        new Date(),
        trialExpiry
      ]);

      // Insert demo admin role
      console.log('Creating admin role...');
      await queryClient.query(`
        INSERT INTO roles (
          id, tenant_id, name, description, permissions, is_custom, created_by, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
      `, [
        demoRoleId,
        demoTenantId,
        'admin',
        'Administrator with full access',
        JSON.stringify(['*']),
        false,
        'system',
        new Date()
      ]);

      // Hash the demo password
      console.log('Creating demo user...');
      const hashedPassword = await hashPassword('Demo123!');

      // Insert demo user
      await queryClient.query(`
        INSERT INTO users (
          id, tenant_id, email, password, first_name, last_name, 
          country_code, timezone, language, role_id, terms_accepted, 
          marketing_consent, created_at, is_affiliate
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
      `, [
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
        true,
        false,
        new Date(),
        false
      ]);

      console.log('Demo account created:');
      console.log('- Email: demo@example.com');
      console.log('- Password: Demo123!');
      console.log('- Tenant: demo');
    } else {
      console.log('Database already contains data, skipping demo data creation');
    }
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await queryClient.end();
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