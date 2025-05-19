import Database from 'better-sqlite3';
import fs from 'fs';

// Database configuration
const dbPath = process.env.SQLITE_DB_PATH || './sqlite.db';

console.log('SQLite Database Inspector');
console.log('=========================');
console.log(`Using database at: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  console.error(`Database file does not exist: ${dbPath}`);
  process.exit(1);
}

// Open SQLite database connection
const sqlite = new Database(dbPath);

try {
  // List all tables
  console.log('\nTables in database:');
  const tables = sqlite.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%';
  `).all();
  
  tables.forEach(table => console.log(`- ${table.name}`));
  
  // For specific tables, get count and sample data
  const tablesToInspect = ['tenants', 'roles', 'users'];
  
  for (const tableName of tablesToInspect) {
    console.log(`\n=== Inspecting table: ${tableName} ===`);
    
    // Get row count
    const count = sqlite.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    console.log(`Row count: ${count.count}`);
    
    // Get sample data (limit to 3 rows)
    if (count.count > 0) {
      const rows = sqlite.prepare(`SELECT * FROM ${tableName} LIMIT 3`).all();
      console.log('Sample data:');
      rows.forEach((row, i) => {
        console.log(`Row ${i+1}:`, sanitizeRow(row, tableName));
      });
    }
    
    // Get column information
    const columns = sqlite.prepare(`PRAGMA table_info(${tableName})`).all();
    console.log('\nColumns:');
    columns.forEach(col => {
      console.log(`- ${col.name} (${col.type}${col.notnull ? ', NOT NULL' : ''}${col.dflt_value ? `, DEFAULT ${col.dflt_value}` : ''})`);
    });
    
    // Get foreign keys
    const foreignKeys = sqlite.prepare(`PRAGMA foreign_key_list(${tableName})`).all();
    if (foreignKeys.length > 0) {
      console.log('\nForeign Keys:');
      foreignKeys.forEach(fk => {
        console.log(`- Column '${fk.from}' -> ${fk.table}(${fk.to})`);
      });
    }
  }
  
  console.log('\nDatabase inspection complete!');
} catch (error) {
  console.error('Error inspecting database:', error);
} finally {
  // Close database connection
  sqlite.close();
}

// Helper function to sanitize sensitive data in row output
function sanitizeRow(row, tableName) {
  const sanitized = {...row};
  
  // Mask sensitive fields based on table
  if (tableName === 'users' && sanitized.password) {
    sanitized.password = '********';
  }
  
  return sanitized;
} 