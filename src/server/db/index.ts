import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import postgres from 'postgres';
import Database from 'better-sqlite3';
import { isDevelopment } from '../../lib/utils';
import * as schema from './schema';
import * as sqliteSchema from './sqlite-schema';
import path from 'path';
import type { FastifyInstance } from 'fastify';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Determine which database to use based on environment variables
const usePostgres = process.env.USE_POSTGRES === 'true';

let db: any;
let queryClient: any; // Store the postgres client for later use

console.log('Setting up PostgreSQL database connection');

if (usePostgres) {
  // PostgreSQL setup
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/affiliate_management';
  console.log(`Using PostgreSQL connection: ${connectionString}`);
  
  const queryClient = postgres(connectionString, { max: 1 });
  db = drizzle(queryClient, { schema });
} else {
  // SQLite setup
  const dbPath = process.env.SQLITE_DB_PATH || './sqlite.db';
  console.log(`Using SQLite database at: ${dbPath}`);
  
  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const sqlite = new Database(dbPath);
  // Use the sqliteSchema explicitly for SQLite
  db = drizzleSQLite(sqlite, { schema: sqliteSchema });
}

// Export the database connection
export { db };

// Generate a UUID (always using application-level generation for consistency)
export const generateUUID = uuidv4;

// Run a raw SQL query
export const runRawQuery = async (sql: string): Promise<void> => {
  // For PostgreSQL
  if (!queryClient) {
    throw new Error('Database connection not initialized');
  }
  await queryClient.unsafe(sql);
};

export const configureDatabase = async (server: FastifyInstance) => {
  server.decorate('db', db);
  
  // Create a UUID generator function at the application level
  server.decorate('generateUUID', uuidv4);

  // Add close handler for PostgreSQL
  if (queryClient) {
    // Fix the onClose hook handler
    server.addHook('onClose', function (done) {
      queryClient.end()
        .then(() => done())
        .catch((err: Error) => done(err));
    });
  }
};

export type Database = typeof db;