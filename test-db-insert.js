import Database from 'better-sqlite3';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Database configuration
const dbPath = process.env.SQLITE_DB_PATH || './sqlite.db';

console.log('SQLite Direct Insert Test');
console.log('=========================');
console.log(`Using database at: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  console.error(`Database file does not exist: ${dbPath}`);
  process.exit(1);
}

// Open SQLite database connection
const sqlite = new Database(dbPath);
sqlite.pragma('foreign_keys = ON'); // Enable foreign key constraints

// Test data for registration
const testData = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'Password123!',
  tenant: 'testtenant',
  companyName: 'Test Company'
};

// Helper function to hash password (copied from your password.ts)
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

// Function to perform the insert test
async function testInsert() {
  try {
    console.log('Beginning insert test...');
    
    // Log the test data
    console.log('Test data:', {
      ...testData,
      password: '********'
    });
    
    // Begin transaction
    sqlite.exec('BEGIN TRANSACTION');
    
    // Step 1: Generate IDs
    const tenantId = uuidv4();
    const roleId = uuidv4();
    const userId = uuidv4();
    
    console.log('Generated IDs:');
    console.log(`- Tenant ID: ${tenantId}`);
    console.log(`- Role ID: ${roleId}`);
    console.log(`- User ID: ${userId}`);
    
    // Step 2: Create trial expiry date
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 14); // 14 days trial
    const trialExpiryTimestamp = Math.floor(trialExpiry.getTime() / 1000);
    
    // Step 3: Insert tenant
    console.log('\nInserting tenant...');
    try {
      const insertTenantStmt = sqlite.prepare(`
        INSERT INTO tenants (
          id, name, subdomain, domain, subscription_tier, 
          status, created_at, expires_at, settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertTenantStmt.run(
        tenantId,
        testData.companyName,
        testData.tenant,
        `${testData.tenant}.example.com`,
        'trial',
        'active',
        Math.floor(Date.now() / 1000),
        trialExpiryTimestamp,
        '{}'
      );
      
      console.log('Tenant inserted successfully');
    } catch (error) {
      console.error('ERROR inserting tenant:', error.message);
      throw error;
    }
    
    // Step 4: Insert role
    console.log('\nInserting role...');
    try {
      const insertRoleStmt = sqlite.prepare(`
        INSERT INTO roles (
          id, tenant_id, name, description, permissions, 
          is_custom, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertRoleStmt.run(
        roleId,
        tenantId,
        'admin',
        'Administrator with full access',
        JSON.stringify(['*']),
        0,
        'system',
        Math.floor(Date.now() / 1000)
      );
      
      console.log('Role inserted successfully');
    } catch (error) {
      console.error('ERROR inserting role:', error.message);
      throw error;
    }
    
    // Step 5: Hash password
    console.log('\nHashing password...');
    const hashedPassword = hashPassword(testData.password);
    console.log('Password hashed successfully');
    
    // Step 6: Insert user
    console.log('\nInserting user...');
    try {
      const insertUserStmt = sqlite.prepare(`
        INSERT INTO users (
          id, tenant_id, email, password, first_name, last_name,
          role_id, terms_accepted, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertUserStmt.run(
        userId,
        tenantId,
        testData.email,
        hashedPassword,
        testData.firstName,
        testData.lastName,
        roleId,
        1,
        Math.floor(Date.now() / 1000)
      );
      
      console.log('User inserted successfully');
    } catch (error) {
      console.error('ERROR inserting user:', error.message);
      throw error;
    }
    
    // Commit the transaction
    sqlite.exec('COMMIT');
    
    console.log('\nInsert test completed successfully!');
    
    // Verify newly inserted data
    console.log('\nVerifying inserted data...');
    
    const tenant = sqlite.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
    console.log('Tenant record:', tenant ? 'Found' : 'Not found');
    
    const role = sqlite.prepare('SELECT * FROM roles WHERE id = ?').get(roleId);
    console.log('Role record:', role ? 'Found' : 'Not found');
    
    const user = sqlite.prepare('SELECT id, email, first_name, last_name, tenant_id, role_id FROM users WHERE id = ?').get(userId);
    console.log('User record:', user);
    
    return true;
  } catch (error) {
    // Rollback transaction in case of error
    console.error('\nERROR during test, rolling back transaction');
    sqlite.exec('ROLLBACK');
    console.error('Error details:', error);
    return false;
  } finally {
    // Clean up - close the database
    sqlite.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
testInsert()
  .then(success => {
    console.log(`\nTest ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 