'use client';

import { use } from 'react';
import { redirect } from 'next/navigation';

interface PrintRedirectProps {
  searchParams?: Promise<{
    studentId?: string;
    program?: string;
  }>;
}

export default function PrintRedirectPage({ searchParams }: PrintRedirectProps) {
  const params = use(searchParams || Promise.resolve({ studentId: '', program: '' })) as { studentId?: string; program?: string };
  const studentId = params?.studentId;
  const program = params?.program;


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
