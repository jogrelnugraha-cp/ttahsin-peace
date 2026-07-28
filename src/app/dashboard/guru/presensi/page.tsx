'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Student {
  id: string;
  full_name: string;
}

export default function PresensiGuruPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: studentsData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'siswa')
      .order('full_name');
    
    const { data: attendanceData } = await supabase
      .from('attendances')
      .select('*')
      .eq('attendance_date', date);

    if (studentsData) setStudents(studentsData);
    if (attendanceData) setAttendances(attendanceData);
    
    setLoading(false);
  };

  const updateAttendance = async (studentId: string, status: string) => {
    const { error } = await supabase
      .from('attendances')
      .upsert({ 
        student_id: studentId, 
        attendance_date: date, 
        status: status 
      }, { onConflict: 'student_id, attendance_date' });

    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      fetchData();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header & Tombol Kembali */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Input Presensi Santri</h1>
        <Link 
          href="/dashboard/guru" 
          className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition"
        >
          &larr; Kembali ke Dashboard
        </Link>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <label className="block text-sm font-medium mb-2 text-slate-700">Pilih Tanggal:</label>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded w-full bg-slate-50 text-slate-800"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-500">Memuat data santri...</p>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-700">Nama Santri</th>
                <th className="p-4 text-center text-sm font-semibold text-slate-700">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const statusExist = attendances.find(a => a.student_id === student.id)?.status;

                return (
                  <tr key={student.id} className="border-b hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{student.full_name}</td>
                    <td className="p-4 flex justify-center gap-2">
                      {['hadir', 'izin', 'sakit', 'alpha'].map((status) => {
                        const isActive = statusExist === status;
                        return (
                          <button
                            key={status}
                            onClick={() => updateAttendance(student.id, status)}
                            className={`px-3 py-1 text-xs rounded-full capitalize border transition-all ${
                              isActive 
                                ? 'ring-2 ring-offset-1 ring-slate-400 font-bold opacity-100' 
                                : 'opacity-40 hover:opacity-80'
                            } ${
                              status === 'hadir' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                              status === 'izin' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              status === 'sakit' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              'bg-rose-100 text-rose-700 border-rose-200'
                            }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}