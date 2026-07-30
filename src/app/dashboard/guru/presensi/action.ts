'use server';

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface PresensiItem {
  student_id: string;
  status: 'none' | 'hadir' | 'izin' | 'sakit' | 'alfa' | 'libur';
  catatan?: string;
  tanggal?: string;
}

async function createPresensiServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
        },
      },
    }
  );
}

export async function getExistingPresensiForRange(startDate: string, endDate: string) {
  const supabase = await createPresensiServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('presensi')
    .select('student_id, tanggal, status, catatan')
    .eq('guru_id', user.id)
    .gte('tanggal', startDate)
    .lte('tanggal', endDate)
    .order('tanggal', { ascending: true });

  if (error) {
    throw new Error(`Gagal memuat absensi: ${error.message}`);
  }

  return (data || []) as Array<PresensiItem & { tanggal: string }>;
}

export async function submitPeriodPresensi(records: PresensiItem[]) {
  try {
    if (!records || records.length === 0) {
      return { success: false, error: 'Tidak ada data presensi yang dikirim.' };
    }

    const supabase = await createPresensiServerClient();

    // 1. Cek User / Session yang sedang login
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userId = user?.id;

    if (!userId) {
      const { data: sessionData } = await supabase.auth.getSession();
      userId = sessionData?.session?.user?.id;
    }

    // Gunakan client sesi login atau fallback ke supabaseAdmin jika sesi cookie tidak terbaca
    const db = userId ? supabase : supabaseAdmin;

    // Filter record yang valid
    const validRecords = records.filter((r) => r.status && r.status !== 'none');

    if (validRecords.length === 0) {
      return { success: true, message: 'Tidak ada perubahan presensi yang disimpan.' };
    }

    // Prepare payload data
    const payload = validRecords.map((item) => ({
      student_id: item.student_id,
      status: item.status,
      catatan: item.catatan || '',
      date: item.tanggal || new Date().toISOString().split('T')[0],
      created_by: userId || null,
    }));

    // Upsert ke database
    const { error: insertError } = await db
      .from('attendances')
      .upsert(payload, { onConflict: 'student_id,date' });

    if (insertError) {
      // Fallback jika tabel di DB bernama 'presensi'
      const { error: fallbackError } = await db
        .from('presensi')
        .upsert(payload, { onConflict: 'student_id,date' });

      if (fallbackError) {
        console.error('[Presensi Action Error]:', insertError || fallbackError);
        return { success: false, error: insertError.message || fallbackError.message };
      }
    }

    // Refresh halaman presensi
    revalidatePath('/dashboard/guru/presensi');

    return { success: true, message: 'Data presensi berhasil disimpan.' };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Presensi System Error]:', errorMsg);
    return { success: false, error: errorMsg };
  }
}