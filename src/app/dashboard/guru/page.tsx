'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { submitPromotionRequest } from './promotions/action';

interface StudentProfile {
  id: string;
  full_name: string;
  nis?: string;
  current_level?: string;
  tahsin_level?: string;
  tahfidz_level?: string;
  pembimbing_id?: string;
}

export default function GuruDashboardPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [teacherLevel, setTeacherLevel] = useState<number>(1);

  // State Modal Kenaikan Tingkat
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [program, setProgram] = useState<'Tahsin' | 'Tahfidz'>('Tahsin');
  const [targetLevel, setTargetLevel] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // 1. Ambil Session User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 2. Ambil Profil Guru (Level Guru)
        const { data: teacherProfile } = await supabase
          .from('profiles')
          .select('teacher_level')
          .eq('id', user.id)
          .single();

        const currentLvl = teacherProfile?.teacher_level || 1;
        setTeacherLevel(currentLvl);

        // 3. Query Santri (Filter berdasarkan pembimbing_id jika < Level 3)
        let query = supabase.from('profiles').select('*').eq('role', 'siswa');

        if (currentLvl < 3) {
          query = query.eq('pembimbing_id', user.id);
        }

        const { data: studentList, error } = await query.order('full_name', { ascending: true });

        if (error) throw error;
        setStudents(studentList || []);
      } catch (err) {
        console.error('Gagal memuat data santri:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Fungsi Buka Modal
  const openModal = (student: StudentProfile) => {
    setEditingStudent(student);
    setTargetLevel('');
    setNotes('');
    setIsModalOpen(true);
  };

  // Fungsi Kirim Pengajuan Kenaikan Level
  const handlePromotionSubmit = async () => {
    if (!editingStudent || !targetLevel.trim()) {
      alert('Harap isi target level baru.');
      return;
    }

    setSubmitting(true);
    try {
      await submitPromotionRequest(editingStudent.id, targetLevel, `${program}: ${notes}`);
      alert(`Pengajuan kenaikan tingkat untuk ${editingStudent.full_name} berhasil dikirim!`);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      alert(`Gagal mengajukan kenaikan tingkat: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Guru / Pengajar</h1>
          <p className="text-sm text-slate-600">
            {teacherLevel >= 3
              ? 'Menampilkan seluruh santri (Akses Supervisor Level 3)'
              : 'Kelola perkembangan & presensi santri bimbingan Anda.'}
          </p>
        </div>
      </div>

      {/* Area Tombol Navigasi Cepat */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/guru/presensi"
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
        >
          + Kelola Presensi Santri
        </Link>
        <Link
          href="/dashboard/guru/setoran"
          className="bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition shadow-sm"
        >
          + Catat Setoran Hafalan
        </Link>
        <Link
          href="/dashboard/guru/promotions"
          className="bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition shadow-sm"
        >
          🚀 Persetujuan Kenaikan Tingkat
        </Link>
        <Link
          href="/dashboard/guru/reports"
          className="bg-rose-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-rose-700 transition shadow-sm"
        >
          ⚠️ Laporan Kendala
        </Link>
      </div>

      {/* Tabel Data Santri */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h2 className="font-semibold text-slate-700">Daftar Santri Bimbingan</h2>
          <span className="text-xs bg-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded-full">
            Total: {students.length} Santri
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data santri...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500 bg-slate-50 border-b">
              <tr>
                <th className="p-4">Nama Santri</th>
                <th className="p-4">NIS</th>
                <th className="p-4">Tingkat Tahsin</th>
                <th className="p-4">Tingkat Tahfidz</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">{student.full_name || 'Tanpa Nama'}</td>
                    <td className="p-4 text-slate-600">{student.nis || '-'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
                        {student.tahsin_level || student.current_level || 'Jilid 1'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-sky-100 text-sky-800 rounded text-xs font-medium">
                        {student.tahfidz_level || 'Juz 30'}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-3">
                      <Link
                        href={`/dashboard/guru/santri/${student.id}`}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        Detail
                      </Link>
                      <button
                        onClick={() => openModal(student)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
                      >
                        Ajukan Kenaikan
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Belum ada santri yang ditugaskan ke bimbingan Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Pop-up Ajukan Kenaikan Tingkat */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-800">Ajukan Kenaikan Tingkat</h2>
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
                  value={editingStudent?.full_name || ''}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-700 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Program</label>
                  <select
                    value={program}
                    onChange={(e) => setProgram(e.target.value as 'Tahsin' | 'Tahfidz')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Tahsin">Tahsin</option>
                    <option value="Tahfidz">Tahfidz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tingkat Saat Ini</label>
                  <input
                    type="text"
                    disabled
                    value={
                      program === 'Tahsin'
                        ? editingStudent?.tahsin_level || 'Jilid 1'
                        : editingStudent?.tahfidz_level || 'Juz 30'
                    }
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-700 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Tingkat Baru</label>
                <input
                  type="text"
                  required
                  placeholder={program === 'Tahsin' ? 'Contoh: Jilid 2' : 'Contoh: Juz 29'}
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan Guru</label>
                <textarea
                  rows={3}
                  placeholder="Catatan rekomendasi/keterangan pengajuan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
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
                onClick={handlePromotionSubmit}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}