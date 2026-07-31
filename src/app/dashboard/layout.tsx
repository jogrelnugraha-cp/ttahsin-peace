// File: src/app/dashboard/layout.tsx
import Navbar from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}