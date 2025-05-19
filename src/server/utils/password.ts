import * as crypto from 'crypto';

/**
 * Hash a password using PBKDF2 (a strong key derivation function)
 * 
 * @param password Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  console.log(`Hashing password (length: ${password.length})`);
  
  try {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Use PBKDF2 to hash the password
    const hash = crypto.pbkdf2Sync(
      password,
      salt,
      10000, // Number of iterations
      64,    // Key length
      'sha512'
    ).toString('hex');
    
    // Return the salt:hash combination
    const result = `${salt}:${hash}`;
    console.log(`Password hashed successfully (hash length: ${result.length})`);
    return result;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

/**
 * Compare a plain text password with a stored hash
 * 
 * @param password Plain text password to check
 * @param storedHash Stored hash from the database
 * @returns Whether passwords match
 */
export async function comparePasswords(password: string, storedHash: string): Promise<boolean> {
  try {
    console.log(`Comparing password (hash length: ${storedHash.length})`);
    
    // Split the stored hash to get the salt and hash
    const [salt, hash] = storedHash.split(':');
    
    // If the stored hash is not in the expected format, return false
    if (!salt || !hash) {
      console.error('Invalid stored hash format');
      return false;
    }
    
    // Hash the input password with the same salt
    const inputHash = crypto.pbkdf2Sync(
      password,
      salt,
      10000, // Same number of iterations as in hashPassword
      64,    // Same key length as in hashPassword
      'sha512'
    ).toString('hex');
    
    // Compare the hashes
    const isMatch = hash === inputHash;
    console.log(`Password comparison result: ${isMatch}`);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
} 