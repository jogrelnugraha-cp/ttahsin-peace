'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getExistingPresensiForRange, submitPeriodPresensi, type PresensiItem } from './action';

interface Student {
  id: string;
  full_name: string;
  nis?: string;
}

type AttendanceStatus = 'none' | 'hadir' | 'izin' | 'sakit' | 'alfa' | 'libur';

interface AttendanceValue {
  status: AttendanceStatus;
  catatan: string;
}

const statusMeta: Array<{ value: AttendanceStatus; label: string; shortLabel: string; className: string }> = [
  { value: 'none', label: 'Belum diisi', shortLabel: '', className: 'bg-white text-slate-300' },
  { value: 'hadir', label: 'Hadir', shortLabel: '✓', className: 'bg-emerald-100 text-emerald-700' },
  { value: 'izin', label: 'Izin', shortLabel: 'I', className: 'bg-amber-100 text-amber-700' },
  { value: 'alfa', label: 'Alfa', shortLabel: 'A', className: 'bg-rose-100 text-rose-700' },
  { value: 'sakit', label: 'Sakit', shortLabel: 'S', className: 'bg-slate-800 text-white' },
  { value: 'libur', label: 'Libur', shortLabel: '-', className: 'bg-sky-100 text-sky-700' },
];

const getMonthLabel = (year: number, month: number) => new Date(year, month - 1, 1).toLocaleDateString('id-ID', {
  month: 'long',
  year: 'numeric',
});

export default function PresensiKelasPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<string, AttendanceValue>>>({});

  const dateList = useMemo(() => {
    const dates: string[] = [];
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(selectedYear, selectedMonth - 1, day);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      dates.push(value);
    }
    return dates;
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: list } = await supabase
          .from('profiles')
          .select('id, full_name, nis')
          .eq('role', 'siswa')
          .eq('pembimbing_id', user.id)
          .order('full_name', { ascending: true });

        const studentList = list || [];
        setStudents(studentList);

        const startDate = dateList[0];
        const endDate = dateList[dateList.length - 1];
        const existingEntries = startDate && endDate ? await getExistingPresensiForRange(startDate, endDate) : [];

        const nextMap: Record<string, Record<string, AttendanceValue>> = {};
        studentList.forEach((student) => {
          nextMap[student.id] = {};
          dateList.forEach((date) => {
            nextMap[student.id][date] = { status: 'none', catatan: '' };
          });
        });

        existingEntries.forEach((entry) => {
          const student = nextMap[entry.student_id];
          if (student && entry.tanggal) {
            student[entry.tanggal] = {
              status: entry.status || 'hadir',
              catatan: entry.catatan || '',
            };
          }
        });

        setAttendanceMap(nextMap);
      } catch (err) {
        console.error('Gagal memuat absensi:', err);
      } finally {
        setLoading(false);
      }
    }

    if (dateList.length > 0) {
      loadData();
    }
  }, [dateList]);

  const handleStatusToggle = (studentId: string, dateKey: string) => {
    setAttendanceMap((prev) => {
      const current = prev[studentId]?.[dateKey] || { status: 'none', catatan: '' };
      const nextStatus = current.status === 'none'
        ? 'hadir'
        : current.status === 'hadir'
        ? 'izin'
        : current.status === 'izin'
        ? 'alfa'
        : current.status === 'alfa'
        ? 'sakit'
        : current.status === 'sakit'
        ? 'libur'
        : 'none';

      return {
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [dateKey]: { ...current, status: nextStatus },
        },
      };
    });
  };

  const handleCatatanChange = (studentId: string, dateKey: string, catatan: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [dateKey]: { ...(prev[studentId]?.[dateKey] || { status: 'hadir', catatan: '' }), catatan },
      },
    }));
  };

  const handleSubmit = async () => {
    if (students.length === 0 || dateList.length === 0) {
      alert('Tidak ada santri untuk diabsen.');
      return;
    }

    setSaving(true);
    try {
      const records: Array<PresensiItem & { tanggal: string }> = [];
      students.forEach((student) => {
        dateList.forEach((dateKey) => {
          const entry = attendanceMap[student.id]?.[dateKey];
          if (entry && entry.status !== 'none') {
            records.push({
              student_id: student.id,
              tanggal: dateKey,
              status: entry.status,
              catatan: entry.catatan || '',
            });
          }
        });
      });

      await submitPeriodPresensi(records);
      alert(`Absensi untuk ${getMonthLabel(selectedYear, selectedMonth)} berhasil disimpan.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      alert(`Gagal menyimpan: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link href="/dashboard/guru" className="mb-2 inline-flex items-center text-sm font-semibold text-emerald-700 hover:underline">
                ← Kembali ke Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-slate-800">Lembar Absensi Kelas</h1>
              <p className="mt-1 text-sm text-slate-600">
                Format tabel absensi penuh untuk satu bulan atau satu semester, disusun berdasarkan urutan siswa bimbingan.
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Format offline seperti daftar kelas
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 text-center text-sm font-semibold text-slate-700">
              {getMonthLabel(selectedYear, selectedMonth)}
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {Array.from({ length: 12 }, (_, idx) => idx + 1).map((month) => (
                  <option key={month} value={month}>{getMonthLabel(selectedYear, month)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex flex-wrap gap-2">
            {statusMeta.map((item) => (
              <div key={item.value} className={`rounded-full px-3 py-1 text-xs font-semibold ${item.className}`}>
                {item.shortLabel} = {item.label}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Memuat daftar absensi...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs text-slate-700">
                <thead>
                  <tr>
                    <th className="min-w-[180px] border border-slate-200 bg-slate-50 p-2 text-left font-semibold">Nama Santri</th>
                    {dateList.map((dateKey) => {
                      const date = new Date(dateKey);
                      return (
                        <th key={dateKey} className="min-w-[46px] border border-slate-200 bg-slate-50 p-1 text-center">
                          <div className="font-semibold">{date.getDate()}</div>
                          <div className="text-[10px] uppercase text-slate-400">{date.toLocaleDateString('id-ID', { weekday: 'short' })}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.map((student, index) => (
                      <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="border border-slate-200 p-2 font-semibold text-slate-700">
                          <div>{student.full_name}</div>
                          <div className="text-[10px] text-slate-400">{student.nis || '-'}</div>
                        </td>
                        {dateList.map((dateKey) => {
                          const entry = attendanceMap[student.id]?.[dateKey] || { status: 'none', catatan: '' };
                          const meta = statusMeta.find((item) => item.value === entry.status) || statusMeta[0];
                          return (
                            <td key={`${student.id}-${dateKey}`} className="border border-slate-200 p-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleStatusToggle(student.id, dateKey)}
                                className={`flex h-8 w-8 items-center justify-center rounded-md border border-slate-100 text-sm font-bold ${meta.className}`}
                                title={`${student.full_name} - ${dateKey}`}
                              >
                                {meta.shortLabel}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={dateList.length + 1} className="border border-slate-200 p-6 text-center text-sm text-slate-500">
                        Belum ada santri bimbingan untuk di-absen.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            Klik setiap kotak untuk mengubah status kehadiran. Simpan untuk memperbarui lembar absensi periode yang dipilih.
          </p>
          <button
            onClick={handleSubmit}
            disabled={saving || students.length === 0}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Absensi'}
          </button>
        </div>
      </div>
    </div>
  );
}