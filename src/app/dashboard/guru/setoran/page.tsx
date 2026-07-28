'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function InputSetoranPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [type, setType] = useState<'tahsin' | 'tahfidz'>('tahfidz');
  const [surahOrJuz, setSurahOrJuz] = useState('');
  const [pageOrVerse, setPageOrVerse] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'siswa')
      .order('full_name');
    if (data) setStudents(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !surahOrJuz) {
      alert('Pilih santri dan isi Surah/Juz terlebih dahulu.');
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
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header & Tombol Kembali */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Catat Setoran Hafalan</h1>
        <Link 
          href="/dashboard/guru" 
          className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition"
        >
          &larr; Kembali ke Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Setoran</label>
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Surah / Juz / Jilid</label>
          <input
            type="text"
            placeholder="Contoh: Surah An-Naba' atau Juz 30 / Jilid 2"
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
            placeholder="Contoh: Ayat 1-20 atau Halaman 12"
            value={pageOrVerse}
            onChange={(e) => setPageOrVerse(e.target.value)}
            className="w-full border p-2.5 rounded-lg text-slate-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Guru (Opsional)</label>
          <textarea
            placeholder="Contoh: Kelancaran baik, perhatikan tajwid."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border p-2.5 rounded-lg h-24 text-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-600 text-white py-2.5 rounded-lg font-medium hover:bg-sky-700 transition"
        >
          {loading ? 'Mencatat...' : 'Simpan Catatan Setoran'}
        </button>
      </form>
    </div>
  );
}