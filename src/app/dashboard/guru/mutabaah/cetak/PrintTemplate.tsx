import React from 'react';

interface TahsinRecord {
  id: string;
  jilid: string;
  halaman: number;
  nilai: string;
  tanggal: string;
}

interface TahfidzRecord {
  id: string;
  surah: string;
  ayat: string;
  nilai: string;
  tanggal: string;
}

interface StudentMutabaah {
  id: string;
  full_name: string;
  nis: string;
  tahsin_level: string;
  tahfidz_level: string;
  pembimbing_name: string;
  setoran_tahsin: TahsinRecord[];
  setoran_tahfidz: TahfidzRecord[];
}

type Props = {
  data: StudentMutabaah;
  program?: string | undefined;
};

export default function PrintTemplate({ data, program }: Props) {
  const showTahsin = !program || program.toLowerCase() === 'tahsin'.toLowerCase();
  const showTahfidz = !program || program.toLowerCase() === 'tahfidz'.toLowerCase();

  return (
    <>
      <div className="print-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Madrasah / Lembaga Nama</h2>
            <p className="text-xs">Alamat singkat • Telepon • Website</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Laporan Mutaba&apos;ah</p>
            <p className="text-xs">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        </div>
      </div>

      <div className="print-content">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wider">Laporan Mutaba&apos;ah Santri</h1>
          <p className="text-sm font-medium text-slate-700">Program Pembelajaran Tahsin &amp; Tahfidz Al-Qur&apos;an</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6 border p-4 rounded border-slate-300">
        <div>
          <p>
            <span className="font-semibold">Nama Santri:</span> {data.full_name}
          </p>
          <p>
            <span className="font-semibold">NIS:</span> {data.nis}
          </p>
          <p>
            <span className="font-semibold">Guru Pembimbing:</span> {data.pembimbing_name}
          </p>
        </div>
        <div>
          <p>
            <span className="font-semibold">Tingkat Tahsin:</span> {data.tahsin_level}
          </p>
          <p>
            <span className="font-semibold">Tingkat Tahfidz:</span> {data.tahfidz_level}
          </p>
          <p>
            <span className="font-semibold">Tanggal Cetak:</span> {new Date().toLocaleDateString('id-ID')}
          </p>
        </div>
      </div>

      {showTahsin && (
        <div className="mb-8">
          <h2 className="text-base font-bold mb-2 uppercase border-b border-black pb-1">1. Riwayat Progress Tahsin</h2>
          <table className="w-full border-collapse border border-slate-400 text-sm">
            <thead>
              <tr className="bg-slate-100 print:bg-gray-200">
                <th className="border border-slate-400 p-2 text-left">Tanggal</th>
                <th className="border border-slate-400 p-2 text-left">Jilid</th>
                <th className="border border-slate-400 p-2 text-center">Halaman</th>
                <th className="border border-slate-400 p-2 text-center">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {data.setoran_tahsin && data.setoran_tahsin.length > 0 ? (
                data.setoran_tahsin.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-slate-400 p-2">{item.tanggal}</td>
                    <td className="border border-slate-400 p-2">{item.jilid}</td>
                    <td className="border border-slate-400 p-2 text-center">{item.halaman}</td>
                    <td className="border border-slate-400 p-2 text-center font-semibold">{item.nilai}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="border border-slate-400 p-3 text-center text-slate-500 italic">Belum ada catatan setoran Tahsin.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showTahfidz && (
        <div className="mb-8">
          <h2 className="text-base font-bold mb-2 uppercase border-b border-black pb-1">2. Riwayat Progress Tahfidz</h2>
          <table className="w-full border-collapse border border-slate-400 text-sm">
            <thead>
              <tr className="bg-slate-100 print:bg-gray-200">
                <th className="border border-slate-400 p-2 text-left">Tanggal</th>
                <th className="border border-slate-400 p-2 text-left">Surah</th>
                <th className="border border-slate-400 p-2 text-center">Ayat</th>
                <th className="border border-slate-400 p-2 text-center">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {data.setoran_tahfidz && data.setoran_tahfidz.length > 0 ? (
                data.setoran_tahfidz.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-slate-400 p-2">{item.tanggal}</td>
                    <td className="border border-slate-400 p-2">{item.surah}</td>
                    <td className="border border-slate-400 p-2 text-center">{item.ayat}</td>
                    <td className="border border-slate-400 p-2 text-center font-semibold">{item.nilai}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="border border-slate-400 p-3 text-center text-slate-500 italic">Belum ada catatan setoran Tahfidz.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-12 flex justify-end text-sm print:block">
        <div className="text-center w-48">
          <p>Guru Pembimbing,</p>
          <div className="h-20"></div>
          <p className="font-bold underline">{data.pembimbing_name}</p>
        </div>
      </div>
      </div>
    </>
  );
}
