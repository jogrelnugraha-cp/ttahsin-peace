'use server';

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

function normalizePromotionType(type?: string): 'tahsin' | 'tahfidz' {
  const normalized = String(type || '').trim().toLowerCase();
  return normalized === 'tahfidz' ? 'tahfidz' : 'tahsin';
}

function isMissingTableError(error: { message?: string; code?: string | number }) {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('could not find the table') ||
    message.includes('does not exist') ||
    message.includes('relation') && message.includes('does not exist') ||
    error?.code === '42P01'
  );
}

function isMissingColumnError(error: { message?: string; code?: string | number }) {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes("could not find the 'notes' column") ||
    message.includes('could not find the column') ||
    (message.includes('column') && message.includes('does not exist'))
  );
}

async function insertPromotionRequest(payload: PromotionRequestData) {
  const candidates = [
    {
      table: 'promotion_requests',
      row: {
        student_id: payload.student_id,
        teacher_id: payload.teacher_id,
        type: payload.type,
        current_level: payload.current_level || null,
        target_level: payload.target_level,
        notes: payload.notes || '',
        status: 'pending',
      },
    },
    {
      table: 'level_promotions',
      row: {
        student_id: payload.student_id,
        guru_id: payload.teacher_id,
        category: payload.type === 'tahfidz' ? 'Tahfidz' : 'Tahsin',
        current_level: payload.current_level || null,
        target_level: payload.target_level,
        status: 'pending',
      },
      noteValue: payload.notes || '',
    },
  ];

  for (const candidate of candidates) {
    const row = { ...candidate.row } as Record<string, unknown>;
    if (candidate.table === 'promotion_requests') {
      row.notes = candidate.row.notes;
    } else if (candidate.table === 'level_promotions' && candidate.noteValue) {
      row.notes = candidate.noteValue;
    }

    let result = await supabaseAdmin.from(candidate.table).insert([row]).select();

    if (!result.error) {
      return { success: true as const, data: result.data, table: candidate.table };
    }

    if (candidate.table === 'level_promotions' && isMissingColumnError(result.error)) {
      const rowWithoutNotes = { ...candidate.row };
      const retry = await supabaseAdmin.from(candidate.table).insert([rowWithoutNotes]).select();
      if (!retry.error) {
        return { success: true as const, data: retry.data, table: candidate.table };
      }
      if (!isMissingTableError(retry.error)) {
        return { success: false as const, error: retry.error.message };
      }
      continue;
    }

    if (!isMissingTableError(result.error)) {
      return { success: false as const, error: result.error.message };
    }
  }

  return {
    success: false as const,
    error: 'Tabel promotion request aktif tidak ditemukan pada schema Supabase saat ini.',
  };
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

    const insertResult = await insertPromotionRequest(payload);

    if (!insertResult.success) {
      return insertResult;
    }

    revalidatePath('/dashboard/guru');
    revalidatePath('/dashboard/admin/approvals');
    revalidatePath('/dashboard/guru/promotions');

    return { success: true, data: insertResult.data };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga';
    return { success: false, error: errorMessage };
  }
}