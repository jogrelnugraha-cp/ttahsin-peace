'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface StudentSelect {
  id: string;
  full_name: string;
}

export default function InputSetoranPage() {
  const [students, setStudents] = useState<StudentSelect[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [type, setType] = useState<'tahsin' | 'tahfidz'>('tahfidz');
  const [surahOrJuz, setSurahOrJuz] = useState('');
  const [pageOrVerse, setPageOrVerse] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'siswa')
        .eq('pembimbing_id', user.id)
        .order('full_name');
      if (data) setStudents(data as StudentSelect[]);
    };

    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Pilih santri terlebih dahulu.');
      return;
    }

    if (type === 'tahsin') {
      if (!surahOrJuz || !pageOrVerse) {
        alert('Isi level tahsin dan materi tahsin terlebih dahulu.');
        return;
      }
    } else if (!surahOrJuz) {
      alert('Pilih/isi Surah/Juz terlebih dahulu.');
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('submissions').insert({
      student_id: selectedStudent,
      teacher_id: user?.id,
      submission_type: type,
      surah_or_juz: surahOrJuz,
      page_or_verse: pageOrVerse,
      notes: notes,
    });

    setLoading(false);

    if (error) {
      alert('Gagal menyimpan setoran: ' + error.message);
    } else {
      alert('Setoran berhasil dicatat!');
      setSurahOrJuz('');
      setPageOrVerse('');
      setNotes('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <Link href="/dashboard/guru" className="text-sm text-emerald-600 font-medium hover:underline">
              &larr; Kembali ke Dashboard Guru
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Catatan Tahsin &amp; Tahfidz</h1>
            <p className="text-sm text-slate-500">Input setoran harian untuk seluruh siswa bimbingan.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Santri</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full border p-2.5 rounded-lg bg-slate-50 text-slate-800"
            required
          >
            <option value="">-- Pilih Santri --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kegiatan</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="type"
                value="tahfidz"
                checked={type === 'tahfidz'}
                onChange={() => setType('tahfidz')}
              />
              <span>Tahfidz (Hafalan)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="type"
                value="tahsin"
                checked={type === 'tahsin'}
                onChange={() => setType('tahsin')}
              />
              <span>Tahsin (Bacaan)</span>
            </label>
          </div>
        </div>

        {type === 'tahsin' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Level Tahsin</label>
              <input
                type="text"
                placeholder="Contoh: Level 1 / Level 2"
                value={surahOrJuz}
                onChange={(e) => setSurahOrJuz(e.target.value)}
                className="w-full border p-2.5 rounded-lg text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Materi Tahsin</label>
              <input
                type="text"
                placeholder="Contoh: Mad, Ghunnah, Makharijul Huruf"
                value={pageOrVerse}
                onChange={(e) => setPageOrVerse(e.target.value)}
                className="w-full border p-2.5 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Guru</label>
              <textarea
                placeholder="Contoh: Kelancaran baik, perhatikan tajwid."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border p-2.5 rounded-lg h-24 text-slate-800"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Surah</label>
              <input
                type="text"
                placeholder="Contoh: Surah An-Naba"
                value={surahOrJuz}
                onChange={(e) => setSurahOrJuz(e.target.value)}
                className="w-full border p-2.5 rounded-lg text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ayat / Halaman</label>
              <input
                type="text"
                placeholder="Contoh: Ayat 1-20"
                value={pageOrVerse}
                onChange={(e) => setPageOrVerse(e.target.value)}
                className="w-full border p-2.5 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Guru (Opsional)</label>
              <textarea
                placeholder="Contoh: pertahankan konsistensi mad, perbaiki qalqalah."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border p-2.5 rounded-lg h-24 text-slate-800"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition"
        >
          {loading ? 'Mencatat...' : 'Simpan Catatan Setoran'}
        </button>
      </form>
      </div>
    </div>
  );
}