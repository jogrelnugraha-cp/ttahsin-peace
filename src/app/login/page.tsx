'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Autentikasi dengan Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // 2. Ambil data role dari tabel public.profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        // 3. Alihkan halaman sesuai dengan Role akun
        const role = profile?.role;
        if (role === 'guru') {
          router.push('/dashboard/guru');
        } else if (role === 'siswa') {
          router.push('/dashboard/siswa');
        } else {
          router.push('/dashboard/admin');
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Detail Error Login:', error);

      // Terjemahkan pesan error bawaan Supabase
      if (error.message.includes('Invalid login credentials')) {
        setErrorMessage('Email atau kata sandi salah. Silakan periksa kembali.');
      } else {
        setErrorMessage(error.message || 'Gagal masuk. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
        {/* Header Logo & Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xl shadow-md shadow-emerald-200">
            TP
          </div>
          <h1 className="text-2xl font-bold text-slate-800">TTahsin Peace</h1>
          <p className="mt-1 text-sm text-slate-500">
            Masukkan email dan kata sandi untuk masuk
          </p>
        </div>

        {/* Notifikasi Error */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100"
              placeholder="admin@peace.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-100"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow-md shadow-emerald-100 transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Memproses...
              </span>
            ) : (
              'Masuk Aplikasi'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} TTahsin Peace. All rights reserved.
        </div>
      </div>
    </div>
  );
}