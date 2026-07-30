// src/app/layout.tsx
import './globals.css';

const supabaseUrlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = supabaseUrlRaw.replace(/\/$/, '');
let supabaseOrigin: string | null = null;
try {
  if (supabaseUrl) supabaseOrigin = new URL(supabaseUrl).origin;
} catch (e) {
  supabaseOrigin = null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        {/* Resource hint: preconnect to Supabase for lower DNS/TCP/TLS latency */}
        {supabaseOrigin ? (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}