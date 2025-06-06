import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

// Determine whether to use PostgreSQL or SQLite
const usePostgres = process.env.USE_POSTGRES === 'true';

// Create configuration based on database type
let config;

if (usePostgres) {
  // PostgreSQL configuration
  config = defineConfig({
    schema: './src/server/db/schema.ts',
    out: './drizzle/migrations',
    driver: 'pg',
    dbCredentials: {
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/affiliate_management',
    },
    verbose: true,
    strict: true,
  });
} else {
  // SQLite configuration
  config = defineConfig({
    schema: './src/server/db/schema.ts',
    out: './drizzle/migrations-sqlite',
    driver: 'better-sqlite',
    dbCredentials: {
      url: process.env.SQLITE_DB_PATH || './sqlite.db',
    },
    verbose: true,
    strict: true,
  });
} 

// Single export at the end
export default config; 