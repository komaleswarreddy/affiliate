import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Database configuration
const dbPath = process.env.SQLITE_DB_PATH || './sqlite.db';

console.log('SQLite Schema Column Fixer');
console.log('==========================');
console.log(`Using database at: ${dbPath}`);

// Backup the database before modifying it
const backupPath = `${dbPath}.backup-${Date.now()}`;
if (fs.existsSync(dbPath)) {
  console.log(`Creating backup at: ${backupPath}`);
  fs.copyFileSync(dbPath, backupPath);
}

// Open SQLite database connection
const sqlite = new Database(dbPath);

// Define the expected schema structure
const expectedSchema = {
  tenants: {
    id: { type: 'TEXT', notNull: true, defaultValue: null },
    name: { type: 'TEXT', notNull: true, defaultValue: null },
    subdomain: { type: 'TEXT', notNull: true, defaultValue: null },
    domain: { type: 'TEXT', notNull: false, defaultValue: null },
    logo_url: { type: 'TEXT', notNull: false, defaultValue: null },
    primary_color: { type: 'TEXT', notNull: false, defaultValue: "'#3667CE'" },
    secondary_color: { type: 'TEXT', notNull: false, defaultValue: "'#36A490'" },
    subscription_tier: { type: 'TEXT', notNull: true, defaultValue: "'standard'" },
    max_users: { type: 'INTEGER', notNull: true, defaultValue: "5" },
    max_affiliates: { type: 'INTEGER', notNull: true, defaultValue: "20" },
    status: { type: 'TEXT', notNull: true, defaultValue: "'active'" },
    created_at: { type: 'INTEGER', notNull: true, defaultValue: "strftime('%s', 'now')" },
    expires_at: { type: 'INTEGER', notNull: false, defaultValue: null },
    settings: { type: 'TEXT', notNull: false, defaultValue: "'{}'" }
  },
  roles: {
    id: { type: 'TEXT', notNull: true, defaultValue: null },
    tenant_id: { type: 'TEXT', notNull: true, defaultValue: null },
    name: { type: 'TEXT', notNull: true, defaultValue: null },
    description: { type: 'TEXT', notNull: false, defaultValue: null },
    permissions: { type: 'TEXT', notNull: true, defaultValue: null },
    is_custom: { type: 'INTEGER', notNull: true, defaultValue: "0" },
    created_by: { type: 'TEXT', notNull: true, defaultValue: null },
    created_at: { type: 'INTEGER', notNull: true, defaultValue: "strftime('%s', 'now')" }
  },
  users: {
    id: { type: 'TEXT', notNull: true, defaultValue: null },
    tenant_id: { type: 'TEXT', notNull: true, defaultValue: null },
    email: { type: 'TEXT', notNull: true, defaultValue: null },
    password: { type: 'TEXT', notNull: true, defaultValue: null },
    first_name: { type: 'TEXT', notNull: true, defaultValue: null },
    last_name: { type: 'TEXT', notNull: true, defaultValue: null },
    phone: { type: 'TEXT', notNull: false, defaultValue: null },
    country_code: { type: 'TEXT', notNull: false, defaultValue: "'US'" },
    timezone: { type: 'TEXT', notNull: false, defaultValue: "'America/New_York'" },
    language: { type: 'TEXT', notNull: false, defaultValue: "'en'" },
    referral_code: { type: 'TEXT', notNull: false, defaultValue: null },
    role_id: { type: 'TEXT', notNull: false, defaultValue: null },
    terms_accepted: { type: 'INTEGER', notNull: true, defaultValue: "0" },
    marketing_consent: { type: 'INTEGER', notNull: true, defaultValue: "0" },
    created_at: { type: 'INTEGER', notNull: true, defaultValue: "strftime('%s', 'now')" },
    is_affiliate: { type: 'INTEGER', notNull: true, defaultValue: "0" }
  }
};

// Function to check and fix a table schema
function checkAndFixTable(tableName, expectedColumns) {
  console.log(`\nChecking table: ${tableName}`);
  
  // Check if table exists
  const tableExists = sqlite.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name=?
  `).get(tableName);
  
  if (!tableExists) {
    console.error(`Table '${tableName}' does not exist!`);
    return;
  }
  
  // Get current columns
  const currentColumns = sqlite.prepare(`PRAGMA table_info(${tableName})`).all();
  console.log(`Found ${currentColumns.length} columns in ${tableName}`);
  
  // Check for missing columns
  const missingColumns = [];
  for (const [colName, colProps] of Object.entries(expectedColumns)) {
    const foundCol = currentColumns.find(col => col.name === colName);
    if (!foundCol) {
      missingColumns.push({
        name: colName,
        ...colProps
      });
    } else {
      // Check for type mismatches
      if (foundCol.type !== colProps.type) {
        console.warn(`Column type mismatch: ${tableName}.${colName} is ${foundCol.type}, expected ${colProps.type}`);
      }
      
      // Check for NOT NULL constraint mismatches
      if (!!foundCol.notnull !== !!colProps.notNull) {
        console.warn(`NOT NULL constraint mismatch: ${tableName}.${colName}`);
      }
      
      // Check for default value mismatches (this is simple, may not catch all cases)
      const defaultsMatch = (foundCol.dflt_value === colProps.defaultValue) ||
                            (foundCol.dflt_value === null && colProps.defaultValue === null);
                            
      if (!defaultsMatch) {
        console.warn(`Default value mismatch: ${tableName}.${colName} is ${foundCol.dflt_value}, expected ${colProps.defaultValue}`);
      }
    }
  }
  
  // Add missing columns
  if (missingColumns.length > 0) {
    console.warn(`Found ${missingColumns.length} missing columns in ${tableName}`);
    
    for (const col of missingColumns) {
      try {
        const alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type}${
          col.notNull ? ' NOT NULL' : ''
        }${
          col.defaultValue ? ` DEFAULT ${col.defaultValue}` : ''
        }`;
        
        console.log(`Adding column: ${alterSql}`);
        sqlite.exec(alterSql);
        console.log(`Added column ${tableName}.${col.name} successfully`);
      } catch (error) {
        console.error(`Error adding column ${tableName}.${col.name}:`, error.message);
      }
    }
  } else {
    console.log(`All expected columns exist in ${tableName}`);
  }
}

try {
  // Check each table
  for (const [tableName, expectedColumns] of Object.entries(expectedSchema)) {
    checkAndFixTable(tableName, expectedColumns);
  }
  
  console.log('\nSchema verification and fixes complete!');
  
  // Verify critical columns again
  const tenantsSettings = sqlite.prepare(`PRAGMA table_info(tenants)`).all()
    .find(col => col.name === 'settings');
    
  if (tenantsSettings) {
    console.log(`Confirmed: tenants.settings exists with type=${tenantsSettings.type}`);
  } else {
    console.error('CRITICAL ERROR: Could not add settings column to tenants table!');
  }
  
  const rolesPermissions = sqlite.prepare(`PRAGMA table_info(roles)`).all()
    .find(col => col.name === 'permissions');
    
  if (rolesPermissions) {
    console.log(`Confirmed: roles.permissions exists with type=${rolesPermissions.type}`);
  } else {
    console.error('CRITICAL ERROR: Could not add/fix permissions column in roles table!');
  }
  
} catch (error) {
  console.error('Error fixing database schema:', error);
} finally {
  // Close database connection
  sqlite.close();
  console.log('Database connection closed');
} 