'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  status: 'hadir' | 'izin' | 'sakit' | 'alpha';
}

interface SubmissionRecord {
  id: string;
  submission_type: 'tahsin' | 'tahfidz';
  surah_or_juz: string;
  page_or_verse: string;
  notes: string;
  created_at: string;
}

interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface MaterialRecord {
  id: string;
  title: string;
  description: string;
  file_url: string;
  created_at: string;
}

interface ProfileRecord {
  id: string;
  full_name: string;
  tahsin_level?: string;
  tahfidz_level?: string;
  teacher?: { full_name: string } | null;
}

export default function SiswaDashboardPage() {
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [materials, setMaterials] = useState<MaterialRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setAnnouncements(data as AnnouncementRecord[]);
      }
    };

    const fetchSiswaData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 1. Ambil Profil (dengan fallback jika kolom teacher_id belum ada)
        let profileData = null;
        const { data: joinedData, error: joinErr } = await supabase
          .from('profiles')
          .select('*, teacher:teacher_id(full_name)')
          .eq('id', user.id)
          .single();

        if (!joinErr && joinedData) {
          profileData = joinedData;
        } else {
          const { data: fallbackData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          profileData = fallbackData;
        }

        // 2. Ambil Riwayat Presensi
        const { data: attendanceData } = await supabase
          .from('attendances')
          .select('*')
          .eq('student_id', user.id)
          .order('attendance_date', { ascending: false });

        // 3. Ambil Riwayat Setoran Hafalan/Tahsin
        const { data: submissionData } = await supabase
          .from('submissions')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false });

        if (profileData) setProfile(profileData as ProfileRecord);
        if (attendanceData) setAttendances(attendanceData);
        if (submissionData) setSubmissions(submissionData);

        // 4. Ambil Materi Pembelajaran
        const { data: materialsData } = await supabase
          .from('materials')
          .select('*')
          .order('created_at', { ascending: false });

        if (materialsData) setMaterials(materialsData as MaterialRecord[]);
      }

      setLoading(false);
    };

    fetchSiswaData();
    fetchAnnouncements();

    // Subscribe to announcements realtime updates
    const channel = supabase
      .channel('announcements_realtime_siswa')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = {
    hadir: attendances.filter((a) => a.status === 'hadir').length,
    izin: attendances.filter((a) => a.status === 'izin').length,
    sakit: attendances.filter((a) => a.status === 'sakit').length,
    alpha: attendances.filter((a) => a.status === 'alpha').length,
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat data...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Profile */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Assalamu&apos;alaikum, {
              profile?.full_name
                ? profile.full_name.includes('@')
                  ? profile.full_name.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                  : profile.full_name
                : 'Santri'
            }
          </h1>
          <p className="text-slate-500 text-sm">
            Pantau perkembangan hafalan, materi, dan kehadiran Anda di sini.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile?.teacher?.full_name && (
            <div className="bg-purple-50 border border-purple-200 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
              👳‍♂️ Pembimbing: {profile.teacher.full_name}
            </div>
          )}
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
            Tahsin: {profile?.tahsin_level || 'Belum diatur'}
          </div>
          <div className="bg-sky-50 border border-sky-200 text-sky-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
            Tahfidz: {profile?.tahfidz_level || 'Belum diatur'}
          </div>
        </div>
      </div>

      {/* Main Grid: Left content, Right announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ringkasan Kehadiran */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3">Ringkasan Kehadiran</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-center">
                <p className="text-xs text-emerald-600 font-semibold uppercase">Hadir</p>
                <p className="text-2xl font-bold text-emerald-700">{stats.hadir}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center">
                <p className="text-xs text-amber-600 font-semibold uppercase">Izin</p>
                <p className="text-2xl font-bold text-amber-700">{stats.izin}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                <p className="text-xs text-blue-600 font-semibold uppercase">Sakit</p>
                <p className="text-2xl font-bold text-blue-700">{stats.sakit}</p>
              </div>
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg text-center">
                <p className="text-xs text-rose-600 font-semibold uppercase">Alpha</p>
                <p className="text-2xl font-bold text-rose-700">{stats.alpha}</p>
              </div>
            </div>
          </div>

          {/* Tabel Riwayat Setoran Hafalan */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b">
              <h2 className="font-semibold text-slate-700">Riwayat Setoran (Tahsin & Tahfidz)</h2>
            </div>
            {submissions.length === 0 ? (
              <p className="p-6 text-center text-slate-400 text-sm">
                Belum ada riwayat setoran yang dicatat.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs uppercase text-slate-500 bg-slate-50 border-b">
                    <tr>
                      <th className="p-4">Tanggal</th>
                      <th className="p-4">Jenis</th>
                      <th className="p-4">Surah/Juz/Jilid</th>
                      <th className="p-4">Ayat/Halaman</th>
                      <th className="p-4">Catatan Guru</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="p-4 text-xs text-slate-500">
                          {new Date(sub.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                              sub.submission_type === 'tahfidz'
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {sub.submission_type}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-800">{sub.surah_or_juz}</td>
                        <td className="p-4 text-slate-600">{sub.page_or_verse || '-'}</td>
                        <td className="p-4 text-slate-500 text-sm">{sub.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Materi Pembelajaran */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b">
              <h2 className="font-semibold text-slate-700">📚 Materi Pembelajaran</h2>
            </div>
            {materials.length === 0 ? (
              <p className="p-6 text-center text-slate-400 text-sm">
                Belum ada materi yang diunggah oleh guru.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {materials.map((mat) => (
                  <div key={mat.id} className="p-4 flex justify-between items-start gap-4 hover:bg-slate-50 transition">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{mat.title}</p>
                      {mat.description && (
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{mat.description}</p>
                      )}
                      <p className="text-slate-400 text-[10px] mt-1">
                        {new Date(mat.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <a
                      href={mat.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      Buka →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Broadcast Announcements */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">📢 Pengumuman Realtime</h2>
          
          {announcements.length === 0 ? (
            <div className="bg-white p-5 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
              Belum ada pengumuman terbaru.
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative hover:border-emerald-300 transition-all duration-300"
                >
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {new Date(ann.created_at).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                  <h3 className="font-bold text-emerald-800 text-base mt-1">{ann.title}</h3>
                  <p className="text-slate-600 text-sm mt-2 whitespace-pre-line leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}