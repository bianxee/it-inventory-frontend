// contexts/AuthContext.tsx
// Global auth state — wrap seluruh app dengan ini

'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getSession, clearSession, login as authLogin, type User, type Session } from '@/lib/auth';

// ─────────────────────────────────────────────────────────────
// CONTEXT TYPE
// ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  user:        User | null;
  session:     Session | null;
  isLoading:   boolean;
  isLoggedIn:  boolean;
  login:       (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout:      () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session dari sessionStorage saat pertama load
  useEffect(() => {
    const saved = getSession();
    setSession(saved);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authLogin(email, password);
    if (result.success) {
      const saved = getSession();
      setSession(saved);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user:       session?.user ?? null,
      session,
      isLoading,
      isLoggedIn: !!session?.user,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus digunakan di dalam <AuthProvider>');
  return ctx;
}
