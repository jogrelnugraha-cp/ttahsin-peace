'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

interface UserProfile {
  full_name: string;
  role: string;
}

export default function Navbar() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [appName, setAppName] = useState<string>('Tahsin & Tahfidz');
  const router = useRouter();
  const pathname = usePathname();

  const getSettings = async () => {
    const { data } = await supabase
      .from('settings')
      .select('app_name, logo_url')
      .eq('id', 'app_config')
      .single();
    if (data) {
      if (data.logo_url) setLogoUrl(data.logo_url);
      if (data.app_name) setAppName(data.app_name);
    }
  };

  const getProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data as UserProfile);
    }
  };

  useEffect(() => {
    const loadNavigationData = async () => {
      await getProfile();
      await getSettings();
    };

    void loadNavigationData();
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo / Brand Name */}
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 ${
            logoUrl ? 'bg-transparent' : 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
          }`}>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                unoptimized
              />
            ) : (
              '📖'
            )}
          </div>
          <div>
            <span className="font-bold text-slate-800 text-base block leading-tight">{appName}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
              {profile?.role || 'User'}
            </span>
          </div>
        </div>

        {/* Right Info & Logout */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-slate-700">{profile?.full_name || 'Loading...'}</p>
            <p className="text-[11px] text-slate-400 capitalize">{profile?.role}</p>
          </div>

          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>🚪</span>
            <span>Keluar</span>
          </button>
        </div>

      </div>
    </header>
  );
}