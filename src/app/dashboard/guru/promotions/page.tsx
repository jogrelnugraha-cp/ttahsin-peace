'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface PromotionRequest {
  id: string;
  student_id: string;
  teacher_id: string;
  type: 'tahsin' | 'tahfidz';
  current_level: string;
  target_level: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  student?: { full_name: string; nis?: string };
  teacher?: { full_name: string; teacher_level?: number };
}

interface CurrentTeacher {
  id: string;
  full_name: string;
  teacher_level: number;
}

interface ProfileSummary {
  id: string;
  full_name: string | null;
  nis?: string | null;
  teacher_level?: number | null;
}

export default function PromotionsPage() {
  const [currentTeacher, setCurrentTeacher] = useState<CurrentTeacher | null>(null);
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [requestTableName, setRequestTableName] = useState<'promotion_requests' | 'level_promotions'>('promotion_requests');
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: teacherProfile } = await supabase
          .from('profiles')
          .select('id, full_name, teacher_level')
          .eq('id', session.user.id)
          .single();

        if (!teacherProfile || !isMounted) return;

        const myLevel = teacherProfile.teacher_level || 1;
        setCurrentTeacher({
          id: teacherProfile.id,
          full_name: teacherProfile.full_name || 'Guru',
          teacher_level: myLevel,
        });

        let rawRequests: Array<Record<string, any>> | null = null;
        let requestTableUsed = 'promotion_requests';

        const tableCandidates = ['promotion_requests', 'level_promotions'] as const;
        for (const tableName of tableCandidates) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false });

          if (!error) {
            rawRequests = data || [];
            requestTableUsed = tableName;
            setRequestTableName(tableName);
            break;
          }

          const message = String(error.message || '').toLowerCase();
          const code = String((error as any)?.code || '').toLowerCase();
          const status = String((error as any)?.status || '').toLowerCase();
          const isMissingTable =
            message.includes('could not find the table') ||
            message.includes('does not exist') ||
            message.includes('not found') ||
            message.includes('404') ||
            code === '42p01' ||
            code === '404' ||
            status === '404';
          if (!isMissingTable) {
            throw error;
          }
        }

        if (!rawRequests) {
          setRequests([]);
          return;
        }

        if (!isMounted) return;

        const studentIds = [...new Set((rawRequests || []).map((item) => item.student_id).filter(Boolean))] as string[];
        const teacherIds = [...new Set((rawRequests || []).map((item) => item.teacher_id || item.guru_id).filter(Boolean))] as string[];

        const [studentProfilesResult, teacherProfilesResult] = await Promise.all([
          studentIds.length > 0
            ? supabase.from('profiles').select('id, full_name, nis').in('id', studentIds)
            : Promise.resolve({ data: [] as ProfileSummary[], error: null }),
          teacherIds.length > 0
            ? supabase.from('profiles').select('id, full_name, teacher_level').in('id', teacherIds)
            : Promise.resolve({ data: [] as ProfileSummary[], error: null }),
        ]);

        const studentMap = new Map<string, ProfileSummary>((studentProfilesResult.data || []).map((profile) => [profile.id, profile]));
        const teacherMap = new Map<string, ProfileSummary>((teacherProfilesResult.data || []).map((profile) => [profile.id, profile]));

        const formatted: PromotionRequest[] = (rawRequests || []).map((item) => {
          const teacherId = item.teacher_id || item.guru_id || '';
          const type = (item.type || item.category || 'Tahsin').toString().toLowerCase();
          const normalizedType = type === 'tahfidz' ? 'tahfidz' : 'tahsin';
          const studentProfile = studentMap.get(item.student_id);
          const teacherProfile = teacherMap.get(teacherId);

          return {
            id: item.id,
            student_id: item.student_id,
            teacher_id: teacherId,
            type: normalizedType as 'tahsin' | 'tahfidz',
            current_level: item.current_level || '',
            target_level: item.target_level,
            notes: item.notes,
            status: item.status as 'pending' | 'approved' | 'rejected',
            created_at: item.created_at,
            student: studentProfile
              ? { full_name: studentProfile.full_name || 'Santri', nis: studentProfile.nis || undefined }
              : undefined,
            teacher: teacherProfile
              ? { full_name: teacherProfile.full_name || 'Guru', teacher_level: teacherProfile.teacher_level || 1 }
              : undefined,
          };
        });

        let filteredRequests: PromotionRequest[] = [];

        if (myLevel === 1) {
          filteredRequests = formatted.filter((r) => r.teacher_id === session.user.id);
        } else if (myLevel === 2) {
          filteredRequests = formatted.filter(
            (r) => (r.teacher?.teacher_level === 1) || (r.teacher_id === session.user.id)
          );
        } else if (myLevel >= 3) {
          filteredRequests = formatted;
        }

        setRequests(filteredRequests);
      } catch (err) {
        console.error('Gagal memuat data pengajuan:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Handler Persetujuan/Penolakan
  const handleAction = async (request: PromotionRequest, newStatus: 'approved' | 'rejected') => {
    setProcessingId(request.id);
    try {
      const res = await fetch('/api/promotions/handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id: request.id, action: newStatus === 'approved' ? 'approve' : 'reject' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error || 'Gagal memproses pengajuan');
      }

      // Optimistically update local UI so the change is visible immediately
      setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: newStatus } : r)));
      setRefreshKey((prev) => prev + 1);
      alert(`Pengajuan berhasil di-${newStatus === 'approved' ? 'setujui' : 'tolak'}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      alert(`Gagal memproses pengajuan: ${msg}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <Link href="/dashboard/guru" className="text-sm text-emerald-600 font-medium hover:underline">
              &larr; Kembali ke Dashboard Guru
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Persetujuan Kenaikan Tingkat</h1>
            <p className="text-sm text-slate-600">
              {currentTeacher ? (
                <span>
                  Anda terhubung sebagai <strong className="text-emerald-700">{currentTeacher.full_name}</strong> (Guru Level {currentTeacher.teacher_level})
                </span>
              ) : (
                'Memuat profil guru...'
              )}
            </p>
          </div>
        </div>

      {/* Info Alur */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 space-y-1">
        <p className="font-semibold">ℹ️ Ketentuan Hirarki Persetujuan:</p>
        <ul className="list-disc list-inside space-y-0.5 text-sky-700">
          <li><strong>Guru Level 1</strong>: Mengajukan ke Guru Level 2.</li>
          <li><strong>Guru Level 2</strong>: Menyetujui pengajuan Guru Level 1 &amp; mengajukan ke Guru Level 3.</li>
          <li><strong>Guru Level 3</strong>: Menyetujui pengajuan dari Guru Level 2.</li>
        </ul>
      </div>

      {/* Daftar Pengajuan */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
          <h2 className="font-semibold text-slate-700 text-sm">Daftar Pengajuan Kenaikan Level</h2>
          <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-full">
            Total: {requests.length}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat pengajuan...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Belum ada pengajuan kenaikan level yang perlu ditinjau.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => {
              // Cek apakah guru yang login berhak menyetujui request ini
              const canApprove =
                currentTeacher &&
                ((currentTeacher.teacher_level === 2 && req.teacher?.teacher_level === 1) ||
                 (currentTeacher.teacher_level >= 3 && req.teacher?.teacher_level === 2));

              return (
                <div key={req.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-base">{req.student?.full_name || 'Santri'}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        NIS: {req.student?.nis || '-'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${
                          req.type === 'tahsin'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {req.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Pengajuan: <strong className="text-slate-800">{req.current_level || 'Lama'}</strong> ➔ <strong className="text-emerald-700">{req.target_level}</strong>
                    </p>

                    <p className="text-xs text-slate-500">
                      Diajukan oleh: <strong>{req.teacher?.full_name || 'Guru'}</strong> (Guru Level {req.teacher?.teacher_level || 1})
                    </p>

                    {req.notes && (
                      <p className="text-xs italic text-slate-500 bg-slate-100 p-2 rounded mt-1">
                        &quot;{req.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Status / Aksi */}
                  <div className="flex items-center gap-2">
                    {req.status === 'pending' ? (
                      canApprove ? (
                        <>
                          <button
                            onClick={() => handleAction(req, 'approved')}
                            disabled={processingId === req.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded font-semibold transition disabled:opacity-50"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleAction(req, 'rejected')}
                            disabled={processingId === req.id}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3 py-1.5 rounded font-semibold transition disabled:opacity-50"
                          >
                            Tolak
                          </button>
                        </>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded font-medium border border-amber-200">
                          ⏳ Menunggu Persetujuan Guru Level {(req.teacher?.teacher_level || 1) + 1}
                        </span>
                      )
                    ) : req.status === 'approved' ? (
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded font-semibold border border-emerald-200">
                        ✓ Disetujui
                      </span>
                    ) : (
                      <span className="text-xs bg-rose-100 text-rose-800 px-3 py-1 rounded font-semibold border border-rose-200">
                        ✕ Ditolak
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}