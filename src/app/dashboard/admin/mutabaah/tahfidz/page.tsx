'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Student {
  full_name: string;
  tahfidz_level?: string;
}

interface DailyRecord {
  id: string;
  date: string;
  attendance: string;
  tahfidz_material: string;
  grade: string;
  notes: string;
}

function TahfidzPrintComponent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');

  const [student, setStudent] = useState<Student | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const fetchData = async () => {
      setLoading(true);

      const { data: studentData } = await supabase
        .from('profiles')
        .select('full_name, tahfidz_level')
        .eq('id', studentId)
        .single();

      if (studentData) {
        setStudent(studentData as Student);
      }

      const { data: recordData } = await supabase
        .from('daily_records')
        .select('id, date, attendance, tahfidz_material, grade, notes')
        .eq('student_id', studentId)
        .in('program', ['Tahfidz', 'Keduanya'])
        .order('date', { ascending: true });

      if (recordData) {
        setRecords(recordData as DailyRecord[]);
      }

      setLoading(false);
    };
    fetchData();
  }, [studentId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Membuat dokumen mutaba&apos;ah...</div>;
  }

  if (!student) {
    return <div className="p-8 text-center text-rose-600">Data santri tidak ditemukan.</div>;
  }

  return (
    <div className="min-h-screen bg-white p-8 font-serif text-slate-900 leading-normal selection:bg-slate-200">
      
      {/* Print Control Button (hidden during print) */}
      <div className="no-print mb-6 flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
        <span className="text-sm text-slate-600 font-medium">Dokumen siap dicetak. Gunakan tombol di samping atau Ctrl+P.</span>
        <button
          onClick={handlePrint}
          className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition"
        >
          🖨️ Cetak Sekarang
        </button>
      </div>

      {/* Document Header */}
      <div className="text-center space-y-2 border-b-2 border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold tracking-wide uppercase">MUTABA&apos;AH AKADEMIK TAHFIDZ</h1>
        <h2 className="text-lg font-bold text-slate-700">Lembaga Pembelajaran Al-Qur&apos;an TTahsin Peace</h2>
        <p className="text-xs text-slate-400">Dokumen Laporan Riwayat Perkembangan Belajar Santri</p>
      </div>

      {/* Student Meta Info */}
      <div className="my-6 grid grid-cols-2 gap-4 text-sm border border-slate-300 p-4 rounded-lg bg-slate-50/50">
        <div>
          <span className="font-semibold text-slate-500">Nama Lengkap:</span>
          <p className="font-bold text-slate-800 text-base">{student.full_name}</p>
        </div>
        <div>
          <span className="font-semibold text-slate-500">Tingkat Tahfidz Saat Ini:</span>
          <p className="font-bold text-sky-800 text-base">{student.tahfidz_level || 'Juz 30'}</p>
        </div>
      </div>

      {/* Table Records */}
      <div className="overflow-x-auto my-6">
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
              <th className="border border-slate-300 p-2.5 w-24">Tanggal</th>
              <th className="border border-slate-300 p-2.5 w-20">Kehadiran</th>
              <th className="border border-slate-300 p-2.5">Materi Tahfidz (Hafalan)</th>
              <th className="border border-slate-300 p-2.5 w-20 text-center">Predikat</th>
              <th className="border border-slate-300 p-2.5">Catatan Pengajar</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-slate-300 p-6 text-center text-slate-400 italic">
                  Belum ada riwayat perkembangan belajar Tahfidz untuk santri ini.
                </td>
              </tr>
            ) : (
              records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="border border-slate-300 p-2.5">
                    {new Date(rec.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="border border-slate-300 p-2.5 capitalize font-medium">
                    {rec.attendance}
                  </td>
                  <td className="border border-slate-300 p-2.5 font-bold text-slate-800">
                    {rec.tahfidz_material || '-'}
                  </td>
                  <td className="border border-slate-300 p-2.5 text-center font-bold text-sky-800">
                    {rec.grade || '-'}
                  </td>
                  <td className="border border-slate-300 p-2.5 text-slate-600">
                    {rec.notes || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Signature Block */}
      <div className="mt-16 flex justify-between items-center text-sm">
        <div className="text-center w-48">
          <p>Orang Tua / Wali Santri</p>
          <div className="h-20"></div>
          <p className="border-t border-slate-400 pt-1 font-bold">( ................................ )</p>
        </div>

        <div className="text-center w-48">
          <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
          <p className="font-semibold">Administrator</p>
          <div className="h-20"></div>
          <p className="border-t border-slate-400 pt-1 font-bold">TTahsin Peace</p>
        </div>
      </div>

      {/* Print Specific CSS Style */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}

export default function AdminTahfidzPrintPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat halaman...</div>}>
      <TahfidzPrintComponent />
    </Suspense>
  );
}
