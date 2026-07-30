'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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

export default function CetakMutabaahPage({ params }: { params: { studentId: string } }) {
  const [data, setData] = useState<StudentMutabaah | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchMutabaahData() {
      setLoading(true);
      try {
        const { data: student, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            nis,
            tahsin_level,
            tahfidz_level,
            pembimbing:pembimbing_id(full_name),
            setoran_tahsin(id, jilid, halaman, nilai, tanggal),
            setoran_tahfidz(id, surah, ayat, nilai, tanggal)
          `)
          .eq('id', params.studentId)
          .single();

        if (error) throw error;

        if (student) {
          const pembimbingData = student.pembimbing as unknown as { full_name: string } | null;
          setData({
            id: student.id,
            full_name: student.full_name || 'Tanpa Nama',
            nis: student.nis || '-',
            tahsin_level: student.tahsin_level || 'Jilid 1',
            tahfidz_level: student.tahfidz_level || 'Juz 30',
            pembimbing_name: pembimbingData?.full_name || 'Guru Pembimbing',
            setoran_tahsin: student.setoran_tahsin || [],
            setoran_tahfidz: student.setoran_tahfidz || [],
          });
        }
      } catch (err) {
        console.error('Gagal mengambil data mutabaah:', err);
      } finally {
        setLoading(false);
      }
    }

    if (params.studentId) {
      fetchMutabaahData();
    }
  }, [params.studentId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-600">Membuat lembar mutaba&apos;ah...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-rose-600">Data santri tidak ditemukan.</div>;
  }

  return (
    <div className="bg-white text-black min-h-screen p-8 max-w-4xl mx-auto print:p-0 print:max-w-full">
      {/* Tombol Cetak / Simpan PDF */}
      <div className="mb-6 flex justify-between items-center print:hidden bg-slate-100 p-4 rounded-lg">
        <span className="text-sm text-slate-700">Pastikan data sudah sesuai sebelum mencetak.</span>
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
        >
          🖨️ Cetak / Simpan PDF
        </button>
      </div>

      {/* Kop & Header Dokumen */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wider">Laporan Mutaba&apos;ah Santri</h1>
        <p className="text-sm font-medium text-slate-700">Program Pembelajaran Tahsin &amp; Tahfidz Al-Qur&apos;an</p>
      </div>

      {/* Identitas Santri */}
      <div className="grid grid-cols-2 gap-4 text-sm mb-6 border p-4 rounded border-slate-300">
        <div>
          <p><span className="font-semibold">Nama Santri:</span> {data.full_name}</p>
          <p><span className="font-semibold">NIS:</span> {data.nis}</p>
          <p><span className="font-semibold">Guru Pembimbing:</span> {data.pembimbing_name}</p>
        </div>
        <div>
          <p><span className="font-semibold">Tingkat Tahsin:</span> {data.tahsin_level}</p>
          <p><span className="font-semibold">Tingkat Tahfidz:</span> {data.tahfidz_level}</p>
          <p><span className="font-semibold">Tanggal Cetak:</span> {new Date().toLocaleDateString('id-ID')}</p>
        </div>
      </div>

      {/* 1. Tabel Setoran Tahsin */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-2 uppercase border-b border-black pb-1">
          1. Riwayat Progress Tahsin
        </h2>
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
            {data.setoran_tahsin.length > 0 ? (
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
                <td colSpan={4} className="border border-slate-400 p-3 text-center text-slate-500 italic">
                  Belum ada catatan setoran Tahsin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 2. Tabel Setoran Tahfidz */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-2 uppercase border-b border-black pb-1">
          2. Riwayat Progress Tahfidz
        </h2>
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
            {data.setoran_tahfidz.length > 0 ? (
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
                <td colSpan={4} className="border border-slate-400 p-3 text-center text-slate-500 italic">
                  Belum ada catatan setoran Tahfidz.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tanda Tangan Pembimbing */}
      <div className="mt-12 flex justify-end text-sm print:block">
        <div className="text-center w-48">
          <p>Guru Pembimbing,</p>
          <div className="h-20"></div>
          <p className="font-bold underline">{data.pembimbing_name}</p>
        </div>
      </div>
    </div>
  );
}