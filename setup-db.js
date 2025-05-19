/**
 * Database Setup Script
 * 
 * This script sets up the SQLite database for development.
 * It initializes the schema and creates demo data.
 */

// Load environment variables
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { spawn } from 'child_process';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });
dotenv.config({ path: '.env.development', override: true });

console.log('Setting up database...');

// Create a require function
const require = createRequire(import.meta.url);

// Run the TypeScript setup script using tsx
const setupProcess = spawn('npx', ['tsx', './src/server/db/setup.ts'], {
  stdio: 'inherit',
  shell: true
});

setupProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('Database setup completed successfully!');
  } else {
    console.error(`Database setup failed with code ${code}`);
  }
}); 