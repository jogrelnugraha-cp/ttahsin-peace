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

export interface StudentMutabaah {
  id: string;
  full_name: string;
  nis: string;
  tahsin_level: string;
  tahfidz_level: string;
  pembimbing_name: string;
  setoran_tahsin: TahsinRecord[];
  setoran_tahfidz: TahfidzRecord[];
}

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export default async function CetakMutabaahPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId?: string }>;
  searchParams?: Promise<{ program?: string; studentId?: string; pembimbing?: string; guru?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const studentId = (resolvedParams?.studentId || resolvedSearchParams?.studentId)?.trim();
  const program = resolvedSearchParams?.program;

  if (!studentId) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-rose-600">ID santri tidak diberikan.</p>
        </div>
      </div>
    );
  }

  try {
    // 1. Fetch profil santri
    const { data: student } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    // 2. Fetch catatan setoran
    const { data: submissions } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (!student && (!submissions || submissions.length === 0)) {
      return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">
          <div className="mx-auto max-w-4xl rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-rose-600">Data santri tidak ditemukan.</p>
            <p className="mt-1 text-xs font-mono text-slate-500">ID: {studentId}</p>
          </div>
        </div>
      );
    }

    // 3. LOGIKA PENCARIAN NAMA GURU PEMBIMBING
    let pembimbingName = '';

    // TIER 1: Dari URL parameter (?pembimbing=NamaGuru)
    if (resolvedSearchParams?.pembimbing || resolvedSearchParams?.guru) {
      pembimbingName = (resolvedSearchParams.pembimbing || resolvedSearchParams.guru || '').trim();
    }

    // TIER 2: Cari via pembimbing_id dari profil santri (seperti di Supabase Anda)
    if (!pembimbingName && student?.pembimbing_id) {
      const { data: pData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', student.pembimbing_id)
        .maybeSingle();

      if (pData?.full_name) {
        pembimbingName = pData.full_name;
      }
    }

    // TIER 3: Cari via teacher_id dari profil santri (seperti di Supabase Anda)
    if (!pembimbingName && student?.teacher_id) {
      const { data: tData } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', student.teacher_id)
        .maybeSingle();

      if (tData?.full_name) {
        pembimbingName = tData.full_name;
      }
    }

    // TIER 4: Cek teks nama langsung di profil santri
    if (!pembimbingName && student) {
      pembimbingName = student.pembimbing_name || student.guru_name || '';
    }

    // TIER 5: Fallback - Ambil profil user pertama ber-role guru
    if (!pembimbingName) {
      const { data: gurus } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .or('role.eq.guru,role.eq.Guru')
        .limit(1);

      if (gurus && gurus.length > 0 && gurus[0].full_name) {
        pembimbingName = gurus[0].full_name;
      }
    }

    // Fallback terakhir jika nama masih kosong
    if (!pembimbingName) {
      pembimbingName = 'Ustadz / Ustadzah Pembimbing';
    }

    // 4. Formatter data setoran
    const tahsinSubmissions = (submissions || [])
      .filter((s) => s.submission_type === 'tahsin')
      .map((s) => ({
        id: s.id,
        jilid: s.surah_or_juz || '-',
        halaman: parseInt(s.page_or_verse) || 0,
        nilai: s.notes || '-',
        tanggal: formatDate(s.created_at),
      }));

    const tahfidzSubmissions = (submissions || [])
      .filter((s) => s.submission_type === 'tahfidz')
      .map((s) => ({
        id: s.id,
        surah: s.surah_or_juz || '-',
        ayat: s.page_or_verse || '-',
        nilai: s.notes || '-',
        tanggal: formatDate(s.created_at),
      }));

    const data: StudentMutabaah = {
      id: student?.id || studentId,
      full_name: student?.full_name || 'Tanpa Nama',
      nis: student?.nis || '-',
      tahsin_level: student?.tahsin_level || 'Jilid 1',
      tahfidz_level: student?.tahfidz_level || 'Juz 30',
      pembimbing_name: pembimbingName,
      setoran_tahsin: tahsinSubmissions,
      setoran_tahfidz: tahfidzSubmissions,
    };

    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div>
              <p className="text-sm font-medium text-emerald-600">Mutaba&apos;ah Santri</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-800">Cetak Laporan Perkembangan</h1>
              <p className="mt-1 text-sm text-slate-500">Dokumen cetak mengikuti format admin agar tampilan konsisten antar halaman guru.</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm print:p-0 print:border-0 print:shadow-none">
            <PrintControls />
            <PrintTemplate data={data} program={program} />
          </div>
        </div>
      </div>
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-rose-600">Terjadi kesalahan saat mengambil data: {errorMsg}</p>
        </div>
      </div>
    );
  }
}