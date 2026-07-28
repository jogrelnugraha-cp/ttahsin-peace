import { createClient } from '@supabase/supabase-js';

// Client ini menggunakan Service Role Key untuk melewati RLS & Auth restrictions
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);