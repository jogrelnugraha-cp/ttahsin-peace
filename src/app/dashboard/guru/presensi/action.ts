'use server';

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export interface PresensiItem {
  student_id: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alfa';
  catatan?: string;
}

export async function submitBulkPresensi(
  pertemuanKe: number,
  tanggal: string,
  records: PresensiItem[]
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Pengguna tidak terautentikasi.');

  // Susun payload untuk di-insert ke Supabase
  const payload = records.map((item) => ({
    student_id: item.student_id,
    guru_id: user.id,
    pertemuan_ke: pertemuanKe,
    tanggal: tanggal,
    status: item.status,
    catatan: item.catatan || '',
  }));

  const { error } = await supabase.from('presensi').insert(payload);

  if (error) {
    throw new Error(`Gagal menyimpan presensi: ${error.message}`);
  }

  revalidatePath('/dashboard/guru/presensi');
  return { success: true };
}