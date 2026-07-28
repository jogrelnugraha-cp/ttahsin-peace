'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface StudentRecord {
  id: string;
  full_name: string;
  tahsin_level?: string;
  tahfidz_level?: string;
}

export default function GuruDashboardPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Modal Update
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [program, setProgram] = useState<'Tahsin' | 'Tahfidz'>('Tahsin');
  const [targetLevel, setTargetLevel] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, tahsin_level, tahfidz_level')
        .eq('role', 'siswa');
      
      if (data) setStudents(data as StudentRecord[]);
      setLoading(false);
    };

    fetchStudents();
  }, []);

  const openModal = (student: StudentRecord) => {
    setEditingStudent(student);
    setProgram('Tahsin');
    setTargetLevel('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handlePromotionSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Sesi login telah habis.');
      return;
    }

    if (!editingStudent) return;

    if (!targetLevel.trim()) {
      alert('Target tingkat baru wajib diisi.');
      return;
    }

    const currentLevel = program === 'Tahsin'
      ? editingStudent.tahsin_level || 'Jilid 1'
      : editingStudent.tahfidz_level || 'Juz 30';

    const { error } = await supabase.from('level_promotions').insert([
      {
        student_id: editingStudent.id,
        guru_id: user.id,
        category: program,
        current_level: currentLevel,
        target_level: targetLevel,
        status: 'pending',
      },
    ]);

    if (error) {
      alert('Gagal mengajukan: ' + error.message);
    } else {
      alert('Pengajuan kenaikan tingkat berhasil dikirim ke Admin!');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Guru / Pengajar</h1>
        <p className="text-slate-600">Kelola perkembangan Tahsin & Tahfidz santri.</p>
      </div>

      {/* Area Tombol Navigasi */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link 
          href="/dashboard/guru/presensi" 
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition shadow-sm"
        >
          + Kelola Presensi Santri
        </Link>
        <Link 
          href="/dashboard/guru/setoran" 
          className="bg-sky-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-sky-700 transition shadow-sm"
        >
          + Catat Setoran Hafalan
        </Link>
        <Link 
          href="/dashboard/guru/promotions" 
          className="bg-amber-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition shadow-sm"
        >
          🚀 Kenaikan Tingkat
        </Link>
        <Link 
          href="/dashboard/guru/reports" 
          className="bg-rose-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-rose-700 transition shadow-sm"
        >
          ⚠️ Laporan Kendala
        </Link>
        <Link 
          href="/dashboard/guru/materials" 
          className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition shadow-sm"
        >
          📚 Materi Pembelajaran
        </Link>
      </div>

      {/* Tabel Data Santri */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <h2 className="font-semibold text-slate-700">Daftar Santri</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-xs uppercase text-slate-500 bg-slate-50 border-b">
              <tr>
                <th className="p-4">Nama Santri</th>
                <th className="p-4">Tingkat Tahsin</th>
                <th className="p-4">Tingkat Tahfidz</th>
                <th className="p-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{student.full_name}</td>
                  <td className="p-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">{student.tahsin_level || '-'}</span></td>
                  <td className="p-4"><span className="px-2 py-1 bg-sky-100 text-sky-700 rounded text-xs">{student.tahfidz_level || '-'}</span></td>
                  <td className="p-4">
                    <button onClick={() => openModal(student)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline">
                      Ajukan Kenaikan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Ajukan Kenaikan Tingkat */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-800">Ajukan Kenaikan Tingkat</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Santri</label>
                <input
                  type="text"
                  disabled
                  value={editingStudent?.full_name || ''}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-600 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Program</label>
                  <select
                    value={program}
                    onChange={(e) => setProgram(e.target.value as 'Tahsin' | 'Tahfidz')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-600 cursor-not-allowed"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan Guru</label>
                <textarea
                  rows={3}
                  placeholder="Catatan rekomendasi/keterangan pengajuan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
              <button onClick={handlePromotionSubmit} className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">Kirim Pengajuan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}