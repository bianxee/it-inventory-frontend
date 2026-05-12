// components/dashboard/widgets/index.tsx
// Komponen widget dashboard: StatCard, StatGrid, Toast, LoadingSkeleton, ErrorBanner

'use client';

import { useEffect, useState } from 'react';
import type { Toast, DashboardStats } from '@/types/inventory';

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  unit?: string;
  icon: React.ReactNode;
  accentColor: string;       // Tailwind bg class untuk icon bg
  accentText: string;        // Tailwind text class untuk icon
  barColor: string;          // hex warna bar
  barPercent: number;        // 0-100
  dark?: boolean;            // dark card variant
}

export function StatCard({
  label, value, unit = 'unit', icon,
  accentColor, accentText, barColor, barPercent, dark,
}: StatCardProps) {
  const [displayed, setDisplayed] = useState(0);

  // Animated count-up
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 20);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      className={`relative rounded-2xl p-4 overflow-hidden ${
        dark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
      }`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest ${dark ? 'text-slate-400' : 'text-slate-400'}`}>
            {label}
          </p>
          <p className={`text-2xl font-mono font-bold mt-1 tabular-nums ${dark ? 'text-[#b5ff47]' : 'text-slate-900'}`}>
            {displayed}
          </p>
          <p className={`text-xs mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{unit} tersedia</p>
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accentColor}`}>
          <span className={accentText}>{icon}</span>
        </div>
      </div>
      {/* Progress bar */}
      <div className={`mt-3 h-1.5 rounded-full ${dark ? 'bg-slate-700' : 'bg-slate-100'}`}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${barPercent}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD STAT GRID
// ─────────────────────────────────────────────────────────────

const TonerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
  </svg>
);
const CartridgeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const InkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
  </svg>
);

interface StatGridProps {
  stats: DashboardStats;
  onLowStockClick: () => void;
}

export function StatGrid({ stats, onLowStockClick }: StatGridProps) {
  const tonerMax  = Math.max(stats.totalToner, 1);
  const cartMax   = Math.max(stats.totalCartridge, 1);
  const inkMax    = Math.max(stats.totalTintaBotol, 1);
  const totalItems = 8; // dari seed data

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        label="Total Toner" value={stats.totalToner}
        icon={<TonerIcon />}
        accentColor="bg-violet-50" accentText="text-violet-600"
        barColor="#8b5cf6" barPercent={Math.min(100, (stats.totalToner / Math.max(tonerMax, 20)) * 100)}
      />
      <StatCard
        label="Cartridge" value={stats.totalCartridge}
        icon={<CartridgeIcon />}
        accentColor="bg-emerald-50" accentText="text-emerald-600"
        barColor="#10b981" barPercent={Math.min(100, (stats.totalCartridge / Math.max(cartMax, 15)) * 100)}
      />
      <div onClick={onLowStockClick} className="cursor-pointer">
        <StatCard
          label="Stok Menipis" value={stats.lowStockCount}
          unit="perlu perhatian"
          icon={<AlertIcon />}
          accentColor="bg-red-50" accentText="text-red-500"
          barColor="#ef4444" barPercent={Math.min(100, (stats.lowStockCount / totalItems) * 100)}
        />
      </div>
      <StatCard
        label="Tinta Botol" value={stats.totalTintaBotol}
        icon={<InkIcon />}
        accentColor="bg-sky-50" accentText="text-sky-600"
        barColor="#b5ff47" barPercent={Math.min(100, (stats.totalTintaBotol / Math.max(inkMax, 12)) * 100)}
        dark
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TOAST NOTIFICATIONS
// ─────────────────────────────────────────────────────────────

const TOAST_STYLES = {
  success: { bg: 'bg-slate-900', icon: '✓', iconColor: 'text-[#b5ff47]' },
  error:   { bg: 'bg-red-600',   icon: '✕', iconColor: 'text-white' },
  warning: { bg: 'bg-orange-500',icon: '⚠', iconColor: 'text-white' },
};

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const s = TOAST_STYLES[t.type];
        return (
          <div
            key={t.id}
            className={`${s.bg} text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 max-w-xs pointer-events-auto`}
            style={{ animation: 'toastIn .25s ease' }}
          >
            <span className={`font-bold ${s.iconColor}`}>{s.icon}</span>
            <span className="leading-snug">{t.message}</span>
          </div>
        );
      })}
      <style jsx>{`
        @keyframes toastIn {
          from { opacity:0; transform: translateY(12px); }
          to   { opacity:1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOADING SKELETON
// ─────────────────────────────────────────────────────────────

function SkeletonBox({ className }: { className: string }) {
  return (
    <div className={`bg-slate-200 rounded-lg animate-pulse ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
            <SkeletonBox className="h-3 w-20 mb-3" />
            <SkeletonBox className="h-7 w-12 mb-2" />
            <SkeletonBox className="h-1.5 w-full mt-3" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <SkeletonBox className="h-4 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <SkeletonBox className="h-4 w-8" />
              <SkeletonBox className="h-4 flex-1" />
              <SkeletonBox className="h-4 w-16" />
              <SkeletonBox className="h-4 w-12" />
              <SkeletonBox className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ERROR BANNER
// ─────────────────────────────────────────────────────────────

export function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800">Gagal Memuat Data</p>
        <p className="text-xs text-red-600 mt-0.5 break-words">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="text-xs font-semibold text-red-700 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0"
      >
        Coba Lagi
      </button>
    </div>
  );
}
