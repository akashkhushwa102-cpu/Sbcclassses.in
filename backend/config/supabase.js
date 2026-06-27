import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY || '';

// Use mock credentials for development if real ones are not provided
const isDevelopment = !supabaseUrl || !supabaseKey;

if (isDevelopment) {
  console.log('⚠️  Using development/mock Supabase credentials');
  supabaseUrl = supabaseUrl || 'https://mock-dev.supabase.co';
  supabaseKey = supabaseKey || 'mock-dev-key-12345678901234567890';
}

// Public client (anon key)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Admin client (service key)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : supabase;

console.log('✅ Supabase initialized (Development mode)');
