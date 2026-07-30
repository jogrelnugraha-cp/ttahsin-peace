import { createClient } from '@supabase/supabase-js';

// Pastikan menghapus garis miring di akhir URL jika ada
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper to create a new Supabase client with custom options
export function createSupabaseClient(options?: Parameters<typeof createClient>[2]) {
  const defaultOpts = {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  } as const;

  return createClient(supabaseUrl, supabaseAnonKey, options ?? defaultOpts);
}