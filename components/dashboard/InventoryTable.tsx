// components/dashboard/InventoryTable.tsx
// Tabel stok interaktif dengan filter brand & search

'use client';

import type { Product, BrandFilter, FilterState } from '@/types/inventory';

// ─────────────────────────────────────────────────────────────
// COLOR DOT
// ─────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  Black:   '#1e1e2e',
  Cyan:    '#0ea5e9',
  Magenta: '#ec4899',
  Yellow:  '#f59e0b',
  Color:   'linear-gradient(135deg,#0ea5e9 0%,#ec4899 50%,#f59e0b 100%)',
};

function ColorDot({ color }: { color: string | null }) {
  if (!color) return null;
  return (
    <span
      title={color}
      className="inline-block w-2 h-2 rounded-full flex-shrink-0 border border-black/10"
      style={{ background: COLOR_MAP[color] ?? '#888' }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  tersedia: 'bg-emerald-50 text-emerald-700',
  menipis:  'bg-orange-50  text-orange-600',
  habis:    'bg-red-50     text-red-600',
};
const BADGE_LABELS = {
  tersedia: 'Tersedia',
  menipis:  'Menipis',
  habis:    'Habis',
};

function StatusBadge({ status }: { status: Product['stockStatus'] }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${BADGE_STYLES[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {BADGE_LABELS[status]}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// MINI STOCK BAR
// ─────────────────────────────────────────────────────────────
function StockBar({ current, min }: { current: number; min: number }) {
  const pct = Math.min(100, (current / Math.max(min * 3, 1)) * 100);
  const color =
    current === 0 ? '#ef4444' :
    current <= min ? '#f97316' :
    '#10b981';
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm font-bold text-slate-900 w-6 text-right">{current}</span>
      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FILTER PILLS
// ─────────────────────────────────────────────────────────────
const BRANDS: { label: string; value: BrandFilter }[] = [
  { label: 'Semua',   value: 'all' },
  { label: 'HP',      value: 'HP' },
  { label: 'Canon',   value: 'Canon' },
  { label: 'Epson',   value: 'Epson' },
  { label: 'Brother', value: 'Brother' },
];

interface FilterBarProps {
  filters: FilterState;
  totalShown: number;
  totalAll: number;
  onBrand: (b: BrandFilter) => void;
  onSearch: (s: string) => void;
  onLowStock: () => void;
}

function FilterBar({ filters, totalShown, totalAll, onBrand, onSearch, onLowStock }: FilterBarProps) {
  return (
    <div className="px-5 pt-4 pb-3 border-b border-slate-100 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-900">Ketersediaan Stok</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Menampilkan {totalShown} dari {totalAll} item
          </p>
        </div>
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Cari nama, SKU, model printer..."
            className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg w-full sm:w-52 text-slate-800 bg-slate-50 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
          />
        </div>
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-2">
        {BRANDS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => onBrand(value)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
              filters.brand === value && !filters.showLowOnly
                ? 'bg-slate-900 text-[#b5ff47] border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={onLowStock}
          className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
            filters.showLowOnly
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50'
          }`}
        >
          ⚠ Stok Menipis
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="py-14 text-center">
      <svg className="mx-auto text-slate-300 mb-3" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <p className="text-sm font-medium text-slate-500">Tidak ada item ditemukan</p>
      <p className="text-xs text-slate-400 mt-1">Coba ubah filter atau kata pencarian</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN TABLE COMPONENT
// ─────────────────────────────────────────────────────────────
interface InventoryTableProps {
  products: Product[];
  allProducts: Product[];
  filters: FilterState;
  onBrand: (b: BrandFilter) => void;
  onSearch: (s: string) => void;
  onLowStock: () => void;
  onTakeStock: (product: Product) => void;
}

export default function InventoryTable({
  products,
  allProducts,
  filters,
  onBrand,
  onSearch,
  onLowStock,
  onTakeStock,
}: InventoryTableProps) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06)' }}
    >
      <FilterBar
        filters={filters}
        totalShown={products.length}
        totalAll={allProducts.length}
        onBrand={onBrand}
        onSearch={onSearch}
        onLowStock={onLowStock}
      />

      {products.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ── DESKTOP TABLE ─────────────────── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {['Produk / SKU', 'Kategori', 'Brand', 'Printer', 'Stok', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <ColorDot color={p.color} />
                        <div>
                          <p className="text-xs font-semibold text-slate-900 leading-snug max-w-[180px] truncate">{p.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">{p.category.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {p.brand.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[140px]">
                      <span className="truncate block" title={p.printerModel?.name}>
                        {p.printerModel?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <StockBar current={p.currentStock} min={p.minStock} />
                        <span className="text-xs text-slate-400">{p.unit}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={p.stockStatus} />
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => onTakeStock(p)}
                        disabled={p.currentStock === 0}
                        className="text-xs font-semibold border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-900 hover:text-[#b5ff47] hover:border-slate-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Ambil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE CARDS ──────────────────── */}
          <div className="sm:hidden divide-y divide-slate-100">
            {products.map((p) => (
              <div key={p.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <ColorDot color={p.color} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 leading-snug">{p.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {p.sku} · {p.brand.name} · {p.category.name}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={p.stockStatus} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-base font-bold text-slate-900">{p.currentStock}</span>
                    <span className="text-xs text-slate-400">{p.unit}</span>
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (p.currentStock / Math.max(p.minStock * 3, 1)) * 100)}%`,
                          background: p.currentStock === 0 ? '#ef4444' : p.isLowStock ? '#f97316' : '#10b981',
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => onTakeStock(p)}
                    disabled={p.currentStock === 0}
                    className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-900 hover:text-[#b5ff47] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Ambil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
