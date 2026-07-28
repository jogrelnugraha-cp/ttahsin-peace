'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboardPage() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    totalSiswa: 0,
    totalGuru: 0,
    pendingPromotions: 0,
    openReports: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Cek User Authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email || '');

      // 2. Ambil Seluruh Profil untuk Penghitungan Akurat
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, role');

      const totalSiswa = allProfiles
        ? allProfiles.filter((p) => p.role?.toLowerCase() === 'siswa' || p.role?.toLowerCase() === 'santri').length
        : 0;

      const totalGuru = allProfiles
        ? allProfiles.filter((p) => p.role?.toLowerCase() === 'guru').length
        : 0;

      // 3. Ambil Pengajuan Kenaikan Tingkat Status Pending
      const { count: countPending } = await supabase
        .from('level_promotions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // 4. Ambil Laporan Kendala Status Open
      const { count: countReports } = await supabase
        .from('student_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      setStats({
        totalSiswa,
        totalGuru,
        pendingPromotions: countPending || 0,
        openReports: countReports || 0,
      });

      setLoading(false);
    };

    fetchDashboardData();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Dashboard */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
            Modul Administrator
          </span>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">
            Dashboard Utama
          </h1>
          <p className="text-slate-500 text-sm">
            Akun Aktif: <span className="font-semibold text-slate-700">{userEmail}</span>
          </p>
        </div>

        {/* Ringkasan Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Siswa
            </p>
            <p className="text-3xl font-bold text-slate-800 mt-2">
              {loading ? '...' : stats.totalSiswa}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Guru
            </p>
            <p className="text-3xl font-bold text-slate-800 mt-2">
              {loading ? '...' : stats.totalGuru}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Perlu Persetujuan
            </p>
            <p className="text-3xl font-bold text-amber-600 mt-2">
              {loading ? '...' : stats.pendingPromotions}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
              Laporan Kendala
            </p>
            <p className="text-3xl font-bold text-rose-600 mt-2">
              {loading ? '...' : stats.openReports}
            </p>
          </div>
        </div>

        {/* Menu Navigasi Utama Admin */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Menu Manajemen</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/dashboard/admin/approvals"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group"
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-4">
                ✅
              </div>
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-600 transition">
                Persetujuan & Verifikasi
              </h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                ACC pengajuan kenaikan tingkat santri (Tahsin/Tahfidz) dari guru.
              </p>
              {stats.pendingPromotions > 0 && (
                <span className="inline-block mt-3 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded">
                  {stats.pendingPromotions} Perlu Tindakan
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/admin/users"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-4">
                👥
              </div>
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition">
                Manajemen Pengguna
              </h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Kelola data akun Guru, Santri, dan Wali Santri. Tambah atau hapus akun.
              </p>
            </Link>

            <Link
              href="/dashboard/guru/materials"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group"
            >
              <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xl mb-4">
                📚
              </div>
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-purple-600 transition">
                Materi Pembelajaran
              </h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Lihat dan kelola berkas PDF atau tautan video materi Tahsin/Tahfidz.
              </p>
            </Link>

            <Link
              href="/dashboard/admin/announcements"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group"
            >
              <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xl mb-4">
                📢
              </div>
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-amber-600 transition">
                Broadcast Pengumuman
              </h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Kirim pengumuman penting secara realtime ke semua santri dan pengajar.
              </p>
            </Link>

            <Link
              href="/dashboard/admin/mutabaah"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group"
            >
              <div className="w-12 h-12 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xl mb-4">
                🖨️
              </div>
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-teal-600 transition">
                Cetak Mutaba&apos;ah
              </h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Cetak laporan perkembangan akademik Tahsin atau Tahfidz santri secara terpisah.
              </p>
            </Link>

            <Link
              href="/dashboard/admin/reports"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group"
            >
              <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xl mb-4">
                ⚠️
              </div>
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-rose-600 transition">
                Laporan Kendala
              </h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Tinjau dan tanggapi laporan isu santri yang dikirim oleh guru.
              </p>
              {stats.openReports > 0 && (
                <span className="inline-block mt-3 px-2 py-0.5 bg-rose-100 text-rose-800 text-xs font-semibold rounded">
                  {stats.openReports} Perlu Ditangani
                </span>
              )}
            </Link>

            <Link
              href="/dashboard/admin/settings"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group"
            >
              <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-4">
                ⚙️
              </div>
              <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition">
                Pengaturan Aplikasi
              </h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Kelola logo dan identitas visual aplikasi yang tampil di Navbar.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}