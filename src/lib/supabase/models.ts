/**
 * This file contains the data access methods for working with Supabase.
 * In a real application, these would make actual database calls.
 */

import { isDevelopment, logDebug } from '@/lib/utils';
import { Tenant, User, Role } from '@/types';

// Mock tenants data access
export const tenants = {
  getById: async (id: string) => {
    logDebug('Mock: Getting tenant by ID', id);
    
    if (isDevelopment) {
      return {
        id,
        tenant_name: 'Development Company',
        name: 'Development Company',
        subdomain: 'dev',
        domain: 'dev.example.com',
        logo_url: null,
        primary_color: '#3667CE',
        secondary_color: '#36A490',
        subscription_tier: 'trial',
        max_users: 5,
        max_affiliates: 10,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {}
      };
    }
    
    return null;
  },
  
  getBySubdomain: async (subdomain: string) => {
    logDebug('Mock: Getting tenant by subdomain', subdomain);
    
    if (isDevelopment || subdomain === 'demo') {
      return {
        id: subdomain === 'demo' ? 'demo-tenant-id' : 'dev-tenant-id',
        tenant_name: subdomain === 'demo' ? 'Demo Company' : 'Development Company',
        name: subdomain === 'demo' ? 'Demo Company' : 'Development Company',
        subdomain,
        domain: `${subdomain}.example.com`,
        logo_url: null,
        primary_color: '#3667CE',
        secondary_color: '#36A490',
        subscription_tier: subdomain === 'demo' ? 'professional' : 'trial',
        max_users: subdomain === 'demo' ? 10 : 5,
        max_affiliates: subdomain === 'demo' ? 50 : 10,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: subdomain === 'demo' ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {}
      };
    }
    
    return null;
  },
  
  create: async (data: any) => {
    logDebug('Mock: Creating tenant', data);
    return {
      id: 'mock-tenant-id',
      created_at: new Date().toISOString(),
      ...data
    };
  },
  
  update: async (id: string, data: any) => {
    logDebug('Mock: Updating tenant', id, data);
    return {
      id,
      updated_at: new Date().toISOString(),
      ...data
    };
  }
};

// Mock users data access
export const users = {
  getById: async (id: string) => {
    logDebug('Mock: Getting user by ID', id);
    
    if (isDevelopment) {
      return {
        id,
        tenant_id: 'dev-tenant-id',
        email: 'dev@example.com',
        first_name: 'Dev',
        last_name: 'User',
        role_id: 'admin-role-id',
        created_at: new Date().toISOString()
      };
    }
    
    return null;
  },
  
  getByEmail: async (email: string, tenantId: string) => {
    logDebug('Mock: Getting user by email', email, 'in tenant', tenantId);
    
    if (isDevelopment || email === 'demo@example.com') {
      return {
        id: email === 'demo@example.com' ? 'demo-user-id' : 'dev-user-id',
        tenant_id: tenantId,
        email,
        first_name: email === 'demo@example.com' ? 'Demo' : 'Dev',
        last_name: 'User',
        role_id: 'admin-role-id',
        created_at: new Date().toISOString()
      };
    }
    
    return null;
  },
  
  create: async (data: any) => {
    logDebug('Mock: Creating user', data);
    return {
      id: 'mock-user-id',
      created_at: new Date().toISOString(),
      ...data
    };
  },
  
  update: async (id: string, data: any) => {
    logDebug('Mock: Updating user', id, data);
    return {
      id,
      updated_at: new Date().toISOString(),
      ...data
    };
  }
};

// Mock roles data access
export const roles = {
  getById: async (id: string) => {
    logDebug('Mock: Getting role by ID', id);
    
    if (isDevelopment) {
      return {
        id,
        tenant_id: 'dev-tenant-id',
        name: 'Admin',
        description: 'Full access to all features',
        permissions: ['*'],
        is_custom: false,
        created_by: 'system',
        created_at: new Date().toISOString()
      };
    }
    
    return null;
  },
  
  getByName: async (name: string, tenantId: string) => {
    logDebug('Mock: Getting role by name', name, 'in tenant', tenantId);
    
    if (isDevelopment) {
      return {
        id: `${name.toLowerCase()}-role-id`,
        tenant_id: tenantId,
        name,
        description: name === 'Admin' ? 'Full access to all features' : `${name} role`,
        permissions: name === 'Admin' ? ['*'] : ['read:*'],
        is_custom: false,
        created_by: 'system',
        created_at: new Date().toISOString()
      };
    }
    
    return null;
  }
}; 