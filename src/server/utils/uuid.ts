import { v4 as uuidv4 } from 'uuid';
import { isDevelopment } from '../../lib/utils';

/**
 * Generate a random UUID
 * 
 * This function provides a consistent way to generate UUIDs across the application.
 * We always generate UUIDs in JavaScript to ensure reliability.
 */
export function generateUUID(): string {
  // Use the uuid library to generate a v4 UUID
  return uuidv4();
}

/**
 * Generate UUID for database insertion
 * 
 * This is a helper function that returns a UUID string for insertion
 * into PostgreSQL database
 */
export function getUUIDForDB(): string {
  // Always generate the UUID in JavaScript for reliability
  return generateUUID();
}

/**
 * SQL function expression for generating UUID - DEPRECATED
 * 
 * This function is kept for backwards compatibility but should not be used
 * in new code. Always use generateUUID() directly and pass the generated
 * UUID as a parameter instead.
 */
export function getUUIDSqlExpression(): string {
  // Always use a placeholder to be filled with a generated UUID value
  return '?';
} 