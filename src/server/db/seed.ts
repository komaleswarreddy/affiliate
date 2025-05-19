import { db } from './index';
import { isDevelopment } from '../../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { TRIAL_PERIOD_DAYS } from '../../lib/constants';
import { hashPassword } from '../utils/password';
import { eq } from 'drizzle-orm';

// Use direct import to avoid ESM issues
import * as schemaLite from './schema-sqlite';
import * as schemaPg from './schema';

// Use the appropriate schema based on environment
const tenants = isDevelopment ? schemaLite.tenants : schemaPg.tenants;
const users = isDevelopment ? schemaLite.users : schemaPg.users;
const roles = isDevelopment ? schemaLite.roles : schemaPg.roles;

/**
 * Seeds the database with initial data for development
 */
async function seed() {
  console.log('Starting database seeding...');

  try {
    // Check if demo tenant exists
    const existingTenants = await db.select().from(tenants).where(eq(tenants.subdomain, 'demo'));
    
    if (existingTenants.length > 0) {
      console.log('Demo tenant already exists. Skipping seeding.');
      return;
    }
    
    // 1. Create demo tenant
    console.log('Creating demo tenant...');
    
    const [demoTenant] = await db.insert(tenants).values({
      id: uuidv4(),
      name: 'Demo Company',
      subdomain: 'demo',
      domain: 'demo.example.com',
      logoUrl: '',
      primaryColor: '#3667CE',
      secondaryColor: '#36A490',
      subscriptionTier: 'professional',
      maxUsers: 10,
      maxAffiliates: 50,
      status: 'active',
      // Skip setting expiresAt for now to avoid date handling issues
      settings: isDevelopment ? '{}' : {}
    }).returning();
    
    console.log(`Demo tenant created with ID: ${demoTenant.id}`);

    // 2. Create admin role
    console.log('Creating admin role...');
    const [adminRole] = await db.insert(roles).values({
      id: uuidv4(),
      tenantId: demoTenant.id,
      name: 'admin',
      description: 'Administrator with full access',
      permissions: isDevelopment ? JSON.stringify(['*']) : ['*'],
      isCustom: false,
      createdBy: 'system'
    }).returning();
    
    console.log(`Admin role created with ID: ${adminRole.id}`);
    
    // 3. Create user role
    console.log('Creating user role...');
    const userPermissions = [
      'affiliates:view',
      'campaigns:view',
      'commissions:view',
      'analytics:view'
    ];
    
    const [userRole] = await db.insert(roles).values({
      id: uuidv4(),
      tenantId: demoTenant.id,
      name: 'user',
      description: 'Regular user with limited access',
      permissions: isDevelopment ? JSON.stringify(userPermissions) : userPermissions,
      isCustom: false,
      createdBy: 'system'
    }).returning();
    
    console.log(`User role created with ID: ${userRole.id}`);

    // 4. Create demo admin user
    console.log('Creating demo admin user...');
    const adminPassword = await hashPassword('Demo123!');
    
    const [adminUser] = await db.insert(users).values({
      id: uuidv4(),
      tenantId: demoTenant.id,
      email: 'demo@example.com',
      password: adminPassword,
      firstName: 'Demo',
      lastName: 'Admin',
      roleId: adminRole.id,
      termsAccepted: true
    }).returning();
    
    console.log(`Demo admin user created with ID: ${adminUser.id}`);
    
    // 5. Create demo regular user
    console.log('Creating demo regular user...');
    const userPassword = await hashPassword('Demo123!');
    
    const [regularUser] = await db.insert(users).values({
      id: uuidv4(),
      tenantId: demoTenant.id,
      email: 'user@example.com',
      password: userPassword,
      firstName: 'Demo',
      lastName: 'User',
      roleId: userRole.id,
      termsAccepted: true
    }).returning();
    
    console.log(`Demo regular user created with ID: ${regularUser.id}`);
    
    console.log('Database seeding completed successfully!');
    console.log('You can login with:');
    console.log('  Admin: demo@example.com / Demo123!');
    console.log('  User: user@example.com / Demo123!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Export the seed function as default export
export default seed;

// Run the seed function when this file is executed directly
// This works in ESM environments
if (import.meta.url === (typeof document === 'undefined' ? import.meta.url : null)) {
  seed().then(() => {
    console.log('Seeding completed!');
    process.exit(0);
  }).catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
} 