// components/dashboard/TransactionHistoryPage.tsx
// Halaman Riwayat Pengambilan Barang dengan fitur:
// - Tabel: Siapa, Produk apa, Tanggal berapa, Departemen mana
// - Filter: Tipe, Pencarian, Rentang tanggal
// - Export: Unduh Excel satu klik (SheetJS/xlsx)

'use client';

import { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useTransactionHistory, type FilterType, type RawTransaction } from '@/hooks/useTransactionHistory';
import { exportTransactionHistory, type TransactionRow } from '@/lib/exportExcel';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
  });
}

// ─────────────────────────────────────────────────────────────
// JENIS BADGE
// ─────────────────────────────────────────────────────────────

function JenisBadge({ jenis }: { jenis: 'MASUK' | 'KELUAR' }) {
  return jenis === 'MASUK' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
      Masuk
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 5v14M5 12l7 7 7-7"/>
      </svg>
      Keluar
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// AVATAR INITIALS
// ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-yellow-100 text-yellow-700',
];

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
  const colorIdx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[colorIdx]}`}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SKELETON ROW
// ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-slate-50">
          {Array.from({ length: 7 }).map((__, j) => (
            <td key={j} className="px-5 py-3.5">
              <div className="h-3.5 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + (j * 13) % 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <tr>
      <td colSpan={8} className="py-16 text-center">
        <div className="flex flex-col items-center gap-2">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
          </svg>
          <p className="text-sm font-medium text-slate-500">
            {hasFilter ? 'Tidak ada data yang cocok' : 'Belum ada riwayat pengambilan'}
          </p>
          {hasFilter && (
            <p className="text-xs text-slate-400">Coba ubah filter atau rentang tanggal</p>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
// STATS STRIP
// ─────────────────────────────────────────────────────────────

function StatsStrip({ transactions }: { transactions: RawTransaction[] }) {
  const keluar   = transactions.filter((t) => t.jenis === 'KELUAR');
  const totalQty = keluar.reduce((s, t) => s + t.quantity, 0);
  const depts    = new Set(keluar.map((t) => t.department?.name)).size;
  const products = new Set(keluar.map((t) => t.product.name)).size;

  const stats = [
    { label: 'Total Transaksi', value: keluar.length, color: 'text-slate-900' },
    { label: 'Total Item Diambil', value: totalQty, color: 'text-blue-600' },
    { label: 'Departemen Aktif', value: depts, color: 'text-violet-600' },
    { label: 'Jenis Produk', value: products, color: 'text-emerald-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-xl p-3.5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <p className="text-xs text-slate-400 font-medium">{s.label}</p>
          <p className={`text-xl font-mono font-bold mt-0.5 ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EXPORT BUTTON (with loading state)
// ─────────────────────────────────────────────────────────────

