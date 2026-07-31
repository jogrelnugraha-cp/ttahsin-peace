'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Student {
  id: string;
  full_name: string;
}

interface StudentReport {
  id: string;
  issue_description: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  student: { full_name: string } | null;
}

export default function GuruStudentReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [studentId, setStudentId] = useState('');
  const [issueType, setIssueType] = useState('Kehadiran');
  const [issueDetail, setIssueDetail] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: studentData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'siswa')
        .eq('pembimbing_id', user.id)
        .order('full_name', { ascending: true });

      if (studentData) {
        setStudents(studentData);
        if (studentData.length > 0) setStudentId(studentData[0].id);
      }

      const studentIds = (studentData || []).map((item) => item.id);
      const { data: reportData } = studentIds.length > 0
        ? await supabase
            .from('student_reports')
            .select('*, student:student_id (full_name)')
            .in('student_id', studentIds)
            .order('created_at', { ascending: false })
        : { data: [] };

      if (reportData) {
        setReports(reportData as unknown as StudentReport[]);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const refreshReports = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: studentData } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'siswa')
      .eq('pembimbing_id', user.id);

    const studentIds = (studentData || []).map((item) => item.id);

    if (studentIds.length === 0) {
      setStudents([]);
      setReports([]);
      return;
    }

    const { data: studentsList } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'siswa')
      .eq('pembimbing_id', user.id)
      .order('full_name', { ascending: true });

    if (studentsList) {
      setStudents(studentsList as Student[]);
      if (studentsList.length > 0) setStudentId(studentsList[0].id);
    }

    const { data } = await supabase
      .from('student_reports')
      .select('*, student:student_id (full_name)')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });
    if (data) setReports(data as unknown as StudentReport[]);
  };

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

    // Gabungkan kategori dan detail menjadi issue_description
    const issueDescription = `[${issueType}] ${issueDetail}`;

    const { error } = await supabase.from('student_reports').insert([
      {
        student_id: studentId,
        guru_id: user.id,
        issue_description: issueDescription,
        status: 'open',
      },
    ]);

    if (error) {
      setMessage({ type: 'error', text: `Gagal mengirim laporan: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Laporan kendala santri berhasil dikirim!' });
      setIssueDetail('');
      refreshReports();
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Navigasi Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <Link href="/dashboard/guru" className="text-sm text-emerald-600 font-medium hover:underline">
              &larr; Kembali ke Dashboard Guru
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Laporan Kendala Santri</h1>
            <p className="text-slate-500 text-sm">Laporkan isu kedisiplinan, absensi berturut-turut, atau hambatan santri.</p>
          </div>
        </div>

        {/* Form Laporan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Buat Laporan Baru</h2>

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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori Kendala</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Kehadiran">Kehadiran (Absen/Alpa)</option>
                  <option value="Kedisiplinan">Kedisiplinan &amp; Adab</option>
                  <option value="Capaian Hafalan">Hambatan Hafalan/Murojaah</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Detail Kendala</label>
              <textarea
                required
                rows={3}
                placeholder="Jelaskan detail kendala santri yang perlu ditindaklanjuti..."
                value={issueDetail}
                onChange={(e) => setIssueDetail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !studentId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Mengirim Laporan...' : '⚠️ Kirim Laporan Kendala'}
            </button>
          </form>
        </div>

        {/* Riwayat Laporan */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Riwayat Laporan Kendala</h2>

          {loading ? (
            <p className="text-sm text-slate-500">Memuat data...</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada laporan kendala.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((item) => (
                <div key={item.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">{item.student?.full_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        item.status === 'open'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{item.issue_description}</p>
                  {item.admin_response && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-1">Respons Admin:</p>
                      <p className="text-sm text-emerald-800">{item.admin_response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}