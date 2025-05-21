import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

if (!config.supabaseServiceRoleKey) {
  throw new Error('Missing Supabase service role key. Please check your .env file.');
}

// Create Supabase client for regular operations
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create Supabase admin client for admin operations
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
); 