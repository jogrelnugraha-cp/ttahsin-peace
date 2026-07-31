'use server';

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface PromotionRequestData {
  student_id: string;
  teacher_id?: string;
  type: 'tahsin' | 'tahfidz' | string;
  current_level?: string;
  target_level: string;
  notes?: string;
}

async function createPromotionServerClient() {
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

function normalizePromotionType(type?: string): 'tahsin' | 'tahfidz' {
  const normalized = String(type || '').trim().toLowerCase();
  return normalized === 'tahfidz' ? 'tahfidz' : 'tahsin';
}

export async function submitPromotionRequest(
  studentIdOrPayload: string | PromotionRequestData,
  type?: 'tahsin' | 'tahfidz' | string,
  targetLevel?: string,
  notes?: string,
  currentLevel?: string
) {
  try {
    let payload: PromotionRequestData;

    if (typeof studentIdOrPayload === 'object' && studentIdOrPayload !== null) {
      payload = studentIdOrPayload;
    } else {
      payload = {
        student_id: studentIdOrPayload,
        type: normalizePromotionType(type),
        target_level: targetLevel || '',
        notes: notes || '',
        current_level: currentLevel || '',
      };
    }

    payload.type = normalizePromotionType(String(payload.type || ''));
    payload.target_level = String(payload.target_level || '').trim();
    payload.notes = String(payload.notes || '').trim();
    payload.current_level = String(payload.current_level || '').trim();

    if (!payload.student_id) {
      return { success: false, error: 'ID santri wajib diisi.' };
    }

    if (!payload.teacher_id) {
      return { success: false, error: 'Guru penyetuju wajib dipilih.' };
    }

    if (!payload.target_level) {
      return { success: false, error: 'Target level baru wajib diisi.' };
    }

    const supabase = await createPromotionServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let db = user ? supabase : supabaseAdmin;

    if (!user) {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user;

      if (!sessionUser) {
        return { success: false, error: 'Sesi pengguna tidak valid. Silakan login ulang.' };
      }

      db = supabase;
    }

    const { data, error } = await db
      .from('promotion_requests')
      .insert([
        {
          student_id: payload.student_id,
          teacher_id: payload.teacher_id,
          type: payload.type,
          current_level: payload.current_level || null,
          target_level: payload.target_level,
          notes: payload.notes || '',
          status: 'pending',
        },
      ])
      .select();

    if (error) {
      console.error('Error submitting promotion request:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/guru');
    revalidatePath('/dashboard/admin/approvals');

    return { success: true, data };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga';
    return { success: false, error: errorMessage };
  }
}