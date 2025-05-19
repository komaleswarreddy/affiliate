import Database from 'better-sqlite3';
import fs from 'fs';

// Database configuration
const dbPath = process.env.SQLITE_DB_PATH || './sqlite.db';

console.log('SQLite Schema Checker');
console.log('====================');
console.log(`Using database at: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  console.error(`Database file does not exist: ${dbPath}`);
  process.exit(1);
}

// Open SQLite database connection
const sqlite = new Database(dbPath);

try {
  // Get all tables
  console.log('\nTables in the database:');
  const tables = sqlite.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%';
  `).all();
  
  tables.forEach(table => {
    console.log(`\n- Table: ${table.name}`);
    
    // Get schema for each table
    const columns = sqlite.prepare(`PRAGMA table_info(${table.name})`).all();
    console.log('  Columns:');
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type}${col.notnull ? ', NOT NULL' : ''}${col.dflt_value ? `, DEFAULT ${col.dflt_value}` : ''})`);
    });
  });
  
  // Check for specific columns
  console.log('\nChecking crucial columns:');
  
  const tenantsSettings = sqlite.prepare(`PRAGMA table_info(tenants)`).all()
    .find(col => col.name === 'settings');
    
  if (tenantsSettings) {
    console.log(`- tenants.settings found: type=${tenantsSettings.type}, default=${tenantsSettings.dflt_value}`);
  } else {
    console.log('- ERROR: tenants.settings column is MISSING!');
  }
  
  const rolesPermissions = sqlite.prepare(`PRAGMA table_info(roles)`).all()
    .find(col => col.name === 'permissions');
    
  if (rolesPermissions) {
    console.log(`- roles.permissions found: type=${rolesPermissions.type}, default=${rolesPermissions.dflt_value}`);
  } else {
    console.log('- ERROR: roles.permissions column is MISSING!');
  }
  
  console.log('\nDatabase schema check complete!');
} catch (error) {
  console.error('Error checking database schema:', error);
} finally {
  // Close database connection
  sqlite.close();
} 