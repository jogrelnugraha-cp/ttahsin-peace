'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Material {
  id: string;
  title: string;
  description: string;
  file_url: string;
  created_at: string;
}

export default function GuruMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dynamic back link depending on role
  const [backUrl, setBackUrl] = useState('/dashboard/guru');
  const [backLabel, setBackLabel] = useState('Kembali ke Dashboard Guru');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'file' | 'video'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const [materialsResult, userResult] = await Promise.all([
        supabase.from('materials').select('*').order('created_at', { ascending: false }),
        supabase.auth.getUser(),
      ]);

      if (!materialsResult.error && materialsResult.data) {
        setMaterials(materialsResult.data as Material[]);
      }

      const user = userResult.data?.user;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'admin') {
          setBackUrl('/dashboard/admin');
          setBackLabel('Kembali ke Dashboard Admin');
        }
      }

      setLoading(false);
    };
    init();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi login telah habis.');

      let finalUrl = '';

      if (type === 'file') {
        if (!file) throw new Error('Silakan pilih file materi yang akan diunggah.');

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `docs/${fileName}`;

        const { error: storageError } = await supabase.storage
          .from('learning-materials')
          .upload(filePath, file);

        if (storageError) throw new Error(`Gagal mengunggah file: ${storageError.message}`);

        const { data: publicUrlData } = supabase.storage
          .from('learning-materials')
          .getPublicUrl(filePath);

        finalUrl = publicUrlData.publicUrl;
      } else {
        if (!videoUrl) throw new Error('Silakan masukkan URL video.');
        finalUrl = videoUrl;
      }

      // Insert data ke tabel materials
      const { error: dbError } = await supabase.from('materials').insert([
        {
          title,
          description,
          file_url: finalUrl,
          uploaded_by: user.id,
        },
      ]);

      if (dbError) throw new Error(dbError.message);

      setMessage({ type: 'success', text: 'Materi berhasil ditambahkan!' });
      setTitle('');
      setDescription('');
      setFile(null);
      setVideoUrl('');
      const { data: refreshed } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      if (refreshed) setMaterials(refreshed as Material[]);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Terjadi kesalahan' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;

    const { error } = await supabase.from('materials').delete().eq('id', id);

    if (!error) {
      const { data: refreshed } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      if (refreshed) setMaterials(refreshed as Material[]);
    } else {
      alert(`Gagal menghapus: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Navigasi */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div>
            <Link href={backUrl} className="text-sm text-emerald-600 font-medium hover:underline">
              &larr; {backLabel}
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Upload Materi Tahsin</h1>
            <p className="text-slate-500 text-sm">Bagikan dokumen PDF, gambar tajwid, atau link video penjelasan ke santri.</p>
          </div>
        </div>

        {/* Form Upload */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Tambah Materi Baru</h2>

          {message && (
            <div className={`p-4 text-sm rounded-lg border ${
              message.type === 'error'
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Judul Materi</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Hukum Nun Mati dan Tanwin - Idgham Bigunnah"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi / Catatan Singkat</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Penjelasan ringkas mengenai materi ini..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe Materi</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'file' | 'video')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="file">File Dokumen / PDF / Gambar</option>
                  <option value="video">Link Video (YouTube/Vimeo)</option>
                </select>
              </div>

              {type === 'file' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih File</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">URL Video YouTube</label>
                  <input
                    type="url"
                    required
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {uploading ? 'Mengunggah...' : '📤 Publikasikan Materi'}
            </button>
          </form>
        </div>

        {/* Daftar Materi Terunggah */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Daftar Materi Pembelajaran</h2>

          {loading ? (
            <p className="text-sm text-slate-500">Memuat materi...</p>
          ) : materials.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada materi yang diunggah.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase bg-blue-100 text-blue-700">
                        📄 Materi
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-base">{item.title}</h3>
                    {item.description && (
                      <p className="text-slate-600 text-xs mt-1">{item.description}</p>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 font-semibold hover:underline flex items-center space-x-1"
                    >
                      <span>Lihat / Buka Materi</span>
                      <span>&rarr;</span>
                    </a>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                    >
                      Hapus
                    </button>
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