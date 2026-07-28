import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// WAJIB: Memaksa Next.js agar route ini dijalankan secara dinamis (tidak di-pre-render saat build)
export const dynamic = 'force-dynamic';

// Helper function untuk membuat Supabase Client secara aman saat request diproses
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Memprioritaskan SUPABASE_SERVICE_ROLE_KEY untuk akses admin, atau fallback ke ANON_KEY
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL atau API Key tidak ditemukan di environment variables.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// 1. GET: Mengambil daftar pengguna/profile
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: profiles }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan server';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// 2. POST: Membuat/Menambahkan pengguna baru
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { email, role, full_name } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert([{ email, role: role || 'siswa', full_name }])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan server';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// 3. DELETE: Menghapus pengguna berdasarkan ID
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'ID Pengguna wajib disertakan' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'User berhasil dihapus' }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan server';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}