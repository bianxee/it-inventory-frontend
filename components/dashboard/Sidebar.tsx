// components/dashboard/Sidebar.tsx
// Sidebar navigasi (desktop) & top navbar (mobile) — dengan auth

'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABEL, ROLE_COLOR } from '@/lib/auth';

interface SidebarProps { alertCount: number; }

const NAV_ITEMS = [
  { label: 'Dashboard',   href: '/',           icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { label: 'Stok Masuk',  href: '/stok-masuk', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7-7 7 7"/></svg> },
  { label: 'Stok Keluar', href: '/stok-keluar',icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7 7 7-7"/></svg> },
  { label: 'Riwayat',     href: '/riwayat',    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { label: 'Produk',      href: '/produk',     icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
];

export default function Sidebar({ alertCount }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  async function handleLogout() {
    setLoggingOut(true);
    await new Promise((r) => setTimeout(r, 300));
    logout();
    router.replace('/login');
  }

  const UserSection = () => (
    <div className="px-3 py-3 border-t border-slate-700/60">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-full bg-[#b5ff47] flex items-center justify-center text-slate-900 text-xs font-bold flex-shrink-0">
          {user?.avatar ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate">{user?.name ?? 'User'}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </div>
      </div>
      {user?.role && (
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLOR[user.role]}`}>
            {ROLE_LABEL[user.role]}
          </span>
          {user.department && <span className="text-xs text-slate-500">{user.department}</span>}
        </div>
      )}
      <button onClick={handleLogout} disabled={loggingOut}
        className="w-full flex items-center justify-center gap-2 text-xs font-medium
          text-slate-400 hover:text-white hover:bg-slate-700/60 disabled:opacity-50
          rounded-xl px-3 py-2 transition-all">
        {loggingOut
          ? <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-18 0"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
        {loggingOut ? 'Keluar...' : 'Keluar'}
      </button>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────── */}
      <aside className="hidden sm:flex flex-col w-56 bg-slate-900 text-white fixed top-0 left-0 h-full z-10">
        <div className="px-5 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#b5ff47] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="#0f172a"/><rect x="9" y="2" width="5" height="5" rx="1" fill="#0f172a"/>
                <rect x="2" y="9" width="5" height="5" rx="1" fill="#0f172a"/><rect x="9" y="9" width="5" height="5" rx="1" fill="#0f172a"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">IT Inventory</p>
              <p className="text-xs text-slate-400 mt-0.5">Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <a key={item.label} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(item.href) ? 'bg-slate-700/80 text-[#b5ff47]' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}>
              {item.icon}{item.label}
            </a>
          ))}
          <a href="/low-stock"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive('/low-stock') ? 'bg-slate-700/80 text-[#b5ff47]' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Low Stock
            {alertCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </a>
        </nav>

        <UserSection />
      </aside>

      {/* ── MOBILE TOP BAR ──────────────────────── */}
      <header className="sm:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#b5ff47] rounded-md flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="#0f172a"/><rect x="9" y="2" width="5" height="5" rx="1" fill="#0f172a"/>
              <rect x="2" y="9" width="5" height="5" rx="1" fill="#0f172a"/><rect x="9" y="9" width="5" height="5" rx="1" fill="#0f172a"/>
            </svg>
          </div>
          <span className="text-sm font-semibold">IT Inventory</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#b5ff47] flex items-center justify-center text-slate-900 text-xs font-bold">
            {user?.avatar ?? '?'}
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {mobileOpen ? <path d="M18 6L6 18M6 6l12 12"/> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-20 bg-slate-900 pt-14 flex flex-col">
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {[...NAV_ITEMS, { label: `Low Stock (${alertCount})`, href: '/low-stock', icon: <span>⚠</span> }].map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  isActive(item.href) ? 'bg-slate-700 text-[#b5ff47]' : 'text-slate-300 hover:bg-slate-700'
                }`}>
                {item.icon}{item.label}
              </a>
            ))}
          </nav>
          <div className="px-4 pb-6 border-t border-slate-700/60 pt-3">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#b5ff47] flex items-center justify-center text-slate-900 text-xs font-bold">{user?.avatar}</div>
              <div>
                <p className="text-xs font-semibold text-white">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-300
                hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-xl px-4 py-2.5 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Keluar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
