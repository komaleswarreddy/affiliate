import Database from 'better-sqlite3';
import { resolve, join } from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });
dotenv.config({ path: '.env.development', override: true });

// Database path
const DB_PATH = process.env.VITE_DATABASE_URL?.replace('sqlite://', '') || './db/sqlite.db';
// Make sure the path is absolute
const dbPath = DB_PATH.startsWith('.') ? resolve(process.cwd(), DB_PATH) : DB_PATH;

console.log(`Looking for SQLite database at: ${dbPath}`);

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.log(`Database file does not exist at: ${dbPath}`);
  
  // Check if the directory exists
  const dbDir = dbPath.substring(0, dbPath.lastIndexOf('/'));
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  console.log('Creating empty database file...');
  fs.writeFileSync(dbPath, '');
}

try {
  // Open database connection
  const db = new Database(dbPath);
  console.log('Successfully connected to database');

  // Function to check tables
  function checkTables() {
    try {
      // Get all tables
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
        AND name NOT LIKE 'drizzle_%'
      `).all();
      
      if (tables.length === 0) {
        console.log('No tables found in database.');
        return;
      }
      
      console.log('Database Tables:');
      tables.forEach((table: any) => {
        console.log(`- ${table.name}`);
        
        // Get table schema
        const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
        console.log('  Columns:');
        schema.forEach((column: any) => {
          console.log(`    - ${column.name} (${column.type})`);
        });
      });
      
    } catch (error) {
      console.error('Error checking database tables:', error);
    }
  }

  // Check if we need to create the users table
  function createUsersTable() {
    try {
      // Check if users table exists
      const usersTable = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='users'
      `).get();
      
      if (!usersTable) {
        console.log('Users table does not exist, creating...');
        
        // Create users table
        db.prepare(`
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
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            is_affiliate INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (tenant_id) REFERENCES tenants (id)
          )
        `).run();
        
        console.log('Users table created successfully');
      } else {
        // Check if password column exists
        const passwordColumn = db.prepare(`PRAGMA table_info(users)`).all()
          .find((col: any) => col.name === 'password');
          
        if (!passwordColumn) {
          console.log('Password column missing from users table, adding...');
          
          // Add password column
          db.prepare(`ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'changeMe'`).run();
          
          console.log('Password column added successfully');
        }
      }
    } catch (error) {
      console.error('Error creating/checking users table:', error);
    }
  }

  // Run the checks
  checkTables();
  createUsersTable();
  checkTables(); // Check again after potential modifications

  // Close the database connection
  db.close();
  console.log('Database connection closed');

} catch (error) {
  console.error('Database connection error:', error);
} 