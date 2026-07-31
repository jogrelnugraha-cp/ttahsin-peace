import React from 'react';
import { StudentMutabaah } from './[studentId]/page';

interface PrintTemplateProps {
  data: StudentMutabaah;
  program?: string;
}

export default function PrintTemplate({ data, program }: PrintTemplateProps) {
  const isTahfidzOnly = program?.toLowerCase() === 'tahfidz';
  const isTahsinOnly = program?.toLowerCase() === 'tahsin';

  const showTahsin = !isTahfidzOnly;
  const showTahfidz = !isTahsinOnly;

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="w-full text-slate-900 bg-white print:text-black text-xs leading-tight">
      {/* 1. KOP SURAT RINGKAS */}
      <div className="border-b-2 border-slate-900 pb-2 mb-3 text-center">
        <h1 className="text-base font-bold tracking-wider uppercase text-slate-900">
          PEACESANTREN TAHSIN & TAHFIDZ
        </h1>
        <p className="text-[10px] text-slate-600">
          Laporan Perkembangan Hafalan & Bimbingan Al-Qur'an Santri
        </p>
      </div>

      {/* 2. JUDUL LAPORAN */}
      <div className="text-center mb-3">
        <h2 className="text-sm font-bold underline uppercase tracking-wide">
          LAPORAN MUTABA'AH SANTRI
        </h2>
        {program && (
          <p className="text-[10px] font-semibold text-slate-600 uppercase">
            PROGRAM: {program}
          </p>
        )}
      </div>

      {/* 3. INFORMASI SANTRI (1 KOTAK RIGID & STRUKTURAL) */}
      <div className="border border-slate-400 rounded p-2.5 mb-3 bg-slate-50/50 print:bg-transparent">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div className="flex">
            <span className="w-24 text-slate-600">Nama Santri</span>
            <span className="font-bold">: {data.full_name}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-slate-600">Level Tahsin</span>
            <span className="font-semibold">: {data.tahsin_level}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-slate-600">NIS / ID</span>
            <span className="font-semibold">: {data.nis}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-slate-600">Level Tahfidz</span>
            <span className="font-semibold">: {data.tahfidz_level}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-slate-600">Pembimbing</span>
            <span className="font-semibold">: {data.pembimbing_name}</span>
          </div>
          <div className="flex">
            <span className="w-24 text-slate-600">Tgl Cetak</span>
            <span className="font-semibold">: {todayFormatted}</span>
          </div>
        </div>
      </div>

      {/* 4. TABEL TAHSIN */}
      {showTahsin && (
        <div className="mb-3">
          <div className="font-bold text-[11px] uppercase mb-1 flex items-center justify-between border-b border-slate-300 pb-0.5">
            <span>Catatan Tahsin</span>
            <span className="text-[10px] font-normal text-slate-500">Total: {data.setoran_tahsin.length}</span>
          </div>
          <table className="w-full text-[10px] border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 font-bold">
                <th className="border border-slate-400 py-1 px-1.5 text-center w-8">No</th>
                <th className="border border-slate-400 py-1 px-1.5 text-center w-20">Tanggal</th>
                <th className="border border-slate-400 py-1 px-1.5 text-center w-20">Materi</th>
                <th className="border border-slate-400 py-1 px-1.5 text-center w-16">Halaman</th>
                <th className="border border-slate-400 py-1 px-1.5 text-left">Catatan / Nilai</th>
              </tr>
            </thead>
            <tbody>
              {data.setoran_tahsin.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-2 text-center text-slate-400 italic">
                    Belum ada riwayat setoran Tahsin.
                  </td>
                </tr>
              ) : (
                data.setoran_tahsin.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="border border-slate-300 py-1 px-1.5 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 py-1 px-1.5 text-center">{item.tanggal}</td>
                    <td className="border border-slate-300 py-1 px-1.5 text-center font-medium">{item.Materi}</td>
                    <td className="border border-slate-300 py-1 px-1.5 text-center">{item.halaman}</td>
                    <td className="border border-slate-300 py-1 px-1.5">{item.nilai}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. TABEL TAHFIDZ */}
      {showTahfidz && (
        <div className="mb-4">
          <div className="font-bold text-[11px] uppercase mb-1 flex items-center justify-between border-b border-slate-300 pb-0.5">
            <span>Catatan Tahfidz</span>
            <span className="text-[10px] font-normal text-slate-500">Total: {data.setoran_tahfidz.length}</span>
          </div>
          <table className="w-full text-[10px] border-collapse border border-slate-400">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 font-bold">
                <th className="border border-slate-400 py-1 px-1.5 text-center w-8">No</th>
                <th className="border border-slate-400 py-1 px-1.5 text-center w-20">Tanggal</th>
                <th className="border border-slate-400 py-1 px-1.5 text-center w-28">Surah</th>
                <th className="border border-slate-400 py-1 px-1.5 text-center w-20">Ayat</th>
                <th className="border border-slate-400 py-1 px-1.5 text-left">Catatan / Nilai</th>
              </tr>
            </thead>
            <tbody>
              {data.setoran_tahfidz.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-2 text-center text-slate-400 italic">
                    Belum ada riwayat setoran Tahfidz.
                  </td>
                </tr>
              ) : (
                data.setoran_tahfidz.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="border border-slate-300 py-1 px-1.5 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 py-1 px-1.5 text-center">{item.tanggal}</td>
                    <td className="border border-slate-300 py-1 px-1.5 text-center font-medium">{item.surah}</td>
                    <td className="border border-slate-300 py-1 px-1.5 text-center">{item.ayat}</td>
                    <td className="border border-slate-300 py-1 px-1.5">{item.nilai}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. TANDA TANGAN */}
      <div className="mt-6 text-[11px] flex justify-between items-end">
        <div className="text-slate-400 italic text-[9px] max-w-[220px]">
          * Dokumen resmi dicetak dari Sistem Peacesantren.
        </div>
        <div className="text-center min-w-[180px]">
          <p className="mb-0.5">Sumedang, {todayFormatted}</p>
          <p className="font-semibold mb-12">Guru Pembimbing,</p>
          <p className="font-bold underline uppercase">{data.pembimbing_name}</p>
        </div>
      </div>
    </div>
  );
}