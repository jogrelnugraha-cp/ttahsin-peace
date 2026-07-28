import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createUserAction, deleteUserAction } from './action';

// Tipe data eksplisit untuk menggantikan 'any'
interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  created_at?: string;
}

export default async function AdminUsersPage() {
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

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Manajemen Akun (Admin)</h1>

      {/* Form Tambah User Baru */}
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Tambah User Baru</h2>

        <form
          action={async (formData: FormData) => {
            'use server';
            await createUserAction(formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-2 border rounded-md"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full p-2 border rounded-md"
              placeholder="******"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select name="role" className="w-full p-2 border rounded-md" defaultValue="siswa">
              <option value="admin">Admin</option>
              <option value="guru">Guru</option>
              <option value="siswa">Siswa</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Tambah User
          </button>
        </form>
      </div>

      {/* Daftar User */}
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Daftar Pengguna</h2>
        <div className="divide-y">
          {(profiles as UserProfile[] | null)?.map((user: UserProfile) => (
            <div key={user.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{user.full_name || user.email || 'Tanpa Nama'}</p>
                <p className="text-sm text-gray-500">Role: {user.role}</p>
              </div>

              <form
                action={async () => {
                  'use server';
                  await deleteUserAction(user.id);
                }}
              >
                <button
                  type="submit"
                  className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600 transition"
                >
                  Hapus
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}