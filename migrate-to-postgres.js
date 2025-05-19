/**
 * SQLite to PostgreSQL Migration Script
 * 
 * This script helps migrate data from SQLite to PostgreSQL.
 * It reads data from the SQLite database and inserts it into PostgreSQL.
 */

import dotenv from 'dotenv';
import { createRequire } from 'module';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

console.log('Starting migration from SQLite to PostgreSQL...');

// SQLite connection
const sqliteDbPath = path.join(process.cwd(), 'db', 'sqlite.db');

if (!fs.existsSync(sqliteDbPath)) {
  console.error(`SQLite database file not found at: ${sqliteDbPath}`);
  process.exit(1);
}

console.log(`Found SQLite database at: ${sqliteDbPath}`);
const sqlite = new Database(sqliteDbPath);
const sqliteDb = drizzle(sqlite);

// PostgreSQL connection
const pgConnectionString = process.env.DATABASE_URL || 'postgresql://postgres:ASDFvbnm1234@db.mrllkgecomlqzwgftdtz.supabase.co:5432/postgres';
console.log(`Using PostgreSQL connection string: ${pgConnectionString}`);
const queryClient = postgres(pgConnectionString, { max: 10 });
const pgDb = drizzlePg(queryClient);

// Helper function to run a SQLite query and return results
function querySqlite(sql) {
  try {
    const result = sqlite.prepare(sql).all();
    return result;
  } catch (error) {
    console.error(`Error executing SQLite query: ${sql}`, error);
    return [];
  }
}

// Helper function to insert data into PostgreSQL
async function insertIntoPostgres(table, data) {
  if (!data || data.length === 0) {
    console.log(`No data to insert into ${table}`);
    return;
  }

  console.log(`Inserting ${data.length} rows into ${table}...`);
  
  try {
    // Insert batches of 100 to avoid overloading the database
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      // Create an SQL query with all the batch data
      const columns = Object.keys(batch[0]).join(', ');
      const placeholders = batch.map((_, idx) => 
        `(${Object.keys(batch[0]).map((_, colIdx) => `$${idx * Object.keys(batch[0]).length + colIdx + 1}`).join(', ')})`
      ).join(', ');
      
      // Flatten all values into a single array
      const values = batch.flatMap(row => Object.values(row));
      
      // Execute the query
      await queryClient.unsafe(`INSERT INTO ${table} (${columns}) VALUES ${placeholders} ON CONFLICT DO NOTHING`, values);
    }
    
    console.log(`Successfully inserted data into ${table}`);
  } catch (error) {
    console.error(`Error inserting data into ${table}:`, error);
  }
}

// Main migration function
async function migrateData() {
  try {
    // Get list of tables from SQLite database
    const tables = querySqlite(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE 'drizzle_%'
      ORDER BY name
    `);
    
    console.log(`Found ${tables.length} tables in SQLite database`);
    
    // Migrate each table
    for (const table of tables) {
      const tableName = table.name;
      console.log(`\nMigrating table: ${tableName}`);
      
      // Get data from SQLite
      const data = querySqlite(`SELECT * FROM ${tableName}`);
      
      if (data.length === 0) {
        console.log(`Table ${tableName} is empty, skipping`);
        continue;
      }
      
      console.log(`Found ${data.length} rows in ${tableName}`);
      
      // Process data - convert SQLite boolean (0/1) to PostgreSQL boolean (true/false)
      const processedData = data.map(row => {
        const newRow = {};
        for (const [key, value] of Object.entries(row)) {
          // Handle JSON strings
          if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
            try {
              newRow[key] = JSON.parse(value);
            } catch (e) {
              newRow[key] = value;
            }
          } 
          // Handle timestamps for date fields (SQLite stores as seconds, PostgreSQL as Date objects)
          else if (
            key.includes('date') || 
            key.includes('_at') || 
            key === 'created_at' || 
            key === 'updated_at' || 
            key === 'expires_at'
          ) {
            if (value !== null) {
              if (typeof value === 'number') {
                newRow[key] = new Date(value * 1000);
              } else {
                newRow[key] = value;
              }
            } else {
              newRow[key] = null;
            }
          }
          // Handle SQLite booleans (0/1) to PostgreSQL booleans (true/false)
          else if (typeof value === 'number' && (value === 0 || value === 1) && 
              (key.includes('is_') || key.includes('has_') || key.includes('can_') || 
               key === 'terms_accepted' || key === 'marketing_consent' || key === 'is_affiliate')) {
            newRow[key] = value === 1;
          } else {
            newRow[key] = value;
          }
        }
        return newRow;
      });
      
      // Insert data into PostgreSQL
      await insertIntoPostgres(tableName, processedData);
    }
    
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close database connections
    sqlite.close();
    await queryClient.end();
  }
}

// Run the migration
migrateData()
  .then(() => {
    console.log('Migration process finished.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 