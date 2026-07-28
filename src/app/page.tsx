import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      
      {/* Navigation Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-200 transition-transform group-hover:scale-105">
              TP
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
              TTahsin Peace
            </span>
          </div>

          <div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-100 transition-all"
            >
              Masuk Aplikasi
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 lg:py-32">
          {/* Decorative Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none opacity-40">
            <div className="absolute top-[-20%] left-[20%] w-[400px] h-[400px] rounded-full bg-emerald-300 blur-[120px]"></div>
            <div className="absolute top-[10%] right-[20%] w-[350px] h-[350px] rounded-full bg-teal-300 blur-[100px]"></div>
          </div>

          <div className="max-w-5xl mx-auto px-4 md:px-6 relative text-center space-y-8">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold">
              ✨ Sistem Manajemen Tahsin & Tahfidz Realtime
            </span>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Belajar Al-Qur'an Lebih <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Terpantau & Terstruktur
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg text-slate-500 leading-relaxed">
              TTahsin Peace menghubungkan Ustadz/Ustadzah, Santri, dan Wali Santri dalam satu wadah digital. Pantau perkembangan bacaan, setoran hafalan, dan presensi secara realtime.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-bold bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200 transition-all"
              >
                Mulai Sekarang &rarr;
              </Link>
              <Link
                href="#fitur"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all"
              >
                Pelajari Fitur
              </Link>
            </div>

            {/* Quick Stats Grid */}
            <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { label: 'Otomatis & Realtime', val: '100%' },
                { label: 'Akses Dimana Saja', val: '24/7' },
                { label: 'Role Pengguna', val: '3 Peran' },
                { label: 'Biaya Layanan', val: 'Gratis' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-2xl font-bold text-emerald-600">{stat.val}</div>
                  <div className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="fitur" className="py-20 bg-white border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-slate-900">Kemudahan Untuk Semua Peran</h2>
              <p className="text-slate-500 max-w-xl mx-auto text-sm">
                Dirancang khusus untuk mendukung ekosistem pembelajaran Al-Qur'an secara interaktif dan transparan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Admin Card */}
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl mb-6 shadow-sm">
                  🔑
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Administrator
                </h3>
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  Kelola database guru dan santri dengan mudah. Verifikasi pengajuan kenaikan tingkat dan kirim pengumuman penting secara instan.
                </p>
              </div>

              {/* Guru Card */}
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-6 shadow-sm">
                  📝
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Guru / Pengajar
                </h3>
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  Catat kehadiran santri secara digital, input pencapaian akademik harian (Tahsin & Tahfidz), serta unggah video dan file materi pembelajaran.
                </p>
              </div>

              {/* Siswa Card */}
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-6 shadow-sm">
                  📈
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Santri / Wali
                </h3>
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  Pantau langsung riwayat presensi harian, grafik perkembangan jilid/juz hafalan, serta dapatkan siaran pengumuman lembaga secara realtime.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
              TP
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              TTahsin Peace
            </span>
          </div>

          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} TTahsin Peace. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
