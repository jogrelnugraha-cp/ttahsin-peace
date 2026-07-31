'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface PromotionRequest {
  id: string;
  student_id: string;
  category: 'Tahsin' | 'Tahfidz';
  current_level: string;
  target_level: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  student?: { full_name: string } | null;
  guru?: { full_name: string } | null;
}

interface StudentReport {
  id: string;
  issue_description: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  student?: { full_name: string } | null;
  guru?: { full_name: string } | null;
}

export default function AdminApprovalsPage() {
  const [promotions, setPromotions] = useState<PromotionRequest[]>([]);
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const reloadData = async () => {
    setLoading(true);

    const { data: promoData } = await supabase
      .from('level_promotions')
      .select('*, student:student_id(full_name), guru:guru_id(full_name)')
      .order('created_at', { ascending: false });

    if (promoData) setPromotions(promoData as unknown as PromotionRequest[]);

    const { data: reportData } = await supabase
      .from('student_reports')
      .select('*, student:student_id(full_name), guru:guru_id(full_name)')
      .order('created_at', { ascending: false });

    if (reportData) setReports(reportData as unknown as StudentReport[]);

    setLoading(false);
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);

      const { data: promoData } = await supabase
        .from('level_promotions')
        .select('*, student:student_id(full_name), guru:guru_id(full_name)')
        .order('created_at', { ascending: false });

      if (promoData) setPromotions(promoData as unknown as PromotionRequest[]);

      const { data: reportData } = await supabase
        .from('student_reports')
        .select('*, student:student_id(full_name), guru:guru_id(full_name)')
        .order('created_at', { ascending: false });

      if (reportData) setReports(reportData as unknown as StudentReport[]);

      setLoading(false);
    };
    initData();
  }, []);

  // Handler Approve / Reject Kenaikan Tingkat
  const handlePromotionAction = async (promo: PromotionRequest, status: 'approved' | 'rejected') => {
    setActionLoading(promo.id);

    try {
      if (status === 'approved') {
        // 1. Update level santri di tabel profiles
        const updatePayload = promo.category === 'Tahsin'
          ? { tahsin_level: promo.target_level }
          : { tahfidz_level: promo.target_level };

        const { error: profileError } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', promo.student_id);

        if (profileError) throw profileError;
      }

      // 2. Update status di tabel level_promotions
      const { error: promoError } = await supabase
        .from('level_promotions')
        .update({ status })
        .eq('id', promo.id);

      if (promoError) throw promoError;

      alert(`Pengajuan berhasil di-${status === 'approved' ? 'setujui' : 'tolak'}!`);
      reloadData();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Gagal memproses: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Handler Laporan Kendala Status Selesai
  const handleReportResolve = async (reportId: string) => {
    setActionLoading(reportId);
    const { error } = await supabase
      .from('student_reports')
      .update({ status: 'resolved' })
      .eq('id', reportId);

    if (error) {
      alert(`Gagal memperbarui status: ${error.message}`);
    } else {
      reloadData();
    }
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Navigasi */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <Link href="/dashboard/admin" className="text-sm text-emerald-600 font-medium hover:underline">
              &larr; Kembali ke Dashboard Admin
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Verifikasi & Persetujuan Guru</h1>
            <p className="text-slate-500 text-sm">Kelola persetujuan kenaikan tingkat santri dan tindak lanjuti laporan kendala.</p>
          </div>
        </div>

        {/* Section 1: Persetujuan Kenaikan Tingkat */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">1. Pengajuan Kenaikan Tingkat Santri</h2>

          {loading ? (
            <p className="text-sm text-slate-500">Memuat pengajuan...</p>
          ) : promotions.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada pengajuan kenaikan tingkat.</p>
          ) : (
            <div className="space-y-3">
              {promotions.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">{item.student?.full_name || 'Santri'}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Tingkat: <span className="font-medium text-slate-500">{item.current_level}</span> &rarr; <span className="font-bold text-emerald-700">{item.target_level}</span>
                    </p>
                    <p className="text-xs text-slate-400">Diajukan oleh: {item.guru?.full_name || 'Guru'}</p>
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:justify-end md:w-auto">
                    {item.status === 'pending' ? (
                      <>
                        <button
                          disabled={actionLoading === item.id}
                          onClick={() => handlePromotionAction(item, 'approved')}
                          className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50"
                        >
                          ✓ Setujui
                        </button>
                        <button
                          disabled={actionLoading === item.id}
                          onClick={() => handlePromotionAction(item, 'rejected')}
                          className="w-full sm:w-auto px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                        >
                          ✕ Tolak
                        </button>
                      </>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        item.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Laporan Kendala Santri */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">2. Laporan Kendala dari Guru</h2>

          {loading ? (
            <p className="text-sm text-slate-500">Memuat laporan...</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada laporan kendala.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">{item.student?.full_name || 'Santri'}</span>
                    </div>
                    <p className="text-xs text-slate-600">{item.issue_description}</p>
                    <p className="text-xs text-slate-400">Dilaporkan oleh: {item.guru?.full_name || 'Guru'}</p>
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:justify-end md:w-auto">
                    {item.status === 'open' ? (
                      <button
                        disabled={actionLoading === item.id}
                        onClick={() => handleReportResolve(item.id)}
                        className="w-full sm:w-auto px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50"
                      >
                        ✓ Tandai Selesai
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-slate-200 text-slate-700">
                        {item.status}
                      </span>
                    )}
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