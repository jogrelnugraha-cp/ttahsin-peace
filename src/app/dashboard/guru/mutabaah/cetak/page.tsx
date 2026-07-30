import { redirect } from 'next/navigation';

interface PrintRedirectProps {
  searchParams?: {
    studentId?: string;
    program?: string;
  };
}

export default function PrintRedirectPage({ searchParams }: PrintRedirectProps) {
  const studentId = searchParams?.studentId;
  const program = searchParams?.program;

  if (!studentId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
        <div className="bg-white border border-rose-200 text-rose-700 p-6 rounded-xl shadow-sm text-center">
          <p className="font-semibold">ID santri tidak diberikan.</p>
          <p className="mt-2 text-sm text-slate-500">Silakan gunakan link dengan parameter <code>studentId</code>.</p>
        </div>
      </div>
    );
  }

  const url = `/dashboard/guru/mutabaah/cetak/${studentId}${program ? `?program=${encodeURIComponent(program)}` : ''}`;
  redirect(url);
}
