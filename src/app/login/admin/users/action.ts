'server'

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

export async function createUserAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const role = formData.get('role') as 'admin' | 'guru' | 'santri';

  if (!email || !password || !fullName || !role) {
    return { error: 'Semua field wajib diisi.' };
  }

  // 1. Buat user di Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Langsung konfirmasi email
    user_metadata: { full_name: fullName, role },
  });

  if (authError) return { error: authError.message };

  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUserAction(userId: string) {
  // Menghapus user dari auth.users otomatis menghapus profile via CASCADE
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) return { error: error.message };

  revalidatePath('/admin/users');
  return { success: true };
}