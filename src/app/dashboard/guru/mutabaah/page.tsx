'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Student {
  id: string;
  full_name: string;
  tahsin_level?: string;
  tahfidz_level?: string;
}

export default function GuruMutabaahPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStudents([]);
          setLoading(false);
          return;
        }

        const { data: teacherProfile, error: teacherError } = await supabase
          .from('profiles')
          .select('teacher_level')
          .eq('id', user.id)
          .single();

        if (teacherError) {
          throw teacherError;
        }

        const currentLvl = teacherProfile?.teacher_level || 1;

        let query = supabase
          .from('profiles')
          .select('id, full_name, tahsin_level, tahfidz_level')
          .eq('role', 'siswa');

        if (currentLvl < 3) {
          query = query.eq('pembimbing_id', user.id);
        }

        const { data, error } = await query.order('full_name', { ascending: true });
        if (error) {
          throw error;
        }

        if (data) {
          setStudents(data as Student[]);
          if (data.length > 0) setStudentId(data[0].id);
        }
      } catch (err) {
        console.error('Gagal memuat data siswa untuk mutabaah:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handlePrint = (program: 'Tahsin' | 'Tahfidz') => {
    if (!studentId) {
      alert('Silakan pilih siswa terlebih dahulu.');
      return;
    }

    const fallbackUrl = `/dashboard/guru/mutabaah/cetak?studentId=${encodeURIComponent(studentId)}&program=${encodeURIComponent(program)}`;
    window.open(fallbackUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <Link href="/dashboard/guru" className="text-sm text-emerald-600 font-medium hover:underline">
            &larr; Kembali ke Dashboard Guru
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-4">Cetak Mutaba&apos;ah</h1>
          <p className="text-slate-500 text-sm">Cetak laporan riwayat perkembangan akademik Tahsin atau Tahfidz siswa bimbingan Anda.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          {loading ? (
            <p className="text-sm text-slate-500 text-center py-4">Memuat data siswa...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Tidak ada siswa yang dapat dicetak mutaba&apos;ah-nya.</p>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Siswa</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} {student.tahsin_level ? `(Tahsin: ${student.tahsin_level})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handlePrint('Tahsin')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-semibold text-sm transition"
                >
                  📄 Cetak Mutaba&apos;ah Tahsin
                </button>
                <button
                  onClick={() => handlePrint('Tahfidz')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl font-semibold text-sm transition border border-slate-200"
                >
                  📖 Cetak Mutaba&apos;ah Tahfidz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
