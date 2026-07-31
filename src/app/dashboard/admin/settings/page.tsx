'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminSettingsPage() {
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [appName, setAppName] = useState('Tahsin & Tahfidz');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('app_name, logo_url')
        .eq('id', 'app_config')
        .single();

      if (data) {
        if (data.logo_url) setCurrentLogoUrl(data.logo_url);
        if (data.app_name) setAppName(data.app_name);
      }
    };
    fetchSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleLogoUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setMessage(null);

    try {
      const ext = selectedFile.name.split('.').pop();
      const filePath = `logo/app-logo.${ext}`;

      // Upload to storage bucket
      const { error: storageError } = await supabase.storage
        .from('app-assets')
        .upload(filePath, selectedFile, { upsert: true });

      if (storageError) throw new Error(`Gagal upload: ${storageError.message}`);

      const { data: publicUrlData } = supabase.storage
        .from('app-assets')
        .getPublicUrl(filePath);

      const newLogoUrl = publicUrlData.publicUrl;

      // Update in settings table for id 'app_config'
      const { error: dbError } = await supabase
        .from('settings')
        .update({ logo_url: newLogoUrl, updated_at: new Date().toISOString() })
        .eq('id', 'app_config');

      if (dbError) throw new Error(`Gagal menyimpan: ${dbError.message}`);

      setCurrentLogoUrl(newLogoUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      setMessage({ type: 'success', text: 'Logo berhasil diperbarui!' });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Terjadi kesalahan' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    setSavingName(true);
    setMessage(null);

    const { error } = await supabase
      .from('settings')
      .update({ app_name: appName, updated_at: new Date().toISOString() })
      .eq('id', 'app_config');

    if (error) {
      setMessage({ type: 'error', text: `Gagal menyimpan: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Nama aplikasi berhasil disimpan!' });
    }

    setSavingName(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <Link href="/dashboard/admin" className="text-sm text-emerald-600 font-medium hover:underline">
              &larr; Kembali ke Dashboard Admin
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Pengaturan Aplikasi</h1>
            <p className="text-slate-500 text-sm">Kelola logo dan identitas visual aplikasi.</p>
          </div>
        </div>

        {/* Global Message */}
        {message && (
          <div className={`p-4 text-sm rounded-xl border ${
            message.type === 'error'
              ? 'bg-rose-50 text-rose-600 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Logo Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-5">
          <h2 className="text-lg font-bold text-slate-800">Logo Aplikasi</h2>

          {/* Current Logo */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${
              currentLogoUrl ? 'bg-transparent border border-slate-200 p-1' : 'bg-emerald-600 text-white shadow-md'
            }`}>
              {currentLogoUrl ? (
                <Image
                  src={currentLogoUrl}
                  alt="Logo Aplikasi"
                  width={64}
                  height={64}
                  className="object-contain w-full h-full"
                  unoptimized
                />
              ) : (
                <span className="text-2xl">📖</span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Logo Saat Ini</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentLogoUrl ? 'Logo kustom terpasang' : 'Menggunakan ikon default'}
              </p>
            </div>
          </div>

          {/* Upload New Logo */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Upload Logo Baru</label>
            <p className="text-xs text-slate-400">Format: PNG, JPG, SVG. Disarankan ukuran 64×64px atau lebih besar (rasio 1:1).</p>

            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    width={80}
                    height={80}
                    className="rounded-xl object-contain border border-slate-200"
                    unoptimized
                  />
                  <p className="text-xs text-slate-500">{selectedFile?.name}</p>
                  <p className="text-xs text-emerald-600 font-medium">Klik untuk ganti file</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-3xl">🖼️</p>
                  <p className="text-sm font-medium text-slate-600">Klik untuk pilih file logo</p>
                  <p className="text-xs text-slate-400">atau seret & lepas file di sini</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile && (
              <button
                onClick={handleLogoUpload}
                disabled={uploading}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg font-bold text-sm shadow-sm transition disabled:opacity-50"
              >
                {uploading ? '⏳ Mengunggah...' : '📤 Simpan Logo Baru'}
              </button>
            )}
          </div>
        </div>

        {/* App Name Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Nama Aplikasi</h2>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nama yang tampil di Navbar</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="Contoh: TTahsin Peace"
            />
          </div>
          <button
            onClick={handleSaveName}
            disabled={savingName || !appName.trim()}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition disabled:opacity-50"
          >
            {savingName ? 'Menyimpan...' : '💾 Simpan Nama'}
          </button>
          <p className="text-xs text-slate-400">
            Perubahan nama akan terlihat setelah me-refresh halaman.
          </p>
        </div>

      </div>
    </div>
  );
}