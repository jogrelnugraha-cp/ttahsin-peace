'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Student {
  id: string;
  full_name: string;
  tahsin_level: string;
  tahfidz_level: string;
}

interface PromotionRequest {
  id: string;
  program: 'Tahsin' | 'Tahfidz';
  current_level: string;
  target_level: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  student: { full_name: string };
}

export default function GuruPromotionsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [studentId, setStudentId] = useState('');
  const [program, setProgram] = useState<'Tahsin' | 'Tahfidz'>('Tahsin');
  const [targetLevel, setTargetLevel] = useState('');
  const [notes, setNotes] = useState('');

  const reloadData = async () => {
    setLoading(true);

    const { data: studentData } = await supabase
      .from('profiles')
      .select('id, full_name, tahsin_level, tahfidz_level')
      .eq('role', 'siswa')
      .order('full_name', { ascending: true });

    if (studentData) {
      setStudents(studentData as Student[]);
      if (studentData.length > 0 && !studentId) setStudentId(studentData[0].id);
    }

    const { data: reqData } = await supabase
      .from('level_promotions')
      .select('*, student:student_id (full_name)')
      .order('created_at', { ascending: false });

    if (reqData) {
      setRequests(reqData as unknown as PromotionRequest[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);

      const { data: studentData } = await supabase
        .from('profiles')
        .select('id, full_name, tahsin_level, tahfidz_level')
        .eq('role', 'siswa')
        .order('full_name', { ascending: true });

      if (studentData) {
        setStudents(studentData as Student[]);
        if (studentData.length > 0) setStudentId(studentData[0].id);
      }

      const { data: reqData } = await supabase
        .from('level_promotions')
        .select('*, student:student_id (full_name)')
        .order('created_at', { ascending: false });

      if (reqData) {
        setRequests(reqData as unknown as PromotionRequest[]);
      }

      setLoading(false);
    };
    initData();
  }, []);

  const selectedStudent = students.find((s) => s.id === studentId);
  const currentLevel = selectedStudent
    ? program === 'Tahsin'
      ? selectedStudent.tahsin_level || 'Jilid 1'
      : selectedStudent.tahfidz_level || 'Juz 30'
    : '-';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setMessage({ type: 'error', text: 'Sesi login telah habis.' });
      setSubmitting(false);
      return;
    }

    if (!targetLevel) {
      setMessage({ type: 'error', text: 'Target tingkat baru wajib diisi.' });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('level_promotions').insert([
      {
        student_id: studentId,
        guru_id: user.id,
        category: program,
        current_level: currentLevel,
        target_level: targetLevel,
        status: 'pending',
      },
    ]);

    if (error) {
      setMessage({ type: 'error', text: `Gagal mengajukan: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Pengajuan kenaikan tingkat berhasil dikirim ke Admin!' });
      setTargetLevel('');
      setNotes('');
      reloadData();
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigasi Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div>
            <Link href="/dashboard/guru" className="text-sm text-emerald-600 font-medium hover:underline">
              &larr; Kembali ke Dashboard Guru
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Pengajuan Kenaikan Tingkat</h1>
            <p className="text-slate-500 text-sm">Adukan rekomendasi kenaikan jilid Tahsin atau juz Tahfidz ke Admin.</p>
          </div>
        </div>

        {/* Form Pengajuan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Form Pengajuan Baru</h2>

          {message && (
            <div className={`p-4 text-sm rounded-lg border ${
              message.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Santri</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Program</label>
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
                  value={currentLevel}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Tingkat Baru</label>
                <input
                  type="text"
                  required
                  placeholder={program === 'Tahsin' ? 'Contoh: Jilid 2 / Al-Qur\'an' : 'Contoh: Juz 29'}
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan Rekomendasi Guru</label>
              <textarea
                rows={2}
                placeholder="Contoh: Bacaan tajwid makhraj huruf sudah mumpuni untuk naik ke Jilid berikutnya."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Mengirim...' : '🚀 Kirim Pengajuan'}
            </button>
          </form>
        </div>

        {/* Riwayat Pengajuan */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Riwayat Pengajuan Anda</h2>

          {loading ? (
            <p className="text-sm text-slate-500">Memuat riwayat...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada pengajuan.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((item) => (
                <div key={item.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">{item.student?.full_name}</span>
                      <span className="text-xs text-slate-400">({item.program})</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {item.current_level} &rarr; <span className="font-semibold text-emerald-700">{item.target_level}</span>
                    </p>
                    {item.admin_notes && (
                      <p className="text-xs text-rose-600 mt-1">Catatan Admin: {item.admin_notes}</p>
                    )}
                  </div>
                  <div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                      item.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : item.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}