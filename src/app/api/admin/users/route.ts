import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// POST: Tambah User Baru (Guru / Santri / Admin)
export async function POST(req: Request) {
  try {
    const { email, password, full_name, role } = await req.json();

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // 1. Buat User di Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Insert / Upsert data ke tabel public.profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([{ id: userId, email, full_name, role }]);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'User berhasil dibuat', user: authData.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Hapus User
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'ID User diperlukan' }, { status: 400 });
    }

    // 1. Hapus dari Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Hapus dari public.profiles
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}