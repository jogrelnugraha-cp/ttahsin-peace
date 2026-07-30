'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnnouncements(data as Announcement[]);
    } else if (error) {
      console.error('Gagal mengambil pengumuman:', error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    const loadAnnouncements = async () => {
      await fetchAnnouncements();
    };

    void loadAnnouncements();

    // Setup Realtime Subscription to auto-refresh the announcements list
    const channel = supabase
      .channel('announcements_admin_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          void fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg('Pengguna tidak terautentikasi.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('announcements').insert([
      {
        title,
        content,
        created_by: user.id,
      },
    ]);

    if (error) {
      setErrorMsg(`Gagal membuat pengumuman: ${error.message}`);
    } else {
      setTitle('');
      setContent('');
      fetchAnnouncements();
    }
    setSubmitting(false);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;

    const { error } = await supabase.from('announcements').delete().eq('id', id);

    if (error) {
      alert(`Gagal menghapus: ${error.message}`);
    } else {
      fetchAnnouncements();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link href="/dashboard/admin" className="text-sm text-emerald-600 font-medium hover:underline">
              &larr; Kembali ke Dashboard Admin
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Broadcast Pengumuman</h1>
            <p className="text-slate-500 text-sm">Kirim pengumuman penting secara realtime ke semua pengguna.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form Create Announcement */}
          <div className="md:col-span-1 bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4 h-fit">
            <h3 className="text-base font-bold text-slate-800">Buat Pengumuman Baru</h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Libur Hari Raya"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Isi Pengumuman</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tulis detail pengumuman di sini..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>📢</span>
                <span>{submitting ? 'Mengirim...' : 'Kirim Pengumuman'}</span>
              </button>
            </form>
          </div>

          {/* List of Announcements */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-800">Riwayat Pengumuman</h3>

            {loading ? (
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-center text-slate-500 text-sm">
                Memuat riwayat pengumuman...
              </div>
            ) : announcements.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-center text-slate-500 text-sm">
                Belum ada pengumuman yang dikirim.
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm relative group hover:border-emerald-200 transition-all"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(ann.created_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                        <h4 className="font-bold text-slate-800 text-base mt-1">{ann.title}</h4>
                      </div>

                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Hapus Pengumuman"
                      >
                        🗑️
                      </button>
                    </div>

                    <p className="text-slate-600 text-sm mt-3 whitespace-pre-line leading-relaxed">
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
