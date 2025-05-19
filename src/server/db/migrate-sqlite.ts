import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// Create the database directory if it doesn't exist
const dbDir = path.join(process.cwd(), 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to SQLite database
const sqlite = new Database(path.join(dbDir, 'sqlite.db'));
const db = drizzle(sqlite);

async function main() {
  console.log('Running migrations on SQLite database...');
  
  try {
    // Ensure migrations directory exists
    const migrationsDir = path.join(process.cwd(), 'drizzle', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    // Run migrations
    await migrate(db, { migrationsFolder: migrationsDir });
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 