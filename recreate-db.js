import Database from 'better-sqlite3';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import path from 'path';

// Database configuration - use a new file to avoid locks
const dbPath = process.env.SQLITE_DB_PATH || './sqlite-new.db';
const TRIAL_PERIOD_DAYS = 14;

console.log('SQLite Database Recreator');
console.log('=========================');
console.log(`Target database path: ${dbPath}`);

// Remove existing file if it exists
if (fs.existsSync(dbPath)) {
  try {
    console.log(`Deleting existing database: ${dbPath}`);
    fs.unlinkSync(dbPath);
  } catch (error) {
    console.error(`Warning: Could not delete existing database file: ${error.message}`);
    console.log('Will attempt to continue with database creation anyway...');
  }
}

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  console.log(`Creating directory: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create a new SQLite database
console.log('Creating new SQLite database...');
const sqlite = new Database(dbPath);

// Helper function to hash password
function hashPassword(password) {
  // Generate a random salt
  const salt = crypto.randomBytes(16).toString('hex');
  
  // Use PBKDF2 to hash the password
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    10000, // Number of iterations
    64,    // Key length
    'sha512'
  ).toString('hex');
  
  // Return the salt:hash combination
  return `${salt}:${hash}`;
}

// Main function to create schema and insert demo data
async function setupDatabase() {
  try {
    console.log('Creating database schema...');
    
    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');
    
    // Create tenants table
    console.log('Creating tenants table...');
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
    console.log('Creating roles table...');
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
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      )
    `);
    
    // Create users table
    console.log('Creating users table...');
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
        FOREIGN KEY (tenant_id) REFERENCES tenants (id),
        FOREIGN KEY (role_id) REFERENCES roles (id)
      )
    `);
    
    // Create password reset tokens table
    console.log('Creating password_reset_tokens table...');
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    
    // Create login attempts table
    console.log('Creating login_attempts table...');
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        user_id TEXT,
        email TEXT,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        success INTEGER NOT NULL DEFAULT 0,
        failure_reason TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    
    // Create demo data
    console.log('\nCreating demo data...');
    
    // Generate UUIDs for demo data
    const demoTenantId = uuidv4();
    const demoRoleId = uuidv4();
    const demoUserId = uuidv4();
    
    console.log('Demo IDs:');
    console.log(`- Tenant ID: ${demoTenantId}`);
    console.log(`- Role ID: ${demoRoleId}`);
    console.log(`- User ID: ${demoUserId}`);
    
    // Create trial expiry date
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + TRIAL_PERIOD_DAYS);
    const trialExpiryTimestamp = Math.floor(trialExpiry.getTime() / 1000);
    
    // Begin transaction for demo data
    sqlite.exec('BEGIN TRANSACTION');
    
    // Insert demo tenant
    console.log('Inserting demo tenant...');
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
    
    // Insert admin role
    console.log('Inserting admin role...');
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
    const hashedPassword = hashPassword('Demo123!');
    
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
    
    // Commit the transaction
    sqlite.exec('COMMIT');
    
    console.log('\nDemo account created:');
    console.log('- Email: demo@example.com');
    console.log('- Password: Demo123!');
    console.log('- Tenant: demo');
    
    // Create additional test account for registration testing
    console.log('\nCreating test tenant data...');
    
    // Generate UUIDs for test data
    const testTenantId = uuidv4();
    const testRoleId = uuidv4();
    const testUserId = uuidv4();
    
    // Begin transaction for test data
    sqlite.exec('BEGIN TRANSACTION');
    
    // Insert test tenant
    console.log('Inserting test tenant...');
    sqlite.prepare(`
      INSERT INTO tenants (
        id, name, subdomain, domain, logo_url, primary_color, secondary_color, 
        subscription_tier, max_users, max_affiliates, status, created_at, expires_at, settings
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      testTenantId, 
      'Test Company', 
      'test', 
      'test.affiliatepro.com',
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
    
    // Insert admin role
    console.log('Inserting test admin role...');
    sqlite.prepare(`
      INSERT INTO roles (
        id, tenant_id, name, description, permissions, is_custom, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      testRoleId,
      testTenantId,
      'admin',
      'Administrator with full access',
      JSON.stringify(['*']),
      0,
      'system',
      Math.floor(Date.now() / 1000)
    );
    
    // Hash the test password
    console.log('Creating test user...');
    const testPassword = hashPassword('Test123!');
    
    // Insert test user
    sqlite.prepare(`
      INSERT INTO users (
        id, tenant_id, email, password, first_name, last_name, 
        country_code, timezone, language, role_id, terms_accepted, 
        marketing_consent, created_at, is_affiliate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      testUserId,
      testTenantId,
      'test@example.com',
      testPassword,
      'Test',
      'User',
      'US',
      'America/New_York',
      'en',
      testRoleId,
      1,
      0,
      Math.floor(Date.now() / 1000),
      0
    );
    
    // Commit the transaction
    sqlite.exec('COMMIT');
    
    console.log('\nTest account created:');
    console.log('- Email: test@example.com');
    console.log('- Password: Test123!');
    console.log('- Tenant: test');
    
    // Verify the database setup
    console.log('\nVerifying database setup...');
    
    const tenantCount = sqlite.prepare('SELECT COUNT(*) as count FROM tenants').get();
    console.log(`- Tenants: ${tenantCount.count}`);
    
    const roleCount = sqlite.prepare('SELECT COUNT(*) as count FROM roles').get();
    console.log(`- Roles: ${roleCount.count}`);
    
    const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log(`- Users: ${userCount.count}`);
    
    // Create indexes for better performance
    console.log('\nCreating indexes...');
    
    // Create index on tenants.subdomain
    sqlite.exec('CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain)');
    
    // Create index on users.email
    sqlite.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    
    // Create index on users.tenant_id
    sqlite.exec('CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)');
    
    // Create index on roles.tenant_id
    sqlite.exec('CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id)');
    
    // Optimize database
    console.log('\nOptimizing database...');
    sqlite.exec('VACUUM');
    
    console.log('\nDatabase setup complete!');
    
    // Write information on how to use the new database
    console.log('\nIMPORTANT: To use this new database, update your .env file:');
    console.log(`SQLITE_DB_PATH=${dbPath}`);
    
    return true;
  } catch (error) {
    console.error('Error setting up database:', error);
    return false;
  } finally {
    // Close database connection
    sqlite.close();
    console.log('Database connection closed.');
  }
}

// Run the setup function
setupDatabase()
  .then(success => {
    console.log(`\nDatabase creation ${success ? 'succeeded' : 'failed'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 