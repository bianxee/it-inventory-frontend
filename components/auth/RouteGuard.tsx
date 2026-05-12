// components/auth/RouteGuard.tsx
// Proteksi halaman — redirect ke /login jika belum login

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/lib/auth';

interface RouteGuardProps {
  children:      React.ReactNode;
  requiredRole?: User['role'][];   // kosong = semua role boleh
}

// Loading spinner saat cek session
function AuthLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Memverifikasi sesi...</p>
      </div>
    </div>
  );
}

export default function RouteGuard({ children, requiredRole }: RouteGuardProps) {
  const { isLoggedIn, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Belum login → ke halaman login
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

    // Cek role jika diperlukan
    if (requiredRole && user && !requiredRole.includes(user.role)) {
      router.replace('/');
    }
  }, [isLoggedIn, isLoading, user, requiredRole, router]);

  if (isLoading)                                          return <AuthLoading />;
  if (!isLoggedIn)                                        return <AuthLoading />;
  if (requiredRole && user && !requiredRole.includes(user.role)) return <AuthLoading />;

  return <>{children}</>;
}
