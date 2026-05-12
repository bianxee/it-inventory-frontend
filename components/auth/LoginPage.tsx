// components/auth/LoginPage.tsx
// Halaman Login IT Inventory Management

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_USERS, ROLE_LABEL, ROLE_COLOR } from '@/lib/auth';

// ─────────────────────────────────────────────────────────────
// DEMO ACCOUNTS BADGE
// ─────────────────────────────────────────────────────────────

function DemoAccounts({ onFill }: { onFill: (email: string, pw: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-dashed border-slate-300
          hover:border-slate-400 text-xs text-slate-500 hover:text-slate-700 transition-all">
        <span className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Akun Demo
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {MOCK_USERS.map((u) => (
            <button key={u.id} onClick={() => onFill(u.email, u.password)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center text-xs font-bold text-[#b5ff47]">
                  {u.avatar}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLOR[u.role]}`}>
                {ROLE_LABEL[u.role]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN LOGIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { login, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect jika sudah login
  useEffect(() => {
    if (!isLoading && isLoggedIn) router.replace('/');
  }, [isLoggedIn, isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim())    { setError('Email wajib diisi'); return; }
    if (!password.trim()) { setError('Password wajib diisi'); return; }

    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);

    if (result.success) {
      router.replace('/');
    } else {
      setError(result.error ?? 'Login gagal');
      setPassword('');
    }
  }

  function fillDemo(em: string, pw: string) {
    setEmail(em);
    setPassword(pw);
    setError('');
  }

  if (isLoading || isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── LEFT PANEL (desktop) ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#b5ff47] rounded-xl flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#0f172a"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#0f172a"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#0f172a"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#0f172a"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">IT Inventory</p>
            <p className="text-slate-400 text-xs mt-0.5">Management System</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Kelola stok<br />
              <span className="text-[#b5ff47]">cartridge & toner</span><br />
              dengan mudah
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Pantau ketersediaan, catat pengambilan, dan dapatkan peringatan stok menipis — semua dalam satu platform.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-2.5">
            {[
              'Dashboard real-time ketersediaan stok',
              'Notifikasi otomatis stok menipis',
              'Riwayat pengambilan per departemen',
              'Export laporan ke Excel',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-[#b5ff47]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#b5ff47" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span className="text-slate-300 text-xs">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-xs">© 2026 IT Inventory Management · v1.0.0</p>
      </div>

      {/* ── RIGHT PANEL (form) ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#b5ff47"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#b5ff47"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#b5ff47"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#b5ff47"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-900">IT Inventory</span>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-slate-900">Masuk ke akun Anda</h2>
            <p className="text-sm text-slate-500 mt-1">Gunakan email dan password yang terdaftar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3.5 py-2.5 rounded-xl">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Email
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input id="email" type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="budi@company.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl
                    bg-white text-slate-800 placeholder:text-slate-400
                    focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10
                    transition-all" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input id="password" type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl
                    bg-white text-slate-800 placeholder:text-slate-400
                    focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10
                    transition-all" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                  {showPw ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700
                disabled:bg-slate-300 text-white disabled:text-slate-400 font-semibold text-sm
                py-2.5 rounded-xl transition-all">
              {submitting ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-18 0"/>
                  </svg>
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>

          </form>

          {/* Demo accounts */}
          <DemoAccounts onFill={fillDemo} />

          {/* Info */}
          <p className="text-center text-xs text-slate-400">
            Hubungi IT Admin jika lupa password atau belum memiliki akses
          </p>

        </div>
      </div>
    </div>
  );
}
