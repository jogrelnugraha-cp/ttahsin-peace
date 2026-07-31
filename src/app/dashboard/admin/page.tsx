"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  id: string;
  full_name: string;
  role: 'siswa' | 'guru' | 'admin';
  nis?: string;
  tahsin_level?: string;
  tahfidz_level?: string;
  pembimbing_id?: string;
  teacher_level?: number;
  pembimbing?: { full_name: string } | null;
}

interface TeacherProfile {
  id: string;
  full_name: string;
  teacher_level?: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const pathname = usePathname();
  const [authMissing, setAuthMissing] = useState(false);
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalGuru: 0,
    totalAdmin: 0,
  });

  // Debug / realtime counters (visible on-screen for verification)
  const [debugCounts, setDebugCounts] = useState({
    totalProfiles: 0,
    totalSiswa: 0,
    totalGuru: 0,
    totalAdmin: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [debugSample, setDebugSample] = useState<any[] | null>(null);

  // Modal State untuk Penetapan Guru Pembimbing
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAdminData = async () => {
      try {
        // Pastikan pengguna sudah login di client; jika tidak, tampilkan tombol masuk
        try {
          const { data: authData, error: authErr } = await supabase.auth.getUser();
          if (authErr || !authData?.user) {
            // Tidak ada sesi -> set flag agar UI menampilkan tombol Masuk
            setAuthMissing(true);
            return;
          }
        } catch (e) {
          setAuthMissing(true);
          return;
        }

        const selectFields = 'id, full_name, role, nis, tahsin_level, tahfidz_level, pembimbing_id, teacher_level';

        // Log auth state to ensure client is authenticated
        try {
          const authState = await supabase.auth.getUser();
          console.log('Supabase client auth state:', authState);
        } catch (authErr) {
          console.warn('Failed to get supabase auth state:', authErr);
        }

        const initialResult = await supabase.from('profiles').select(selectFields).order('created_at', { ascending: false });
        console.log('profiles initialResult:', initialResult);
        let data = initialResult.data;
        let error = initialResult.error;

        const logError = (label: string, err: unknown) => {
          console.error(label, err);
          console.error(`${label} type:`, typeof err, 'instanceof Error:', err instanceof Error);
          console.error(`${label} keys:`, err && typeof err === 'object' ? Object.getOwnPropertyNames(err) : []);
          console.error(`${label} serialized:`, (() => {
            try {
              return JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
            } catch (_err) {
              return String(err);
            }
          })());
        };

        if (error || !Array.isArray(data)) {
          logError('Supabase profiles query failed (initial attempt)', error || data);

          const fallbackResult = await supabase.from('profiles').select(selectFields);
          data = fallbackResult.data;
          error = fallbackResult.error;

          if (error || !Array.isArray(data)) {
            logError('Supabase profiles query failed on fallback selectFields', error || data);
            const fallbackAllResult = await supabase.from('profiles').select('*');
            console.log('profiles fallbackAllResult:', fallbackAllResult);
            data = fallbackAllResult.data;
            error = fallbackAllResult.error;

            if (error || !Array.isArray(data)) {
              logError('Supabase profiles query failed on fallback select *', error || data);
              throw error || new Error('Supabase profiles query returned invalid response');
            }
          }
        }

        if (!isMounted) return;

        // expose a small sample for on-page debugging and log lengths
        console.log('profiles final data length:', Array.isArray(data) ? data.length : 'not-array', 'error:', error);
        if (Array.isArray(data)) {
          setDebugSample(data.slice(0, 5));
        } else {
          setDebugSample(null);
        }
        if (!isMounted) return;

        const rawList = Array.isArray(data) ? data : [];
        const teacherMap = rawList.reduce<Record<string, string>>((map, item) => {
          const roleValue = typeof item.role === 'string' ? item.role.trim().toLowerCase() : '';
          if (roleValue === 'guru' && item.id && item.full_name) {
            map[item.id] = item.full_name;
          }
          return map;
        }, {});

        const normalizeRole = (role: unknown): UserProfile['role'] => {
          if (typeof role !== 'string') return 'siswa';
          const normalized = role.trim().toLowerCase();
          if (normalized === 'guru' || normalized === 'admin') return normalized;
          return 'siswa';
        };

        const formattedList: UserProfile[] = rawList.map((item) => {
          const normalizedRole = normalizeRole(item.role);
          return {
            id: item.id,
            full_name: item.full_name || 'Tanpa Nama',
            role: normalizedRole,
            nis: item.nis,
            tahsin_level: item.tahsin_level,
            tahfidz_level: item.tahfidz_level,
            pembimbing_id: item.pembimbing_id,
            teacher_level: item.teacher_level,
            pembimbing: item.pembimbing_id
              ? { full_name: teacherMap[item.pembimbing_id] || 'Belum ditentukan' }
              : null,
          };
        });

        setUsers(formattedList);

        // Update debug counters and timestamp for quick verification
        setDebugCounts({
          totalProfiles: formattedList.length,
          totalSiswa: formattedList.filter((u) => u.role === 'siswa').length,
          totalGuru: formattedList.filter((u) => u.role === 'guru').length,
          totalAdmin: formattedList.filter((u) => u.role === 'admin').length,
        });
        setLastUpdated(new Date().toISOString());

        const siswaList = formattedList.filter((u) => u.role === 'siswa');
        const guruList = formattedList.filter((u) => u.role === 'guru');
        const adminList = formattedList.filter((u) => u.role === 'admin');

        setStats({
          totalSiswa: siswaList.length,
          totalGuru: guruList.length,
          totalAdmin: adminList.length,
        });

        setTeachers(
          guruList.map((g) => ({
            id: g.id,
            full_name: g.full_name,
            teacher_level: g.teacher_level,
          }))
        );
      } catch (err) {
        console.error('Gagal memuat data admin:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // initial load
    fetchAdminData();

    // Realtime subscription: refresh when profiles change
    const channel = supabase
      .channel('profiles_admin_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          // small guard to avoid updating when unmounted
          if (!isMounted) return;
          // Re-fetch list on any change
          void fetchAdminData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      try {
        supabase.removeChannel(channel);
      } catch (_) {
        // ignore
      }
    };
  }, [refreshKey]);

  // Buka Modal Atur Pembimbing
  const openAssignModal = (student: UserProfile) => {
    setSelectedStudent(student);
    setSelectedTeacherId(student.pembimbing_id || '');
    setIsModalOpen(true);
  };

  // Simpan Perubahan Pembimbing ke Supabase
  const handleAssignSubmit = async () => {
    if (!selectedStudent) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ pembimbing_id: selectedTeacherId || null })
        .eq('id', selectedStudent.id);

      if (error) throw error;

      alert(`Berhasil memperbarui pembimbing untuk ${selectedStudent.full_name}`);
      setIsModalOpen(false);
      setLoading(true);
      setRefreshKey((prev) => prev + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      alert(`Gagal memperbarui pembimbing: ${msg}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Administrator</h1>
        <p className="text-sm text-slate-600">
          Kelola pengguna, penetapan pembimbing, dan pemantauan sistem secara menyeluruh.
        </p>
        <div className="mt-2 text-sm text-slate-500">
          <span className="mr-3">Profiles: <strong className="text-slate-800">{debugCounts.totalProfiles}</strong></span>
          <span className="mr-3">Santri: <strong className="text-emerald-600">{debugCounts.totalSiswa}</strong></span>
          <span className="mr-3">Guru: <strong className="text-sky-600">{debugCounts.totalGuru}</strong></span>
          <span className="mr-3">Admin: <strong className="text-indigo-600">{debugCounts.totalAdmin}</strong></span>
          <span className="ml-2 text-xs text-slate-400">{lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Not loaded yet'}</span>
        </div>
        {authMissing && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded flex items-center justify-between">
            <div className="text-sm text-yellow-800">Anda belum masuk. Silakan masuk untuk melihat data administrator.</div>
            <div>
              <button
                onClick={() => router.push(`/login?redirectTo=${pathname || '/dashboard/admin'}`)}
                className="px-3 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700"
              >
                Masuk
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cards Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Santri</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.totalSiswa}</p>
          </div>
          <span className="text-2xl">🎓</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Guru / Pengajar</p>
            <p className="text-2xl font-bold text-sky-600">{stats.totalGuru}</p>
          </div>
          <span className="text-2xl">👨‍🏫</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Administrator</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.totalAdmin}</p>
          </div>
          <span className="text-2xl">⚡</span>
        </div>
      </div>

      {/* Navigasi Fitur Admin */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/admin/users"
          className="w-full sm:w-auto bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-900 transition shadow-sm"
        >
          👥 Kelola Pengguna &amp; Peran
        </Link>
        <Link
          href="/dashboard/admin/announcements"
          className="w-full sm:w-auto bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
        >
          📢 Pengumuman
        </Link>
        <Link
          href="/dashboard/admin/reports"
          className="w-full sm:w-auto bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition shadow-sm"
        >
          📊 Laporan Rekapitulasi
        </Link>
        <Link
          href="/dashboard/admin/settings"
          className="w-full sm:w-auto bg-slate-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition shadow-sm"
        >
          ⚙️ Pengaturan Sistem
        </Link>
      </div>

      {/* Tabel Santri & Penetapan Guru Pembimbing */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <h2 className="font-semibold text-slate-700">Penetapan Pembimbing Santri</h2>
          <span className="text-xs bg-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded-full self-start sm:self-auto">
            {users.filter((u) => u.role === 'siswa').length} Santri
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data pengguna...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500 bg-slate-50 border-b">
                <tr>
                  <th className="p-4 whitespace-nowrap">Nama Santri</th>
                  <th className="p-4 whitespace-nowrap">NIS</th>
                  <th className="p-4 whitespace-nowrap">Tingkat Tahsin / Tahfidz</th>
                  <th className="p-4 whitespace-nowrap">Guru Pembimbing</th>
                  <th className="p-4 text-center whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
              {users.filter((u) => u.role === 'siswa').length > 0 ? (
                users
                  .filter((u) => u.role === 'siswa')
                  .map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-800">{student.full_name}</td>
                      <td className="p-4 text-slate-600">{student.nis || '-'}</td>
                      <td className="p-4 space-x-1">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
                          {student.tahsin_level || 'Level 1'}
                        </span>
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded text-xs font-medium">
                          {student.tahfidz_level || 'Juz 30'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700">
                        {student.pembimbing?.full_name ? (
                          <span className="font-medium text-slate-800">
                            {student.pembimbing.full_name}
                          </span>
                        ) : (
                          <span className="text-amber-600 italic text-xs">Belum ditentukan</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openAssignModal(student)}
                          className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded font-semibold transition border border-emerald-200"
                        >
                          Atur Pembimbing
                        </button>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Belum ada data santri terdaftar.
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Atur Guru Pembimbing */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-800">Atur Guru Pembimbing</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Santri</label>
                <input
                  type="text"
                  disabled
                  value={selectedStudent.full_name}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Guru Pembimbing</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Tanpa Pembimbing / Belum Ditentukan --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} {t.teacher_level ? `(Level ${t.teacher_level})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={updating}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {updating ? 'Menyimpan...' : 'Simpan Pembimbing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}