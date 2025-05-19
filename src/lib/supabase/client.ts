/**
 * This file initializes the Supabase client.
 * In a real application, this would use actual Supabase credentials.
 */

import { isDevelopment, logDebug } from '@/lib/utils';

// Mock Supabase client
const supabaseClient = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      logDebug('Mock: Signing in with password', email);
      
      if (isDevelopment) {
        return {
          data: {
            user: {
              id: 'mock-user-id',
              email
            },
            session: {
              access_token: 'mock-token'
            }
          },
          error: null
        };
      }
      
      return { data: null, error: new Error('Not implemented') };
    },
    
    signUp: async ({ email, password }: { email: string; password: string }) => {
      logDebug('Mock: Signing up', email);
      
      if (isDevelopment) {
        return {
          data: {
            user: {
              id: 'mock-user-id',
              email
            },
            session: {
              access_token: 'mock-token'
            }
          },
          error: null
        };
      }
      
      return { data: null, error: new Error('Not implemented') };
    },
    
    signOut: async () => {
      logDebug('Mock: Signing out');
      return { error: null };
    },
    
    getSession: async () => {
      if (isDevelopment) {
        return {
          data: {
            session: {
              access_token: 'mock-token',
              user: {
                id: 'mock-user-id',
                email: 'dev@example.com'
              }
            }
          },
          error: null
        };
      }
      
      return { data: null, error: null };
    }
  },
  
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => {
          logDebug(`Mock: Select from ${table}`);
          return { data: null, error: null };
        },
        limit: () => ({
          single: async () => {
            logDebug(`Mock: Select from ${table} with limit`);
            return { data: null, error: null };
          }
        })
      })
    }),
    insert: () => ({
      select: () => ({
        single: async () => {
          logDebug(`Mock: Insert into ${table}`);
          return { data: { id: 'mock-id' }, error: null };
        }
      })
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: async () => {
            logDebug(`Mock: Update ${table}`);
            return { data: { id: 'mock-id' }, error: null };
          }
        })
      })
    }),
    delete: () => ({
      eq: () => ({
        select: () => ({
          single: async () => {
            logDebug(`Mock: Delete from ${table}`);
            return { data: { id: 'mock-id' }, error: null };
          }
        })
      })
    })
  })
};

export const supabase = supabaseClient;

// Export auth functionality
export const auth = supabaseClient.auth; 