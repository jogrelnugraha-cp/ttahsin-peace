'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Student {
  id: string;
  full_name: string;
  tahsin_level?: string;
  tahfidz_level?: string;
}

type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpa';
type ProgramOption = 'Tahsin' | 'Tahfidz' | 'Keduanya';

interface DailyRecord {
  id: string;
  date: string;
  attendance: AttendanceStatus;
  program: ProgramOption;
  tahsin_material: string;
  tahfidz_material: string;
  grade: string;
  notes: string;
  student: {
    full_name: string;
  };
}

export default function GuruDailyRecordsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [studentId, setStudentId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<AttendanceStatus>('hadir');
  const [program, setProgram] = useState<ProgramOption>('Tahsin');
  const [tahsinMaterial, setTahsinMaterial] = useState('');
  const [tahfidzMaterial, setTahfidzMaterial] = useState('');
  const [grade, setGrade] = useState('Lancar');
  const [notes, setNotes] = useState('');

  const fetchRecords = useCallback(async (teacherId?: string) => {
    if (!teacherId) {
      setRecords([]);
      return;
    }

    const { data: studentData } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'siswa')
      .eq('pembimbing_id', teacherId);

    const studentIds = (studentData || []).map((item) => item.id);

    if (studentIds.length === 0) {
      setStudents([]);
      setRecords([]);
      return;
    }

    const { data: studentList } = await supabase
      .from('profiles')
      .select('id, full_name, tahsin_level, tahfidz_level')
      .eq('role', 'siswa')
      .eq('pembimbing_id', teacherId)
      .order('full_name', { ascending: true });

    if (studentList) {
      setStudents(studentList as Student[]);
      if (studentList.length > 0) setStudentId(studentList[0].id);
    }

    const { data: recordData } = await supabase
      .from('daily_records')
      .select(`
        *,
        student:student_id (full_name)
      `)
      .in('student_id', studentIds)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    if (recordData) {
      setRecords(recordData as DailyRecord[]);
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      await fetchRecords(user.id);
      setLoading(false);
    };

    fetchInitialData();
  }, [fetchRecords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage({ type: 'error', text: 'Sesi login Anda telah habis' });
      setSubmitting(false);
      return;
    }

    if (!studentId) {
      setMessage({ type: 'error', text: 'Pilih santri terlebih dahulu' });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('daily_records').insert([
      {
        student_id: studentId,
        teacher_id: user.id,
        date,
        attendance,
        program,
        tahsin_material: program === 'Tahfidz' ? null : tahsinMaterial,
        tahfidz_material: program === 'Tahsin' ? null : tahfidzMaterial,
        grade,
        notes,
      },
    ]);

    if (error) {
      setMessage({ type: 'error', text: `Gagal menyimpan: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Catatan harian berhasil disimpan!' });
      // Reset form materi & catatan
      setTahsinMaterial('');
      setTahfidzMaterial('');
      setNotes('');
      if (user) {
        fetchRecords(user.id);
      }
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) return;

    const { error } = await supabase.from('daily_records').delete().eq('id', id);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        fetchRecords(user.id);
      }
    } else {
      alert(`Gagal menghapus: ${error.message}`);
    }
  };

  const selectedStudentInfo = students.find((s) => s.id === studentId);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Header Navigasi */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <Link href="/dashboard/guru" className="text-sm text-emerald-600 font-medium hover:underline">
              &larr; Kembali ke Dashboard Guru
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Absensi &amp; Capaian Harian</h1>
            <p className="text-slate-500 text-sm">Input kehadiran dan perkembangan mutabaah Tahsin/Tahfidz santri.</p>
          </div>
        </div>

        {/* Form Input Capaian */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Form Setoran Harian</h2>

          {message && (
            <div className={`p-4 text-sm rounded-lg border ${
              message.type === 'error'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Pilih Santri */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Santri</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
                {selectedStudentInfo && (
                  <p className="text-xs text-slate-400 mt-1">
                    Tingkat Saat Ini: Tahsin ({selectedStudentInfo.tahsin_level || 'Jilid 1'}) | Tahfidz ({selectedStudentInfo.tahfidz_level || 'Juz 30'})
                  </p>
                )}
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Pertemuan</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Kehadiran */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status Kehadiran</label>
                <select
                  value={attendance}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAttendance(e.target.value as AttendanceStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="hadir">Hadir</option>
                  <option value="izin">Izin</option>
                  <option value="sakit">Sakit</option>
                  <option value="alpa">Alpa</option>
                </select>
              </div>

              {/* Program */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Program Setoran</label>
                <select
                  value={program}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProgram(e.target.value as ProgramOption)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Tahsin">Tahsin</option>
                  <option value="Tahfidz">Tahfidz</option>
                  <option value="Keduanya">Keduanya (Tahsin & Tahfidz)</option>
                </select>
              </div>

            </div>

            {/* Input Materi (Conditional) */}
            {attendance === 'hadir' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                
                {(program === 'Tahsin' || program === 'Keduanya') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Materi Tahsin</label>
                    <input
                      type="text"
                      placeholder="Contoh: Jilid 2 Halaman 15"
                      value={tahsinMaterial}
                      onChange={(e) => setTahsinMaterial(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {(program === 'Tahfidz' || program === 'Keduanya') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Materi Tahfidz</label>
                    <input
                      type="text"
                      placeholder="Contoh: QS. An-Naba: 1-15"
                      value={tahfidzMaterial}
                      onChange={(e) => setTahfidzMaterial(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Penilaian / Kualitas Read</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Sangat Lancar (A)">Sangat Lancar (A)</option>
                    <option value="Lancar (B)">Lancar (B)</option>
                    <option value="Perlu Murojaah (C)">Perlu Murojaah (C)</option>
                    <option value="Mengulang (D)">Mengulang (D)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan Evaluasi Guru</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tajwid mad thabi'i perlu diperhatikan"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : '💾 Simpan Catatan Harian'}
            </button>
          </form>
        </div>

        {/* Riwayat Setoran Terakhir */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-base">Riwayat Setoran Terbaru</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-500 text-sm">Memuat data...</div>
          ) : records.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">Belum ada catatan setoran harian.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100 text-slate-700 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Santri</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Program / Materi</th>
                    <th className="px-4 py-3">Nilai</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                        {new Date(rec.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{rec.student?.full_name || '-'}</td>
                      <td className="px-4 py-3 capitalize">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          rec.attendance === 'hadir' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rec.attendance}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs space-y-0.5">
                        <span className="font-semibold text-slate-700">[{rec.program}]</span>
                        {rec.tahsin_material && <div>Tahsin: {rec.tahsin_material}</div>}
                        {rec.tahfidz_material && <div>Tahfidz: {rec.tahfidz_material}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-emerald-700">{rec.grade || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}