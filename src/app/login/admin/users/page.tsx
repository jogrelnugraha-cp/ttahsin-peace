import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createUserAction, deleteUserAction } from './actions';

export default async function AdminUsersPage() {
  const supabase = createServerComponentClient({ cookies });

  // Ambil daftar user & profile
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Manajemen Akun (Admin)</h1>

      {/* Form Tambah User Baru */}
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Tambah User Baru</h2>
        <form action={createUserAction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="fullName"
            type="text"
            placeholder="Nama Lengkap"
            className="border p-2 rounded w-full"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email Santri/Guru"
            className="border p-2 rounded w-full"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password Sementara"
            className="border p-2 rounded w-full"
            required
          />
          <select name="role" className="border p-2 rounded w-full" defaultValue="santri">
            <option value="santri">Santri</option>
            <option value="guru">Guru</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            className="md:col-span-2 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 transition"
          >
            + Buat Akun
          </button>
        </form>
      </div>

      {/* Daftar User */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-sm font-medium text-gray-600">
              <th className="p-3">Nama Lengkap</th>
              <th className="p-3">Role</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {profiles?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 text-sm">
                <td className="p-3 font-medium">{user.full_name}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'guru' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <form action={deleteUserAction.bind(null, user.id)} className="inline">
                    <button
                      type="submit"
                      className="text-red-600 hover:underline text-xs font-semibold"
                    >
                      Hapus
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}