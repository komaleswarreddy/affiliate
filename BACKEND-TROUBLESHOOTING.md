# Backend Troubleshooting Guide

This guide will help you resolve issues with the backend of the Affiliate Management Platform, particularly after migrating from SQLite to PostgreSQL.

## Quick Start

Run the diagnostic tool to identify issues:

```
npm run diagnostics
```

This tool will check your environment variables, database connection, server status, and critical files.

## Common Issues and Solutions

### 1. Database Connection Issues

**Symptoms:**
- Server fails to start with database connection errors
- "Cannot connect to PostgreSQL" errors
- Database queries failing

**Solutions:**

1. **Check PostgreSQL connection string:**
   - Ensure your `.env`, `.env.local`, and `.env.development` files contain the correct `DATABASE_URL`
   - Make sure PostgreSQL is running and accessible from your machine
   - The default connection string is: 
     ```
     postgresql://postgres:ASDFvbnm1234@db.mrllkgecomlqzwgftdtz.supabase.co:5432/postgres
     ```

2. **Verify database tables exist:**
   - Run the schema generation: `npm run db:generate`
   - Set up the database: `npm run setup-postgres`

3. **Reset the database connection:**
   - Stop the server
   - Restart PostgreSQL service
   - Start the server again: `npm run start:server`

### 2. UUID-Related Errors

**Symptoms:**
- "UUID not found" errors
- "Cannot read property of undefined" errors related to IDs
- Database insert/update failures

**Solutions:**

1. **Ensure UUIDs are generated correctly:**
   - Check that all UUID generation uses the application-level `generateUUID()` function from `src/server/utils/uuid.ts`
   - Avoid relying on database-generated UUIDs

2. **Fix specific entity creation issues:**
   - For user creation issues: Check `src/server/routes/auth.ts` for proper UUID generation
   - For tenant issues: Make sure tenant IDs are properly generated before user creation

3. **Clear problematic data:**
   - If specific records are causing issues, you may need to delete them from the database

### 3. Authentication and Login Problems

**Symptoms:**
- Unable to log in
- JWT token errors
- "Invalid credentials" even with correct username/password

**Solutions:**

1. **Check JWT configuration:**
   - Ensure `JWT_SECRET` is set in your environment files
   - Verify that the same secret is used for token generation and verification

2. **Debug login flow:**
   - Check the login endpoint in `src/server/routes/auth.ts`
   - Verify the password hashing and comparison is working correctly

3. **Try the demo account:**
   - Email: demo@example.com
   - Password: Demo123!
   - Tenant: demo

4. **Recreate the demo data:**
   - Run: `npm run setup-postgres`

### 4. Missing or Invalid Schema

**Symptoms:**
- "Table does not exist" errors
- Missing columns or relationships
- Data type mismatches

**Solutions:**

1. **Regenerate the schema:**
   ```
   npm run db:generate
   ```

2. **Apply migrations:**
   ```
   npm run db:migrate
   ```

3. **Verify schema was created:**
   ```
   npm run diagnostics
   ```
   Look for the database tables section to confirm tables exist.

4. **If tables are missing or incorrect:**
   ```
   npm run setup-postgres
   ```

### 5. Server Start-up Issues

**Symptoms:**
- Server fails to start
- Port already in use errors
- Missing dependency errors

**Solutions:**

1. **Check for processes using the same port:**
   - Default port is 3000
   - Kill any processes using that port

2. **Install missing dependencies:**
   ```
   npm install
   ```

3. **Check for syntax errors:**
   - Look at the error message for file references
   - Fix any syntax issues in the mentioned files

4. **Try running with Node debugging:**
   ```
   NODE_DEBUG=* npm run start:server
   ```

## Complete Reset Procedure

If you're experiencing multiple issues, it might be easiest to do a complete reset:

1. **Stop all running servers**

2. **Generate fresh migrations:**
   ```
   npm run db:generate
   ```

3. **Set up the PostgreSQL database from scratch:**
   ```
   npm run setup-postgres
   ```

4. **Start the server:**
   ```
   npm run start:server
   ```

5. **In a new terminal, start the frontend:**
   ```
   npm run dev
   ```

## Getting Help

If you're still experiencing issues:

1. Check the server logs for detailed error messages
2. Look at the database logs for query errors
3. Run the diagnostics tool and share the results when asking for help
4. Check the PostgreSQL connection using a database client like pgAdmin or DBeaver

## Useful Commands

```bash
# Generate PostgreSQL schema
npm run db:generate

# Set up PostgreSQL database
npm run setup-postgres

# Run complete migration from SQLite to PostgreSQL (if needed)
npm run db:migrate-all

# Run diagnostics
npm run diagnostics

# Start backend server
npm run start:server

# Start frontend development server
npm run dev

# Run both frontend and backend
npm run dev:all
``` 