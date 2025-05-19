/**
 * Backend Diagnostics Script
 * 
 * This script checks the health of the backend services and database connections.
 * Run it to identify any issues with your backend setup.
 */

import dotenv from 'dotenv';
import postgres from 'postgres';
import Database from 'better-sqlite3';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local'), override: true });
dotenv.config({ path: path.join(__dirname, '.env.development'), override: true });

console.log('======= Backend Diagnostics =======');

// Function to check if a port is in use
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

// Function to check if a server is running on a port
async function isServerResponding(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port,
      path: '/api/health',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ responding: true, data: response });
        } catch (e) {
          resolve({ responding: true, data: 'Response is not valid JSON' });
        }
      });
    });
    
    req.on('error', () => {
      resolve({ responding: false });
    });
    
    req.on('timeout', () => {
      req.abort();
      resolve({ responding: false, error: 'Request timed out' });
    });
    
    req.end();
  });
}

// Check environment variables
console.log('\n1. Checking environment variables...');
const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = [];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length === 0) {
  console.log('✅ All required environment variables are set.');
} else {
  console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
}

// Check which database to use
const usePostgres = process.env.USE_POSTGRES === 'true';

// Check database connection
if (usePostgres) {
  // PostgreSQL connection check
  console.log('\n2. Checking PostgreSQL connection...');
  try {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/affiliate_management';
    console.log(`Using connection string: ${connectionString}`);
    
    const sql = postgres(connectionString, { max: 1 });
    const result = await sql`SELECT current_database() as database, current_timestamp as time`;
    
    console.log('✅ Successfully connected to PostgreSQL database:');
    console.log(`   Database: ${result[0].database}`);
    console.log(`   Server time: ${result[0].time}`);
    
    // Check tables
    console.log('\n   Checking database tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    if (tables.length === 0) {
      console.log('❌ No tables found in the database. Migrations may not have been run.');
    } else {
      console.log(`✅ Found ${tables.length} tables in the database:`);
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }
    
    // Clean up
    await sql.end();
  } catch (error) {
    console.log('❌ Failed to connect to PostgreSQL database:');
    console.log(`   Error: ${error.message}`);
  }
} else {
  // SQLite connection check
  console.log('\n2. Checking SQLite connection...');
  try {
    const dbPath = process.env.SQLITE_DB_PATH || './sqlite.db';
    console.log(`Using SQLite database at: ${dbPath}`);
    
    if (!fs.existsSync(dbPath)) {
      console.log(`❌ SQLite database file not found at: ${dbPath}`);
    } else {
      console.log(`✅ SQLite database file exists at: ${dbPath}`);
      
      // Connect to SQLite and check tables
      const db = new Database(dbPath);
      
      // Get list of tables
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all();
      
      if (tables.length === 0) {
        console.log('❌ No tables found in the database. Database might be empty.');
      } else {
        console.log(`✅ Found ${tables.length} tables in the database:`);
        tables.forEach(table => {
          console.log(`   - ${table.name}`);
        });
        
        // Check user table
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
        console.log(`✅ Found ${userCount.count} users in the database`);
      }
      
      // Close connection
      db.close();
    }
  } catch (error) {
    console.log('❌ Failed to connect to SQLite database:');
    console.log(`   Error: ${error.message}`);
  }
}

// Check server status
console.log('\n3. Checking server status...');
const port = parseInt(process.env.PORT || '3000', 10);

const portInUse = await isPortInUse(port);
if (portInUse) {
  console.log(`✅ Port ${port} is in use, a server may be running.`);
  
  // Check if the server is responding
  const serverStatus = await isServerResponding(port);
  if (serverStatus.responding) {
    console.log(`✅ Server is responding on port ${port}.`);
    console.log(`   Response: ${JSON.stringify(serverStatus.data)}`);
  } else {
    console.log(`❌ Port ${port} is in use, but the server is not responding to health checks.`);
    if (serverStatus.error) {
      console.log(`   Error: ${serverStatus.error}`);
    }
  }
} else {
  console.log(`❌ No server is running on port ${port}.`);
}

// Check file system
console.log('\n4. Checking critical files...');
const criticalFiles = [
  'drizzle.config.ts',
  'src/server/db/schema.ts',
  'src/server/db/index.ts',
  'src/server/routes/auth.ts'
];

for (const file of criticalFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists.`);
  } else {
    console.log(`❌ ${file} not found!`);
  }
}

// Check drizzle migrations directory
const migrationsDir = path.join(__dirname, 'drizzle', 'migrations');
if (fs.existsSync(migrationsDir)) {
  const migrationFiles = fs.readdirSync(migrationsDir);
  if (migrationFiles.length > 0) {
    console.log(`✅ Found ${migrationFiles.length} migration files in drizzle/migrations/.`);
  } else {
    console.log('❌ drizzle/migrations/ directory exists but contains no migration files.');
  }
} else {
  console.log('❌ drizzle/migrations/ directory not found. Run "npm run db:generate" to create migrations.');
}

console.log('\n======= Diagnostics Complete =======');
console.log('If you found issues, try the following:');
console.log('1. Make sure your database is properly set up');
console.log(`2. Run "npm run setup-${usePostgres ? 'postgres' : 'sqlite'}" to set up the database`);
console.log('3. Start the server with "npm run start:server"');
console.log('4. Start the frontend with "npm run dev"'); 