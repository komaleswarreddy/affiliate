import { db as drizzleDb } from './index';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/password';
import BetterSqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

if (!isDevelopment) {
  console.error('This script should only be run in development mode');
  process.exit(1);
}

// Create SQLite database connection directly
const dbDir = path.join(process.cwd(), 'db');
const dbPath = path.join(dbDir, 'sqlite.db');
console.log(`Using SQLite database at: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  console.error(`SQLite database file not found at: ${dbPath}`);
  process.exit(1);
}

const db = new BetterSqlite3(dbPath);

async function manualSeed() {
  console.log('Starting manual database seeding...');

  try {
    // Check if the demo tenant exists
    const existingTenant = db.prepare('SELECT * FROM tenants WHERE subdomain = ?').get('demo');
    
    if (existingTenant) {
      console.log('Demo tenant already exists. Skipping seeding.');
      return;
    }
    
    // 1. Create demo tenant
    console.log('Creating demo tenant...');
    const tenantId = uuidv4();
    
    db.prepare(`
      INSERT INTO tenants (
        id, name, subdomain, domain, logo_url, 
        primary_color, secondary_color, subscription_tier, 
        max_users, max_affiliates, status, created_at, settings
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tenantId,
      'Demo Company',
      'demo',
      'demo.example.com',
      '',
      '#3667CE',
      '#36A490',
      'professional',
      10,
      50,
      'active',
      Date.now(),
      '{}'
    );
    
    console.log(`Demo tenant created with ID: ${tenantId}`);
    
    // 2. Create admin role
    console.log('Creating admin role...');
    const adminRoleId = uuidv4();
    
    db.prepare(`
      INSERT INTO roles (
        id, tenant_id, name, description, permissions, 
        is_custom, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      adminRoleId,
      tenantId,
      'admin',
      'Administrator with full access',
      JSON.stringify(['*']),
      0,
      'system',
      Date.now()
    );
    
    console.log(`Admin role created with ID: ${adminRoleId}`);
    
    // 3. Create user role
    console.log('Creating user role...');
    const userRoleId = uuidv4();
    const userPermissions = [
      'affiliates:view',
      'campaigns:view',
      'commissions:view',
      'analytics:view'
    ];
    
    db.prepare(`
      INSERT INTO roles (
        id, tenant_id, name, description, permissions, 
        is_custom, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userRoleId,
      tenantId,
      'user',
      'Regular user with limited access',
      JSON.stringify(userPermissions),
      0,
      'system',
      Date.now()
    );
    
    console.log(`User role created with ID: ${userRoleId}`);
    
    // 4. Create demo admin user
    console.log('Creating demo admin user...');
    const adminUserId = uuidv4();
    const adminPassword = await hashPassword('Demo123!');
    
    db.prepare(`
      INSERT INTO users (
        id, tenant_id, email, password, first_name,
        last_name, role_id, terms_accepted, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      adminUserId,
      tenantId,
      'demo@example.com',
      adminPassword,
      'Demo',
      'Admin',
      adminRoleId,
      1,
      Date.now()
    );
    
    console.log(`Demo admin user created with ID: ${adminUserId}`);
    
    // 5. Create demo regular user
    console.log('Creating demo regular user...');
    const regularUserId = uuidv4();
    const userPassword = await hashPassword('Demo123!');
    
    db.prepare(`
      INSERT INTO users (
        id, tenant_id, email, password, first_name,
        last_name, role_id, terms_accepted, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      regularUserId,
      tenantId,
      'user@example.com',
      userPassword,
      'Demo',
      'User',
      userRoleId,
      1,
      Date.now()
    );
    
    console.log(`Demo regular user created with ID: ${regularUserId}`);
    
    console.log('Database seeding completed successfully!');
    console.log('You can login with:');
    console.log('  Admin: demo@example.com / Demo123!');
    console.log('  User: user@example.com / Demo123!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the seed function
manualSeed().then(() => {
  console.log('Manual seeding completed!');
  process.exit(0);
}).catch(err => {
  console.error('Manual seeding failed:', err);
  process.exit(1);
}); 