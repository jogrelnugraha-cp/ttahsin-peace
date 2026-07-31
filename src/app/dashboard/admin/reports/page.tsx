'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface StudentReport {
  id: string;
  issue_description: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  student: { full_name: string } | null;
  guru: { full_name: string } | null;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('student_reports')
        .select('*, student:student_id (full_name), guru:guru_id (full_name)')
        .order('created_at', { ascending: false });

      if (data) setReports(data as unknown as StudentReport[]);
      setLoading(false);
    };
    fetchReports();
  }, []);

  const refreshReports = async () => {
    const { data } = await supabase
      .from('student_reports')
      .select('*, student:student_id (full_name), guru:guru_id (full_name)')
      .order('created_at', { ascending: false });
    if (data) setReports(data as unknown as StudentReport[]);
  };

  const handleRespond = async (reportId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('student_reports')
      .update({
        admin_response: responseText,
        status: 'resolved',
      })
      .eq('id', reportId);

    if (!error) {
      setRespondingId(null);
      setResponseText('');
      refreshReports();
    } else {
      alert(`Gagal menyimpan respons: ${error.message}`);
    }
    setSaving(false);
  };

  const filteredReports = filterStatus === 'all'
    ? reports
    : reports.filter((r) => r.status === filterStatus);

  const openCount = reports.filter((r) => r.status === 'open').length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <Link href="/dashboard/admin" className="text-sm text-emerald-600 font-medium hover:underline">
              &larr; Kembali ke Dashboard Admin
            </Link>
            <div className="mt-1">
              <h1 className="text-2xl font-bold text-slate-800">Laporan Kendala Santri</h1>
              <p className="text-slate-500 text-sm">Tinjau dan tanggapi laporan yang dikirim oleh guru.</p>
            </div>
          </div>
          {openCount > 0 && (
            <span className="self-start sm:self-auto bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1 rounded-full">
              {openCount} Belum Ditangani
            </span>
          )}
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'open', 'resolved'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                filterStatus === status
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
              }`}
            >
              {status === 'all' ? 'Semua' : status === 'open' ? 'Belum Ditangani' : 'Selesai'}
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-500 text-center py-8">Memuat laporan...</p>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              Tidak ada laporan kendala {filterStatus !== 'all' ? `dengan status "${filterStatus}"` : ''}.
            </div>
          ) : (
            filteredReports.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">

                {/* Report Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800">{item.student?.full_name ?? '—'}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        item.status === 'open'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.status === 'open' ? 'Belum Ditangani' : 'Selesai'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Dilaporkan oleh <span className="font-semibold">{item.guru?.full_name ?? '—'}</span>
                      {' · '}
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Issue Description */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <p className="text-sm text-slate-700 whitespace-pre-line">{item.issue_description}</p>
                </div>

                {/* Admin Response */}
                {item.admin_response && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Respons Admin:</p>
                    <p className="text-sm text-emerald-800">{item.admin_response}</p>
                  </div>
                )}

                {/* Respond Form */}
                {respondingId === item.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      placeholder="Tulis respons atau tindak lanjut untuk laporan ini..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() => handleRespond(item.id)}
                        disabled={saving || !responseText.trim()}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition"
                      >
                        {saving ? 'Menyimpan...' : '✓ Simpan & Tandai Selesai'}
                      </button>
                      <button
                        onClick={() => { setRespondingId(null); setResponseText(''); }}
                        className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  item.status === 'open' && (
                    <button
                      onClick={() => {
                        setRespondingId(item.id);
                        setResponseText(item.admin_response ?? '');
                      }}
                      className="text-sm text-emerald-600 font-semibold hover:underline"
                    >
                      ↩ Tanggapi Laporan
                    </button>
                  )
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
