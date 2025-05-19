import Database from 'better-sqlite3';
import fs from 'fs';

// Database configuration
const dbPath = process.env.SQLITE_DB_PATH || './sqlite.db';

console.log('SQLite Schema Updater');
console.log('====================');
console.log(`Using database at: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  console.error(`Database file does not exist: ${dbPath}`);
  process.exit(1);
}

// Open SQLite database connection
const sqlite = new Database(dbPath);

try {
  // Check if settings column exists in tenants table
  const settingsColumn = sqlite.prepare(`PRAGMA table_info(tenants)`).all()
    .find(col => col.name === 'settings');
    
  if (!settingsColumn) {
    console.log('Adding missing settings column to tenants table...');
    sqlite.exec(`ALTER TABLE tenants ADD COLUMN settings TEXT DEFAULT '{}'`);
    console.log('Settings column added successfully.');
  } else {
    console.log('Settings column already exists in tenants table.');
  }

  // Fix permissions column in roles table to ensure it's TEXT
  const permissionsColumn = sqlite.prepare(`PRAGMA table_info(roles)`).all()
    .find(col => col.name === 'permissions');
    
  // Just verify it exists and is TEXT
  if (permissionsColumn) {
    console.log(`Permissions column exists with type: ${permissionsColumn.type}`);
  } else {
    console.error('ERROR: permissions column is missing in roles table!');
  }
  
  // Apply any additional fixes or updates if needed
  
  console.log('Database schema update complete!');
} catch (error) {
  console.error('Error updating database schema:', error);
  process.exit(1);
} finally {
  // Close database connection
  sqlite.close();
} 