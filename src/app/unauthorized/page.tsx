import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
      <div className="max-w-md bg-white p-8 rounded-lg border shadow-sm space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h1 className="text-xl font-bold text-gray-800">Akses Ditolak</h1>
        <p className="text-sm text-gray-600">
          Anda tidak memiliki hak akses untuk membuka halaman ini. Silakan kembali ke halaman utama sesuai peran Anda.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-emerald-700 transition"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}