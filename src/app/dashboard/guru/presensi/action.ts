'use server';

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface PresensiItem {
  student_id: string;
  status: 'none' | 'hadir' | 'izin' | 'sakit' | 'alpha';
  notes?: string;
  attendance_date?: string;
}

function normalizeAttendanceStatus(status?: string): PresensiItem['status'] {
  const normalized = String(status ?? 'hadir').trim().toLowerCase();

  if (normalized === 'alpa') {
    return 'alpha';
  }

  if (normalized === 'hadir' || normalized === 'izin' || normalized === 'sakit' || normalized === 'alpha') {
    return normalized;
  }

  return 'hadir';
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

  let userId = user?.id;

  if (!userId) {
    const { data: sessionData } = await supabase.auth.getSession();
    userId = sessionData?.session?.user?.id;
  }

  const db = userId ? supabase : supabaseAdmin;

  const normalizeEntries = (rows: Array<Record<string, unknown>>) =>
    (rows || [])
      .map((row) => {
        const studentId = String(row.student_id ?? '');
        const dateValue = String(row.attendance_date ?? row.date ?? row.tanggal ?? '');
        const statusValue = normalizeAttendanceStatus(String(row.status ?? 'hadir'));
        const notesValue = String(row.notes ?? row.catatan ?? '');

        if (!studentId || !dateValue) return null;

        return {
          student_id: studentId,
          attendance_date: dateValue,
          status: statusValue,
          notes: notesValue,
        } satisfies PresensiItem & { attendance_date: string };
      })
      .filter(Boolean) as Array<PresensiItem & { attendance_date: string }>;

  try {
    const { data: attendanceRows, error: attendanceError } = await db
      .from('attendances')
      .select('student_id, attendance_date, status, notes')
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate)
      .order('attendance_date', { ascending: true });

    if (attendanceError) {
      throw new Error(`Gagal memuat absensi: ${attendanceError.message}`);
    }

    return normalizeEntries(attendanceRows || []);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat absensi.';
    throw new Error(message);
  }
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

    // Prepare payload data sesuai skema tabel attendances yang benar-benar dipakai UI
    const payload = validRecords.map((item) => ({
      student_id: item.student_id,
      attendance_date: item.attendance_date || new Date().toISOString().split('T')[0],
      status: normalizeAttendanceStatus(item.status),
      notes: item.notes || '',
    }));

    const { error: insertError } = await db
      .from('attendances')
      .upsert(payload, { onConflict: 'student_id,attendance_date' });

    if (insertError) {
      console.error('[Presensi Action Error]:', insertError);
      return {
        success: false,
        error: insertError.message || 'Gagal menyimpan absensi.',
      };
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