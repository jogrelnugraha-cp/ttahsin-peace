'use server';

import { createSupabaseClient } from '@/lib/supabaseClient';

const supabase = createSupabaseClient({
  auth: { persistSession: false },
});

export interface PromotionRequestData {
  student_id: string;
  teacher_id?: string;
  type: 'tahsin' | 'tahfidz' | string;
  current_level?: string;
  target_level: string;
  notes?: string;
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

    // Jika dipanggil menggunakan 1 objek argument
    if (typeof studentIdOrPayload === 'object' && studentIdOrPayload !== null) {
      payload = studentIdOrPayload;
    } else {
      const normalizedType = type && ['tahsin', 'tahfidz'].includes((type || '').toLowerCase())
        ? type.toLowerCase()
        : 'tahsin';

      const normalizedTargetLevel = type && !['tahsin', 'tahfidz'].includes((type || '').toLowerCase())
        ? type
        : targetLevel || '';
      const normalizedNotes = type && !['tahsin', 'tahfidz'].includes((type || '').toLowerCase())
        ? targetLevel || ''
        : notes || '';
      const normalizedCurrentLevel = type && !['tahsin', 'tahfidz'].includes((type || '').toLowerCase())
        ? notes || ''
        : currentLevel || '';

      payload = {
        student_id: studentIdOrPayload,
        type: normalizedType as 'tahsin' | 'tahfidz',
        target_level: normalizedTargetLevel,
        notes: normalizedNotes,
        current_level: normalizedCurrentLevel,
      };
    }

    const { data, error } = await supabase
      .from('promotion_requests')
      .insert([
        {
          student_id: payload.student_id,
          teacher_id: payload.teacher_id || null,
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

    return { success: true, data };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga';
    return { success: false, error: errorMessage };
  }
}