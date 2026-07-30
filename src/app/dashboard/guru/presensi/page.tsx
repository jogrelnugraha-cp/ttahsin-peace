'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { submitBulkPresensi, PresensiItem } from './action';

interface Student {
  id: string;
  full_name: string;
  nis?: string;
}

export default function PresensiKelasPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form State
  const [pertemuanKe, setPertemuanKe] = useState<number>(1);
  const [tanggal, setTanggal] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: 'hadir' | 'izin' | 'sakit' | 'alfa'; catatan: string }>
  >({});

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Ambil data santri bimbingan guru ini
        const { data: list } = await supabase
          .from('profiles')
          .select('id, full_name, nis')
          .eq('role', 'siswa')
          .eq('pembimbing_id', user.id)
          .order('full_name', { ascending: true });

        const studentList = list || [];
        setStudents(studentList);

        // Set default status semua santri menjadi 'hadir'
        const initialMap: Record<string, { status: 'hadir' | 'izin' | 'sakit' | 'alfa'; catatan: string }> = {};
        studentList.forEach((st) => {
          initialMap[st.id] = { status: 'hadir', catatan: '' };
        });
        setAttendanceMap(initialMap);
      } catch (err) {
        console.error('Gagal memuat santri:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Handler Ubah Status Per Santri
  const handleStatusChange = (studentId: string, status: 'hadir' | 'izin' | 'sakit' | 'alfa') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  // Handler Ubah Catatan
  const handleCatatanChange = (studentId: string, catatan: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], catatan },
    }));
  };

  // Submit Presensi
  const handleSubmit = async () => {
    if (students.length === 0) {
      alert('Tidak ada santri untuk diabsen.');
      return;
    }

    setSaving(true);
    try {
      const records: PresensiItem[] = students.map((st) => ({
        student_id: st.id,
        status: attendanceMap[st.id]?.status || 'hadir',
        catatan: attendanceMap[st.id]?.catatan || '',
      }));

      await submitBulkPresensi(pertemuanKe, tanggal, records);
      alert(`Presensi Pertemuan Ke-${pertemuanKe} berhasil disimpan!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      alert(`Gagal menyimpan: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Presensi Kelas Santri</h1>
        <p className="text-sm text-slate-600">Pilih status kehadiran santri untuk pertemuan kelas hari ini.</p>
      </div>

      {/* Form Informasi Pertemuan */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Pertemuan Ke-</label>
          <input
            type="number"
            min={1}
            value={pertemuanKe}
            onChange={(e) => setPertemuanKe(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Pertemuan</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabel Absensi Santri */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat daftar santri...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">Nama Santri</th>
                <th className="p-4 text-center">Status Kehadiran</th>
                <th className="p-4">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length > 0 ? (
                students.map((student) => {
                  const currentStatus = attendanceMap[student.id]?.status || 'hadir';
                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-800">
                        {student.full_name}
                        {student.nis && <span className="block text-xs text-slate-400">NIS: {student.nis}</span>}
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex rounded-md shadow-sm gap-1" role="group">
                          {(['hadir', 'izin', 'sakit', 'alfa'] as const).map((st) => {
                            const activeColors = {
                              hadir: 'bg-emerald-600 text-white',
                              izin: 'bg-amber-500 text-white',
                              sakit: 'bg-blue-500 text-white',
                              alfa: 'bg-rose-600 text-white',
                            };
                            const isSelected = currentStatus === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(student.id, st)}
                                className={`px-3 py-1.5 text-xs font-semibold uppercase rounded transition ${
                                  isSelected
                                    ? activeColors[st]
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          placeholder="Contoh: Sakit demam / Izin keluarga"
                          value={attendanceMap[student.id]?.catatan || ''}
                          onChange={(e) => handleCatatanChange(student.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">
                    Belum ada santri bimbingan untuk di-absen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Tombol Simpan Presensi */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={saving || students.length === 0}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition shadow-md disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan Presensi Pertemuan'}
        </button>
      </div>
    </div>
  );
}