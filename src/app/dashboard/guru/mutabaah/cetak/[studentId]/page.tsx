import { supabaseAdmin } from '@/lib/supabaseAdmin';
import PrintControls from '../PrintControls';
import PrintTemplate from '../PrintTemplate';

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

export default async function CetakMutabaahPage({ params, searchParams }: { params: { studentId?: string }, searchParams?: { program?: string; studentId?: string } }) {
  const studentId = params?.studentId || searchParams?.studentId;
  const program = searchParams?.program;

  if (!studentId) {
    return (
      <div className="p-8 text-center text-rose-600">
        <p>ID santri tidak diberikan.</p>
        <p className="mt-2 text-sm text-slate-500">Periksa URL atau pastikan ID ada di path.</p>
        <pre className="mt-3 text-left text-xs text-slate-600 bg-slate-100 p-3 rounded">{JSON.stringify({ params, searchParams }, null, 2)}</pre>
      </div>
    );
  }

  try {
    const { data: student, error } = await supabaseAdmin
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
      .eq('id', studentId)
      .single();

    if (error) throw error;

    if (!student) {
      return <div className="p-8 text-center text-rose-600">Data santri tidak ditemukan.</div>;
    }

    const pembimbingData = (student as any).pembimbing as { full_name?: string } | null;

    const data: StudentMutabaah = {
      id: student.id,
      full_name: student.full_name || 'Tanpa Nama',
      nis: student.nis || '-',
      tahsin_level: student.tahsin_level || 'Jilid 1',
      tahfidz_level: student.tahfidz_level || 'Juz 30',
      pembimbing_name: pembimbingData?.full_name || 'Guru Pembimbing',
      setoran_tahsin: (student.setoran_tahsin as TahsinRecord[]) || [],
      setoran_tahfidz: (student.setoran_tahfidz as TahfidzRecord[]) || [],
    };

    return (
      <div className="bg-white text-black min-h-screen p-8 max-w-4xl mx-auto print:p-0 print:max-w-full">
        <PrintControls />
        <PrintTemplate data={data} program={program} />
      </div>
    );
  } catch (err) {
    console.error('Error fetching mutabaah data (server):', err);
    return <div className="p-8 text-center text-rose-600">Terjadi kesalahan saat mengambil data.</div>;
  }
}