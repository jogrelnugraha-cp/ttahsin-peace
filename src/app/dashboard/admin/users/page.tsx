'use client';

import { useState, useEffect } from 'react';
import { supabase, createSupabaseClient } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'guru' | 'siswa' | 'ortu';
  nis?: string;
  teacher_id?: string | null;
  teacher_level?: number;
  tahsin_level?: string;
  tahfidz_level?: string;
  created_at: string;
  teacher?: { full_name: string } | null;
}

interface Teacher {
  id: string;
  full_name: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'siswa' | 'guru' | 'admin'>('siswa');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // State Modal Tambah Pengguna
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State Pengguna Baru
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'siswa' | 'guru' | 'admin'>('siswa');
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newNis, setNewNis] = useState('');
  const [newTeacherLevel, setNewTeacherLevel] = useState(1);
  const [newTahsin, setNewTahsin] = useState('Jilid 1');
  const [newTahfidz, setNewTahfidz] = useState('Juz 30');

  // State Modal Edit Pengguna
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editNis, setEditNis] = useState('');
  const [editTeacherLevel, setEditTeacherLevel] = useState(1);
  const [editTahsin, setEditTahsin] = useState('');
  const [editTahfidz, setEditTahfidz] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'guru' | 'siswa' | 'ortu'>('siswa');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'guru')
      .order('full_name', { ascending: true });
    if (data) setTeachers(data as Teacher[]);
  };

  const fetchProfilesData = async () => {
    // Coba query dengan relasi teacher_id
    const { data, error } = await supabase
      .from('profiles')
      .select('*, teacher:teacher_id(full_name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as Profile[];
    }

    // Fallback jika kolom teacher_id belum ada di tabel Supabase
    const { data: fallbackData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    return (fallbackData as Profile[]) || [];
  };

  const reloadUsers = async () => {
    setLoading(true);
    const data = await fetchProfilesData();
    setUsers(data);
    await fetchTeachers();
    setLoading(false);
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const [profilesList, teachersRes] = await Promise.all([
        fetchProfilesData(),
        supabase.from('profiles').select('id, full_name').eq('role', 'guru').order('full_name', { ascending: true }),
      ]);

      setUsers(profilesList);
      if (teachersRes.data) {
        setTeachers(teachersRes.data as Teacher[]);
      }
      setLoading(false);
    };
    initData();
  }, []);

  // Handler Tambah Pengguna Baru
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg(null);

    try {
      const tempSupabase = createSupabaseClient({ auth: { persistSession: false } });

      // 1. Registrasi Akun Auth Baru
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            full_name: newName,
            role: newRole,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const profilePayload: Record<string, any> = {
          id: authData.user.id,
          full_name: newName,
          role: newRole,
          nis: newRole === 'siswa' ? (newNis || null) : null,
          tahsin_level: newRole === 'siswa' ? newTahsin : null,
          tahfidz_level: newRole === 'siswa' ? newTahfidz : null,
          teacher_id: newRole === 'siswa' && newTeacherId ? newTeacherId : null,
          teacher_level: newRole === 'guru' ? newTeacherLevel : null,
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profilePayload);

        if (profileError) {
          throw new Error(`Akun Auth berhasil dibuat, namun profil gagal disimpan: ${profileError.message}`);
        }
      }

      alert(`Berhasil menambahkan ${newRole} baru (${newName})!`);

      setShowModal(false);
      setRoleFilter('siswa');
      setSearchQuery('');
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('siswa');
      setNewTeacherId('');
      setNewNis('');
      setNewTeacherLevel(1);
      setNewTahsin('Jilid 1');
      setNewTahfidz('Juz 30');

      await reloadUsers();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menambahkan pengguna.');
    } finally {
      setCreating(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: Profile) => {
    setEditingUser(user);
    setEditName(user.full_name || '');
    setEditTeacherId(user.teacher_id || '');
    setEditNis(user.nis || '');
    setEditTeacherLevel(user.teacher_level || 1);
    setEditTahsin(user.tahsin_level || 'Jilid 1');
    setEditTahfidz(user.tahfidz_level || 'Juz 30');
    setEditRole(user.role);
  };

  // Save Edit Profile
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);

    const updatePayload: Record<string, any> = {
      full_name: editName,
      role: editRole,
      nis: editRole === 'siswa' ? (editNis || null) : null,
      tahsin_level: editRole === 'siswa' ? editTahsin : null,
      tahfidz_level: editRole === 'siswa' ? editTahfidz : null,
      teacher_id: editRole === 'siswa' && editTeacherId ? editTeacherId : null,
      teacher_level: editRole === 'guru' ? editTeacherLevel : null,
    };

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', editingUser.id);

    if (error) {
      alert(`Gagal memperbarui profil: ${error.message}`);
    } else {
      alert(`Profil ${editName} berhasil diperbarui!`);
      setEditingUser(null);
      await reloadUsers();
    }
    setSavingEdit(false);
  };

  // Update Role Pengguna secara cepat
  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    const payload: Record<string, any> = { role: newRole };
    if (newRole === 'guru') payload.teacher_level = 1;
    if (newRole !== 'guru') payload.teacher_level = null;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    if (error) {
      alert(`Gagal memperbarui peran: ${error.message}`);
    } else {
      await reloadUsers();
    }
    setUpdatingId(null);
  };

  // Filter Data Pengguna
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const showLevelGuru = roleFilter === 'guru';
  const showStudentDetails = roleFilter === 'siswa';

  // Sorting sesuai permintaan:
  // - Jika filter 'siswa': urut berdasarkan nis (numerik) dari kecil ke besar, lalu full_name
  // - Jika filter 'guru' atau 'admin': urut berdasarkan full_name (A-Z)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const nameA = (a.full_name || '').toLowerCase();
    const nameB = (b.full_name || '').toLowerCase();

    if (roleFilter === 'siswa') {
      const na = Number(a.nis ?? NaN);
      const nb = Number(b.nis ?? NaN);
      const aIsNum = Number.isFinite(na);
      const bIsNum = Number.isFinite(nb);
      if (aIsNum && bIsNum) {
        if (na !== nb) return na - nb;
        return nameA.localeCompare(nameB);
      }
      if (aIsNum && !bIsNum) return -1;
      if (!aIsNum && bIsNum) return 1;
      return nameA.localeCompare(nameB);
    }

    // default for guru/admin: sort by name
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigasi Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link href="/dashboard/admin" className="text-sm text-emerald-600 font-medium hover:underline">&larr; Kembali ke Dashboard Admin</Link>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Manajemen Pengguna</h1>
            <p className="text-slate-500 text-sm">Kelola, tambah, dan atur Guru Pembimbing siswa.</p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 shadow-sm"
          >
            <span>➕</span>
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>

        {/* Filter & Pencarian */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-1/2">
            <input
              type="text"
              placeholder="🔍 Cari nama pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="w-full md:w-auto flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Peran:</span>
            {['siswa', 'guru', 'admin'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r as 'siswa' | 'guru' | 'admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  roleFilter === r
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Tabel / Daftar Pengguna */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Memuat data pengguna...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Pengguna tidak ditemukan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">Nama Lengkap</th>
                    <th className="p-4">Peran (Role)</th>
                    <th className="p-4">
                      {showLevelGuru ? 'Level Guru' : <span className="invisible">Level Guru</span>}
                    </th>
                    <th className="p-4">
                      {showStudentDetails ? 'NIS' : <span className="invisible">NIS</span>}
                    </th>
                    <th className="p-4">
                      {showStudentDetails ? 'Guru Pembimbing' : <span className="invisible">Guru Pembimbing</span>}
                    </th>
                    <th className="p-4">
                      {showStudentDetails ? 'Tingkat Tahsin' : <span className="invisible">Tingkat Tahsin</span>}
                    </th>
                    <th className="p-4">
                      {showStudentDetails ? 'Tingkat Tahfidz' : <span className="invisible">Tingkat Tahfidz</span>}
                    </th>
                    <th className="p-4 text-center">&nbsp;</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sortedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{user.full_name || 'Tanpa Nama'}</div>
                        <div className="text-xs text-slate-400 font-mono">{user.id.substring(0, 8)}...</div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'guru'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>

                      {showLevelGuru && (
                        <td className="p-4 text-slate-600 text-xs font-medium">
                          {user.role === 'guru' ? `Level ${user.teacher_level || 1}` : '-'}
                        </td>
                      )}

                      {showStudentDetails && (
                        <>
                          <td className="p-4 text-slate-600 text-xs font-medium">
                            {user.role === 'siswa' ? (user.nis || '-') : '-'}
                          </td>

                          <td className="p-4 text-slate-700 text-xs font-medium">
                            {user.role === 'siswa' ? (
                              user.teacher?.full_name ? (
                                <span className="font-semibold text-emerald-700">👳‍♂️ {user.teacher.full_name}</span>
                              ) : (
                                <span className="text-slate-400 italic">Belum ditentukan</span>
                              )
                            ) : '-'}
                          </td>

                          <td className="p-4 text-slate-600 text-xs font-medium">
                            {user.role === 'siswa' ? (user.tahsin_level || 'Jilid 1') : '-'}
                          </td>

                          <td className="p-4 text-slate-600 text-xs font-medium">
                            {user.role === 'siswa' ? (user.tahfidz_level || 'Juz 30') : '-'}
                          </td>
                        </>
                      )}

                      <td className="p-4 text-center flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          ✏️ Edit
                        </button>
                        <select
                          disabled={updatingId === user.id}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                        >
                          <option value="siswa">Siswa</option>
                          <option value="guru">Guru</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Modal Form Tambah Pengguna Baru */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Tambah Pengguna Baru</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap Siswa / Pengguna</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fauzi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Log In</label>
                <input
                  type="email"
                  required
                  placeholder="ahmad@peace.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Peran (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'siswa' | 'guru' | 'admin')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="siswa">Siswa</option>
                  <option value="guru">Guru / Pengajar</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {/* Input Tambahan Jika Role = Siswa */}
              {newRole === 'guru' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Level Guru</label>
                    <select
                      value={newTeacherLevel}
                      onChange={(e) => setNewTeacherLevel(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value={1}>Level 1</option>
                      <option value={2}>Level 2</option>
                      <option value={3}>Level 3</option>
                    </select>
                  </div>
                </div>
              )}

              {newRole === 'siswa' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">NIS (Nomor Induk Siswa)</label>
                    <input
                      type="text"
                      placeholder="Nomor Induk Siswa"
                      value={newNis}
                      onChange={(e) => setNewNis(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Guru Pembimbing / Pengajar</label>
                    <select
                      value={newTeacherId}
                      onChange={(e) => setNewTeacherId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Guru Pembimbing --</option>
                      {teachers.map((g) => (
                        <option key={g.id} value={g.id}>{g.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tingkat Tahsin</label>
                      <input
                        type="text"
                        placeholder="Contoh: Jilid 1"
                        value={newTahsin}
                        onChange={(e) => setNewTahsin(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tingkat Tahfidz</label>
                      <input
                        type="text"
                        placeholder="Contoh: Juz 30"
                        value={newTahfidz}
                        onChange={(e) => setNewTahfidz(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {creating ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal Edit Pengguna */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Edit Profil Pengguna</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Peran (Role)</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Profile['role'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="siswa">Siswa</option>
                  <option value="guru">Guru / Pengajar</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {editRole === 'guru' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Level Guru</label>
                    <select
                      value={editTeacherLevel}
                      onChange={(e) => setEditTeacherLevel(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value={1}>Level 1</option>
                      <option value={2}>Level 2</option>
                      <option value={3}>Level 3</option>
                    </select>
                  </div>
                </div>
              )}

              {editRole === 'siswa' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">NIS (Nomor Induk Siswa)</label>
                    <input
                      type="text"
                      placeholder="Nomor Induk Siswa"
                      value={editNis}
                      onChange={(e) => setEditNis(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Guru Pembimbing / Pengajar</label>
                    <select
                      value={editTeacherId}
                      onChange={(e) => setEditTeacherId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Belum Ditentukan --</option>
                      {teachers.map((g) => (
                        <option key={g.id} value={g.id}>{g.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tingkat Tahsin</label>
                      <input
                        type="text"
                        value={editTahsin}
                        onChange={(e) => setEditTahsin(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Tingkat Tahfidz</label>
                      <input
                        type="text"
                        value={editTahfidz}
                        onChange={(e) => setEditTahfidz(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}