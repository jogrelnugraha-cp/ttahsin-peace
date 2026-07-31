'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Student {
  id: string;
  full_name: string;
  tahsin_level?: string;
  tahfidz_level?: string;
}

export default function AdminMutabaahPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, tahsin_level, tahfidz_level')
        .eq('role', 'siswa')
        .order('full_name', { ascending: true });

      if (!error && data) {
        setStudents(data as Student[]);
        if (data.length > 0) setStudentId(data[0].id);
      }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const handlePrint = (program: 'tahsin' | 'tahfidz') => {
    if (!studentId) {
      alert('Silakan pilih santri terlebih dahulu.');
      return;
    }
    window.open(`/dashboard/admin/mutabaah/${program}?studentId=${studentId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Navigation Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <Link href="/dashboard/admin" className="text-sm text-emerald-600 font-medium hover:underline">
              &larr; Kembali ke Dashboard Admin
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Cetak Mutaba&apos;ah</h1>
            <p className="text-slate-500 text-sm">Cetak laporan riwayat perkembangan akademik Tahsin atau Tahfidz santri secara terpisah.</p>
          </div>
        </div>

        {/* Selection Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
          {loading ? (
            <p className="text-sm text-slate-500 text-center py-4">Memuat data santri...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Tidak ada data santri ditemukan.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Santri / Siswa</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} {student.tahsin_level ? `(Tahsin: ${student.tahsin_level})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={() => handlePrint('tahsin')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold text-sm shadow-md shadow-emerald-100 transition flex items-center justify-center space-x-2"
                >
                  <span>📄</span>
                  <span>Cetak Mutaba&apos;ah Tahsin</span>
                </button>

                <button
                  onClick={() => handlePrint('tahfidz')}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-lg font-bold text-sm shadow-md shadow-sky-100 transition flex items-center justify-center space-x-2"
                >
                  <span>📖</span>
                  <span>Cetak Mutaba&apos;ah Tahfidz</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
