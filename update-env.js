import fs from 'fs';
import path from 'path';

// Path to .env file
const envPath = './.env';

console.log('Updating .env file to use new database...');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.error(`.env file not found at ${envPath}`);
  process.exit(1);
}

// Read current .env content
let envContent = fs.readFileSync(envPath, 'utf8');
console.log('Current .env file read successfully.');

// Check if SQLITE_DB_PATH is already in the .env file
if (envContent.includes('SQLITE_DB_PATH=')) {
  // Replace existing SQLITE_DB_PATH
  envContent = envContent.replace(/SQLITE_DB_PATH=.*$/m, 'SQLITE_DB_PATH=./sqlite-new.db');
  console.log('Replaced existing SQLITE_DB_PATH in .env file.');
} else {
  // Add SQLITE_DB_PATH to the end of the file
  envContent += '\n# Path to SQLite database file\nSQLITE_DB_PATH=./sqlite-new.db\n';
  console.log('Added SQLITE_DB_PATH to .env file.');
}

// Create a backup of the original .env file
const backupPath = `${envPath}.backup-${Date.now()}`;
console.log(`Creating backup of original .env file: ${backupPath}`);
fs.writeFileSync(backupPath, fs.readFileSync(envPath));

// Write updated content back to .env file
fs.writeFileSync(envPath, envContent);
console.log('Updated .env file written successfully.');

console.log('\nSUCCESS: .env file has been updated to use the new database!');
console.log('The application will now use the fresh database when restarted.');
console.log('\nPlease restart your application for changes to take effect.'); 