import { createClient } from '@supabase/supabase-js';

// ==========================================
// SECURITY & CONFIGURATION CHECK
// ==========================================
// We use the public VITE_SUPABASE_ANON_KEY to interact with Supabase from the client side.
// Data protection is NOT handled in the client, but entirely relies on Supabase
// Row Level Security (RLS) policies configured in the database.
// 
// Environment variables are securely accessed via Vite's import.meta.env

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const barberWhatsapp = import.meta.env.VITE_BARBER_WHATSAPP || '1234567890'; // Fallback if not provided

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVar = !supabaseUrl ? 'VITE_SUPABASE_URL' : 'VITE_SUPABASE_ANON_KEY';
  throw new Error(`CRITICAL ERROR: Missing Supabase environment variable: ${missingVar}. Check your .env.local file.`);
}

// Check for invalid URL format dynamically
try {
  new URL(supabaseUrl);
} catch (e) {
  throw new Error(`CRITICAL ERROR: VITE_SUPABASE_URL is not a valid URL: ${supabaseUrl}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
