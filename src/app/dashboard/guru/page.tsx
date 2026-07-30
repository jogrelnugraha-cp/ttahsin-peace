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

interface TeacherOption {
  id: string;
  full_name: string;
  teacher_level: number;
}

export default function GuruDashboardPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [teacherLevel, setTeacherLevel] = useState<number>(1);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // State Modal Kenaikan Tingkat
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [program, setProgram] = useState<'Tahsin' | 'Tahfidz'>('Tahsin');
  const [targetLevel, setTargetLevel] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedApprover, setSelectedApprover] = useState<string>('');
  const [availableApprovers, setAvailableApprovers] = useState<TeacherOption[]>([]);
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
        setCurrentUserId(user.id);

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
  const openModal = async (student: StudentProfile) => {
    setEditingStudent(student);
    setTargetLevel('');
    setNotes('');
    setSelectedApprover('');

    // Fetch higher-level teachers based on current teacher level
    const nextLevel = teacherLevel + 1;
    const { data: higherLevelTeachers, error } = await supabase
      .from('profiles')
      .select('id, full_name, teacher_level')
      .eq('role', 'guru')
      .eq('teacher_level', nextLevel)
      .order('full_name');

    if (!error && higherLevelTeachers) {
      setAvailableApprovers(higherLevelTeachers as TeacherOption[]);
      if (higherLevelTeachers.length > 0) {
        setSelectedApprover(higherLevelTeachers[0].id);
      }
    } else {
      setAvailableApprovers([]);
      console.warn('Gagal memuat guru tingkat atasnya');
    }

    setIsModalOpen(true);
  };

  // Fungsi Kirim Pengajuan Kenaikan Level
  const handlePromotionSubmit = async () => {
    if (!editingStudent || !targetLevel.trim()) {
      alert('Harap isi target level baru.');
      return;
    }

    if (!selectedApprover) {
      alert('Harap pilih guru penyetuju terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitPromotionRequest({
        student_id: editingStudent.id,
        teacher_id: selectedApprover,
        type: program.toLowerCase() as 'tahsin' | 'tahfidz',
        target_level: targetLevel,
        notes: notes,
        current_level: program === 'Tahsin'
          ? editingStudent.tahsin_level || editingStudent.current_level || ''
          : editingStudent.tahfidz_level || editingStudent.current_level || '',
      });

      if (!result.success) {
        throw new Error(result.error || 'Gagal mengirim pengajuan');
      }

      alert(`Pengajuan kenaikan tingkat untuk ${editingStudent.full_name} berhasil dikirim ke guru penyetuju!`);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      alert(`Gagal mengajukan kenaikan tingkat: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Menu Cepat</h2>
              <div className="space-y-3">
                <Link
                  href="/dashboard/guru/presensi"
                  className="block w-full text-left bg-emerald-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                >
                  Kelola Presensi
                </Link>
                <Link
                  href="/dashboard/guru/setoran"
                  className="block w-full text-left bg-sky-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-sky-700 transition"
                >
                  Catatan Tahsin & Tahfidz
                </Link>
                <Link
                  href="/dashboard/guru/materials"
                  className="block w-full text-left bg-teal-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-teal-700 transition"
                >
                  Upload Materi
                </Link>
                <Link
                  href="/dashboard/guru/promotions"
                  className="block w-full text-left bg-amber-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
                >
                  Persetujuan Kenaikan
                </Link>
                <Link
                  href="/dashboard/guru/reports"
                  className="block w-full text-left bg-rose-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-rose-700 transition"
                >
                  Laporan Kendala
                </Link>
                <Link
                  href="/dashboard/guru/mutabaah"
                  className="block w-full text-left bg-violet-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-violet-700 transition"
                >
                  Cetak Mutaba&apos;ah
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Info Guru</h2>
              <p className="text-sm text-slate-600">Level Guru: <span className="font-semibold text-slate-800">{teacherLevel}</span></p>
              <p className="text-sm text-slate-600 mt-2">
                {teacherLevel >= 3 ? 'Supervisor Level 3: lihat semua siswa.' : 'Kelola perkembangan siswa bimbingan Anda.'}
              </p>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Dashboard Guru</h1>
              <p className="text-sm text-slate-600">
                {teacherLevel >= 3
                  ? 'Menampilkan seluruh siswa (Supervisor Level 3)'
                  : 'Kelola perkembangan dan presensi siswa bimbingan Anda.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:hidden">
            <Link
              href="/dashboard/guru/presensi"
              className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
            >
              Kelola Presensi
            </Link>
            <Link
              href="/dashboard/guru/setoran"
              className="bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-sky-700 transition shadow-sm"
            >
              Catatan Tahsin & Tahfidz
            </Link>
            <Link
              href="/dashboard/guru/materials"
              className="bg-teal-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition shadow-sm"
            >
              Upload Materi
            </Link>
            <Link
              href="/dashboard/guru/promotions"
              className="bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition shadow-sm"
            >
              Persetujuan Kenaikan
            </Link>
            <Link
              href="/dashboard/guru/reports"
              className="bg-rose-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-rose-700 transition shadow-sm"
            >
              Laporan Kendala
            </Link>
            <Link
              href="/dashboard/guru/mutabaah"
              className="bg-violet-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 transition shadow-sm"
            >
              📄 Cetak Mutaba&apos;ah
            </Link>
          </div>

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
                        <td className="p-4 text-center">
                          <div className="flex flex-wrap justify-center gap-2">
                            <button
                              onClick={() => openModal(student)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
                            >
                              Ajukan Kenaikan Tingkat
                            </button>
                          </div>
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
        </div>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Guru Penyetuju</label>
                {availableApprovers.length === 0 ? (
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-600">
                    Tidak ada guru tingkat {teacherLevel + 1} tersedia
                  </div>
                ) : (
                  <select
                    value={selectedApprover}
                    onChange={(e) => setSelectedApprover(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Pilih Guru Penyetuju --</option>
                    {availableApprovers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name} (Level {teacher.teacher_level})
                      </option>
                    ))}
                  </select>
                )}
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