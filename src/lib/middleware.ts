import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Inisialisasi Supabase Client untuk Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 2. Ambil data pengguna terautentikasi
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 3. Aturan Redirection 1: Pengguna belum login mencoba akses halaman terproteksi
  const protectedRoutes = ['/admin', '/guru', '/siswa', '/dashboard'];
  const isAccessingProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!user && isAccessingProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname); // Redirect balik setelah login
    return NextResponse.redirect(loginUrl);
  }

  // 4. Aturan Redirection 2: Pengguna sudah login mencoba akses halaman /login
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 5. Proteksi Berbasis Peran (Role-Based Authorization)
  if (user && isAccessingProtectedRoute) {
    // Ambil role pengguna dari tabel profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    // Proteksi Rute Khusus Admin
    if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Proteksi Rute Khusus Guru
    if (pathname.startsWith('/dashboard/guru') && role !== 'guru' && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Proteksi Rute Khusus Santri
    if (pathname.startsWith('/dashboard/siswa') && role !== 'siswa' && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return response;
}

// Konfigurasi matcher rute yang diproteksi oleh middleware
export const config = {
  matcher: [
    /*
     * Jalankan middleware pada semua rute KECUALI:
     * - _next/static (file statis Next.js)
     * - _next/image (optimasi gambar)
     * - favicon.ico
     * - File publik (gambar, svg, dll.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};