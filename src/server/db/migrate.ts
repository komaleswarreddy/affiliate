import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local', override: true });
dotenv.config({ path: '.env.development', override: true });

const main = async () => {
  console.log('Running PostgreSQL database migrations...');
  
  // Get connection string from environment
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:ASDFvbnm1234@db.mrllkgecomlqzwgftdtz.supabase.co:5432/postgres';
  console.log(`Using connection string: ${connectionString}`);
  
  // Connect to PostgreSQL
  const sql = postgres(connectionString, { max: 10 });
  const db = drizzle(sql);
  
  try {
    // Ensure migrations directory exists
    const migrationsDir = path.join(process.cwd(), 'drizzle', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log(`Creating migrations directory: ${migrationsDir}`);
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    // Run migrations
    console.log(`Running migrations from: ${migrationsDir}`);
    await migrate(db, { migrationsFolder: migrationsDir });
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
};

main().catch((err) => {
  console.error('Unhandled error during migration:', err);
  process.exit(1);
});