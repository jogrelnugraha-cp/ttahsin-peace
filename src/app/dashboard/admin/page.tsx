'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalGuru: 0,
    totalAdmin: 0,
  });

  // Modal State untuk Penetapan Guru Pembimbing
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAdminData = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            role,
            nis,
            tahsin_level,
            tahfidz_level,
            pembimbing_id,
            teacher_level,
            pembimbing:pembimbing_id(full_name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!isMounted) return;

        const rawList = data || [];
        const formattedList: UserProfile[] = rawList.map((item) => {
          const pembimbingData = item.pembimbing as unknown as { full_name: string } | null;
          return {
            id: item.id,
            full_name: item.full_name || 'Tanpa Nama',
            role: item.role || 'siswa',
            nis: item.nis,
            tahsin_level: item.tahsin_level,
            tahfidz_level: item.tahfidz_level,
            pembimbing_id: item.pembimbing_id,
            teacher_level: item.teacher_level,
            pembimbing: pembimbingData,
          };
        });

        setUsers(formattedList);

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

    fetchAdminData();

    return () => {
      isMounted = false;
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
          className="bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-900 transition shadow-sm"
        >
          👥 Kelola Pengguna &amp; Peran
        </Link>
        <Link
          href="/dashboard/admin/announcements"
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
        >
          📢 Pengumuman
        </Link>
        <Link
          href="/dashboard/admin/reports"
          className="bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition shadow-sm"
        >
          📊 Laporan Rekapitulasi
        </Link>
        <Link
          href="/dashboard/admin/settings"
          className="bg-slate-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition shadow-sm"
        >
          ⚙️ Pengaturan Sistem
        </Link>
      </div>

      {/* Tabel Santri & Penetapan Guru Pembimbing */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h2 className="font-semibold text-slate-700">Penetapan Pembimbing Santri</h2>
          <span className="text-xs bg-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded-full">
            {users.filter((u) => u.role === 'siswa').length} Santri
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data pengguna...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500 bg-slate-50 border-b">
              <tr>
                <th className="p-4">Nama Santri</th>
                <th className="p-4">NIS</th>
                <th className="p-4">Tingkat Tahsin / Tahfidz</th>
                <th className="p-4">Guru Pembimbing</th>
                <th className="p-4 text-center">Aksi</th>
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
                          {student.tahsin_level || 'Jilid 1'}
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