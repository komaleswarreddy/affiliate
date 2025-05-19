# PostgreSQL Migration Guide

This guide explains how to migrate your Affiliate Management Platform from SQLite to PostgreSQL.

## Prerequisites

Before starting the migration, make sure you have:

1. A PostgreSQL database server set up and running
2. The connection string for your PostgreSQL database
3. Node.js and npm installed on your system
4. Your existing SQLite database with data (if you want to migrate data)

## Configuration

1. Update your `.env` file with the PostgreSQL connection string:

```
DATABASE_URL=postgresql://postgres:YourPassword@localhost:5432/affiliate_management
```

Or you can use the provided Supabase connection string:

```
DATABASE_URL=postgresql://postgres:ASDFvbnm1234@db.mrllkgecomlqzwgftdtz.supabase.co:5432/postgres
```

2. Make sure this connection string is also set in `.env.local` and `.env.development` files.

## Migration Steps

### Option 1: Migrate with Data (From SQLite to PostgreSQL)

If you have existing data in your SQLite database that you want to migrate:

1. Generate the PostgreSQL schema:

```
npm run db:generate
```

2. Run the complete migration process:

```
npm run db:migrate-all
```

This script will:
- Migrate data from your SQLite database to PostgreSQL
- Set up the PostgreSQL schema
- Create demo data if needed

### Option 2: Fresh Start with PostgreSQL

If you want to start fresh with PostgreSQL:

1. Generate the PostgreSQL schema:

```
npm run db:generate
```

2. Set up the PostgreSQL database:

```
npm run setup-postgres
```

This will create the database schema and add demo data for testing.

## Verifying the Migration

After completing the migration, you can verify everything is working by:

1. Starting the server:

```
npm run start:server
```

2. In another terminal, start the frontend:

```
npm run dev
```

3. Visit the application in your browser and try logging in with:
   - Email: demo@example.com
   - Password: Demo123!
   - Tenant: demo

## Troubleshooting

If you encounter any issues during the migration:

1. Check the database connection string in your environment files
2. Make sure PostgreSQL is running and accessible
3. Look for error messages in the terminal output
4. Try running the individual steps manually:
   ```
   node migrate-to-postgres.js
   node setup-postgres.js
   ```

If you need to start over:
1. Clear your PostgreSQL database tables
2. Run the migration process again

## Notes

- All UUIDs are now generated at the application level for consistency
- The authentication system has been improved to handle errors better
- Better error handling has been added to prevent UUID-related issues

If you have any questions or issues, please reach out to the development team. 