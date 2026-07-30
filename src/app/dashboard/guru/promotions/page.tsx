'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export default function PromotionsPage() {
  const [currentTeacher, setCurrentTeacher] = useState<CurrentTeacher | null>(null);
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Dapatkan user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 2. Ambil profil guru login
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

        // 3. Ambil seluruh data pengajuan kenaikan level
        const { data: rawRequests, error } = await supabase
          .from('promotion_requests')
          .select(`
            id,
            student_id,
            teacher_id,
            type,
            current_level,
            target_level,
            notes,
            status,
            created_at,
            student:student_id(full_name, nis),
            teacher:teacher_id(full_name, teacher_level)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!isMounted) return;

        const formatted: PromotionRequest[] = (rawRequests || []).map((item) => ({
          id: item.id,
          student_id: item.student_id,
          teacher_id: item.teacher_id,
          type: item.type,
          current_level: item.current_level,
          target_level: item.target_level,
          notes: item.notes,
          status: item.status,
          created_at: item.created_at,
          student: item.student as unknown as { full_name: string; nis?: string },
          teacher: item.teacher as unknown as { full_name: string; teacher_level?: number },
        }));

        // 4. Filter data berdasarkan Hirarki Level Guru
        let filteredRequests: PromotionRequest[] = [];

        if (myLevel === 1) {
          // Guru Level 1: Hanya melihat pengajuan yang dibuat oleh dirinya sendiri
          filteredRequests = formatted.filter((r) => r.teacher_id === session.user.id);
        } else if (myLevel === 2) {
          // Guru Level 2: Meninjau pengajuan dari Guru Level 1 + melihat pengajuan buatannya sendiri
          filteredRequests = formatted.filter(
            (r) => (r.teacher?.teacher_level === 1) || (r.teacher_id === session.user.id)
          );
        } else if (myLevel >= 3) {
          // Guru Level 3: Meninjau pengajuan dari Guru Level 2 (serta Level 1 jika ada)
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
      // Update status di promotion_requests
      const { error: reqError } = await supabase
        .from('promotion_requests')
        .update({ status: newStatus })
        .eq('id', request.id);

      if (reqError) throw reqError;

      // Jika disetujui, update level santri di tabel profiles
      if (newStatus === 'approved') {
        const updateField = request.type === 'tahsin' ? 'tahsin_level' : 'tahfidz_level';
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ [updateField]: request.target_level })
          .eq('id', request.student_id);

        if (profileError) throw profileError;
      }

      alert(`Pengajuan berhasil di-${newStatus === 'approved' ? 'setujui' : 'tolak'}!`);
      setRefreshKey((prev) => prev + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      alert(`Gagal memproses pengajuan: ${msg}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Persetujuan Kenaikan Tingkat</h1>
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
        <Link
          href="/dashboard/guru"
          className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-lg font-medium border transition"
        >
          ← Kembali ke Dashboard
        </Link>
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
  );
}