function ExportButton({ onClick, disabled, count }: { onClick: () => void; disabled: boolean; count: number }) {
  const [exporting, setExporting] = useState(false);

  const handleClick = async () => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 300)); // beri waktu render
    onClick();
    setTimeout(() => setExporting(false), 800);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || exporting || count === 0}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
      title={count === 0 ? 'Tidak ada data untuk diekspor' : `Ekspor ${count} baris ke Excel`}
    >
      {exporting ? (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 11-18 0" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      )}
      <span className="hidden sm:inline">
        {exporting ? 'Menyiapkan...' : `Unduh Excel${count > 0 ? ` (${count})` : ''}`}
      </span>
      <span className="sm:hidden">Excel</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// FILTER BAR
// ─────────────────────────────────────────────────────────────

const TYPE_TABS: { label: string; value: FilterType }[] = [
  { label: 'Semua', value: 'semua' },
  { label: '↓ Keluar', value: 'keluar' },
  { label: '↑ Masuk', value: 'masuk' },
];

interface FilterBarProps {
  filterType: FilterType;
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
  onType: (t: FilterType) => void;
  onSearch: (s: string) => void;
  onDateFrom: (d: string) => void;
  onDateTo: (d: string) => void;
  shownCount: number;
  totalCount: number;
  onExport: () => void;
  isLoading: boolean;
}

function FilterBar({
  filterType, searchQuery, dateFrom, dateTo,
  onType, onSearch, onDateFrom, onDateTo,
  shownCount, totalCount, onExport, isLoading,
}: FilterBarProps) {
  return (
    <div className="px-5 pt-4 pb-3 border-b border-slate-100 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-900">Riwayat Pengambilan</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Menampilkan {shownCount} dari {totalCount} transaksi
          </p>
        </div>
        <ExportButton onClick={onExport} disabled={isLoading} count={shownCount} />
      </div>

      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Type tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {TYPE_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => onType(value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                filterType === value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari nama, produk, departemen..."
            className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg w-full text-slate-800 bg-slate-50 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
          />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFrom(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 bg-slate-50 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
          />
          <span className="text-xs text-slate-400">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateTo(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 bg-slate-50 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TRANSACTION ROW (desktop)
// ─────────────────────────────────────────────────────────────

function TxRow({ t }: { t: RawTransaction }) {
  const date = t.takenDate ?? t.createdAt;
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
      {/* Tanggal */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <p className="text-xs font-semibold text-slate-900">{fmtDate(date)}</p>
        <p className="text-xs text-slate-400 font-mono">{fmtTime(date)}</p>
      </td>
      {/* Pengambil */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Avatar name={t.takenBy} />
          <span className="text-xs font-semibold text-slate-900 whitespace-nowrap">{t.takenBy}</span>
        </div>
      </td>
      {/* Produk */}
      <td className="px-5 py-3.5">
        <p className="text-xs font-semibold text-slate-900 max-w-[200px] truncate" title={t.product.name}>
          {t.product.name}
        </p>
        <p className="text-xs text-slate-400 font-mono">{t.product.sku}</p>
      </td>
      {/* Jumlah */}
      <td className="px-5 py-3.5 text-center">
        <span className={`inline-block font-mono font-bold text-sm px-2 py-0.5 rounded-lg ${
          t.jenis === 'KELUAR'
            ? 'bg-blue-50 text-blue-700'
            : 'bg-emerald-50 text-emerald-700'
        }`}>
          {t.jenis === 'KELUAR' ? '-' : '+'}{t.quantity}
        </span>
        <p className="text-xs text-slate-400 mt-0.5">{t.product.unit}</p>
      </td>
      {/* Departemen */}
      <td className="px-5 py-3.5">
        <p className="text-xs font-semibold text-slate-800 whitespace-nowrap">
          {t.department?.name ?? t.pihak}
        </p>
        {t.department?.code && (
          <p className="text-xs text-slate-400 font-mono">{t.department.code}</p>
        )}
      </td>
      {/* Keperluan */}
      <td className="px-5 py-3.5">
        <p className="text-xs text-slate-600 max-w-[180px] truncate" title={t.purpose ?? '-'}>
          {t.purpose ?? <span className="text-slate-300">—</span>}
        </p>
      </td>
      {/* Jenis */}
      <td className="px-5 py-3.5">
        <JenisBadge jenis={t.jenis} />
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────
// MOBILE CARD
// ─────────────────────────────────────────────────────────────

function MobileCard({ t }: { t: RawTransaction }) {
  const date = t.takenDate ?? t.createdAt;
  return (
    <div className="px-4 py-4 border-b border-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <Avatar name={t.takenBy} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900">{t.takenBy}</p>
            <p className="text-xs text-slate-400 mt-0.5">{t.department?.name ?? t.pihak}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <JenisBadge jenis={t.jenis} />
          <span className={`font-mono text-sm font-bold ${t.jenis === 'KELUAR' ? 'text-blue-600' : 'text-emerald-600'}`}>
            {t.jenis === 'KELUAR' ? '-' : '+'}{t.quantity} {t.product.unit}
          </span>
        </div>
      </div>
      <div className="mt-2.5 pl-9 space-y-1">
        <p className="text-xs font-medium text-slate-700 truncate">{t.product.name}</p>
        <p className="text-xs text-slate-400 font-mono">{t.product.sku}</p>
        {t.purpose && (
          <p className="text-xs text-slate-500 truncate">📋 {t.purpose}</p>
        )}
        <p className="text-xs text-slate-400">{fmtDate(date)} · {fmtTime(date)}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────

export default function TransactionHistoryPage() {
  const {
    filteredTransactions,
    transactions,
    isLoading,
    error,
    filterType, setFilterType,
    searchQuery, setSearchQuery,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    refetch,
    toExportRows,
  } = useTransactionHistory();

  // Export handler
  const handleExport = () => {
    const rows: TransactionRow[] = toExportRows();
    if (rows.length === 0) return;
    exportTransactionHistory(rows);
  };

  const hasFilter = !!(searchQuery || dateFrom || dateTo || filterType !== 'semua');

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar alertCount={0} />

      <main className="flex-1 sm:ml-56">
        {/* Mobile top padding */}
        <div className="sm:hidden h-14" />

        {/* ── Header ────────────────────────────────── */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
          <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Riwayat Pengambilan</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={refetch}
              disabled={isLoading}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLoading ? 'animate-spin' : ''}>
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
          </div>
        </header>

        <div className="px-4 sm:px-6 py-5 space-y-4 max-w-7xl mx-auto">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-red-500">⚠</span>
              <p className="text-sm text-red-700 flex-1">{error}</p>
              <button onClick={refetch} className="text-xs font-semibold text-red-700 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-100">
                Coba Lagi
              </button>
            </div>
          )}

          {/* Stats strip */}
          {!isLoading && <StatsStrip transactions={filteredTransactions} />}

          {/* Main table card */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06)' }}>

            <FilterBar
              filterType={filterType}
              searchQuery={searchQuery}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onType={setFilterType}
              onSearch={setSearchQuery}
              onDateFrom={setDateFrom}
              onDateTo={setDateTo}
              shownCount={filteredTransactions.length}
              totalCount={transactions.length}
              onExport={handleExport}
              isLoading={isLoading}
            />

            {/* ── DESKTOP TABLE ─────────────────────── */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    {['Tanggal', 'Pengambil', 'Produk', 'Jumlah', 'Departemen', 'Keperluan', 'Jenis'].map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <SkeletonRows />
                  ) : filteredTransactions.length === 0 ? (
                    <EmptyState hasFilter={hasFilter} />
                  ) : (
                    filteredTransactions.map((t) => <TxRow key={t.id} t={t} />)
                  )}
                </tbody>
              </table>
            </div>

            {/* ── MOBILE CARDS ──────────────────────── */}
            <div className="sm:hidden">
              {isLoading ? (
                <div className="divide-y divide-slate-100">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="px-4 py-4 space-y-2">
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 animate-pulse" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-slate-100 rounded animate-pulse w-32" />
                          <div className="h-2.5 bg-slate-100 rounded animate-pulse w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="text-sm text-slate-400">
                    {hasFilter ? 'Tidak ada data yang cocok' : 'Belum ada riwayat'}
                  </p>
                </div>
              ) : (
                filteredTransactions.map((t) => <MobileCard key={t.id} t={t} />)
              )}
            </div>

          </div>

          {/* Export hint */}
          {!isLoading && filteredTransactions.length > 0 && (
            <p className="text-xs text-center text-slate-400 pb-2">
              Klik <strong>Unduh Excel</strong> untuk mengekspor {filteredTransactions.length} baris data ke file .xlsx dengan 2 sheet (Riwayat + Ringkasan Departemen)
            </p>
          )}

        </div>
      </main>
    </div>
  );
}
