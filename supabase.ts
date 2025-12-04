import { createClient } from '@supabase/supabase-js';

let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  // Safely check if import.meta.env exists before accessing properties.
  // This prevents "Cannot read properties of undefined" errors in preview environments.
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    // @ts-ignore
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }
} catch (error) {
  // Environment variables not available or access failed
  console.warn('Supabase environment variables missing or inaccessible.');
}

// Safely create the client. If keys are missing (like in preview), return null.
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;