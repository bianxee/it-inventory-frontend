// components/dashboard/LowStockPage.tsx
// Halaman Low Stock Alert — item kritis + rekomendasi pengadaan

'use client';

import { useState, useMemo } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import { exportStockData } from '@/lib/exportExcel';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type StockLevel = 'habis' | 'kritis' | 'menipis';

interface LowStockItem {
  id:           number;
  name:         string;
  sku:          string;
  kategori:     string;
  brand:        string;
  printerModel: string | null;
  color:        string;
  currentStock: number;
  minStock:     number;
  unit:         string;
  level:        StockLevel;
  kekurangan:   number;
  rekQty:       number;      // rekomendasi jumlah pengadaan
  lastSupplier: string;
}

// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────

const MOCK_LOW_STOCK: LowStockItem[] = [
  {
    id: 7, name: 'Canon CL-746 Color Cartridge', sku: 'CAN-CL746',
    kategori: 'Cartridge', brand: 'Canon', printerModel: 'Canon PIXMA G2010',
    color: 'Color', currentStock: 0, minStock: 3, unit: 'pcs',
    level: 'habis', kekurangan: 3, rekQty: 6, lastSupplier: 'Toko Printer Jaya',
  },
  {
    id: 4, name: 'Epson 664 Tinta Botol Cyan', sku: 'EPS-664-CY',
    kategori: 'Tinta Botol', brand: 'Epson', printerModel: 'Epson L3210',
    color: 'Cyan', currentStock: 1, minStock: 3, unit: 'botol',
    level: 'kritis', kekurangan: 2, rekQty: 6, lastSupplier: 'PT Sinar Abadi',
  },
  {
    id: 2, name: 'HP 678 Black Cartridge', sku: 'HP-678-BK',
    kategori: 'Cartridge', brand: 'HP', printerModel: null,
    color: 'Black', currentStock: 2, minStock: 3, unit: 'pcs',
    level: 'kritis', kekurangan: 1, rekQty: 6, lastSupplier: 'CV Maju Jaya',
  },
  {
    id: 8, name: 'Epson 664 Tinta Botol Magenta', sku: 'EPS-664-MG',
    kategori: 'Tinta Botol', brand: 'Epson', printerModel: 'Epson L3210',
    color: 'Magenta', currentStock: 2, minStock: 3, unit: 'botol',
    level: 'menipis', kekurangan: 1, rekQty: 6, lastSupplier: 'PT Sinar Abadi',
  },
  {
    id: 6, name: 'Canon PG-745 Black Cartridge', sku: 'CAN-PG745',
    kategori: 'Cartridge', brand: 'Canon', printerModel: 'Canon PIXMA G2010',
    color: 'Black', currentStock: 3, minStock: 3, unit: 'pcs',
    level: 'menipis', kekurangan: 0, rekQty: 6, lastSupplier: 'Toko Printer Jaya',
  },
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const COLOR_HEX: Record<string, string> = {
  Black: '#1e293b', Cyan: '#0ea5e9', Magenta: '#ec4899',
  Yellow: '#f59e0b', Color: 'linear-gradient(135deg,#0ea5e9,#ec4899,#f59e0b)',
  Lainnya: '#94a3b8',
};

const LEVEL_CONFIG = {
  habis:   { label: 'HABIS',   bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: '#ef4444', pill: 'bg-red-100 text-red-700' },
  kritis:  { label: 'KRITIS',  bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: '#f97316', pill: 'bg-orange-100 text-orange-700' },
  menipis: { label: 'MENIPIS', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: '#eab308', pill: 'bg-yellow-100 text-yellow-700' },
};

function StockBar({ current, min }: { current: number; min: number }) {
  const pct   = Math.min(100, (current / Math.max(min * 2, 1)) * 100);
  const color = current === 0 ? '#ef4444' : current <= min * 0.5 ? '#f97316' : '#eab308';
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono font-bold text-sm w-4 text-right">{current}</span>
      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-slate-400">/ {min} min</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUMMARY CARDS
// ─────────────────────────────────────────────────────────────

function SummaryCards({ items }: { items: LowStockItem[] }) {
  const habis   = items.filter((i) => i.level === 'habis').length;
  const kritis  = items.filter((i) => i.level === 'kritis').length;
  const menipis = items.filter((i) => i.level === 'menipis').length;
  const totalRek = items.reduce((s, i) => s + i.rekQty, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Stok Habis',  value: habis,    color: 'text-red-600',    bg: 'bg-red-50',    icon: '🚨' },
        { label: 'Stok Kritis', value: kritis,   color: 'text-orange-600', bg: 'bg-orange-50', icon: '⚠️' },
        { label: 'Stok Menipis',value: menipis,  color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '📉' },
        { label: 'Total Perlu Diadakan', value: `${totalRek} item`, color: 'text-violet-600', bg: 'bg-violet-50', icon: '📦' },
      ].map((s) => (
        <div key={s.label} className={`${s.bg} rounded-xl p-3.5 border border-slate-100`}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div className="flex items-center gap-1.5">
            <span className="text-base">{s.icon}</span>
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
          </div>
          <p className={`text-xl font-mono font-bold mt-1 ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ALERT BANNER (top urgent)
// ─────────────────────────────────────────────────────────────

function UrgentBanner({ items }: { items: LowStockItem[] }) {
  const habis = items.filter((i) => i.level === 'habis');
  if (habis.length === 0) return null;
  return (
    <div className="bg-red-600 rounded-xl px-4 py-3 flex items-start gap-3">
      <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div>
        <p className="text-sm font-semibold text-white">
          {habis.length} produk stok HABIS — segera lakukan pengadaan!
        </p>
        <p className="text-xs text-red-200 mt-0.5">
          {habis.map((i) => i.name).join(' • ')}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REORDER CARD (per item)
// ─────────────────────────────────────────────────────────────

function AlertCard({
  item, rekQty, onChangeRek, onOrder,
}: {
  item: LowStockItem;
  rekQty: number;
  onChangeRek: (id: number, qty: number) => void;
  onOrder: (item: LowStockItem, qty: number) => void;
}) {
  const cfg = LEVEL_CONFIG[item.level];

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 space-y-3`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 border border-black/10"
            style={{ background: COLOR_HEX[item.color] ?? '#94a3b8' }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {item.sku} · {item.brand} · {item.kategori}
            </p>
          </div>
        </div>
        <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.pill}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
          {cfg.label}
        </span>
      </div>

      {/* Stock info */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/70 rounded-lg px-3 py-2">
          <p className="text-slate-400 mb-1">Stok Saat Ini</p>
          <StockBar current={item.currentStock} min={item.minStock} />
        </div>
        <div className="bg-white/70 rounded-lg px-3 py-2">
          <p className="text-slate-400 mb-1">Info Pengadaan</p>
          <p className="font-medium text-slate-700">
            Kekurangan: <span className="font-mono font-bold text-red-600">
              {item.kekurangan > 0 ? item.kekurangan : '—'}
            </span> {item.unit}
          </p>
          {item.lastSupplier && (
            <p className="text-slate-400 mt-0.5 truncate">Supplier: {item.lastSupplier}</p>
          )}
        </div>
      </div>

      {/* Printer model */}
      {item.printerModel && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
            <path d="M6 14h12v8H6z"/>
          </svg>
          Kompatibel: {item.printerModel}
        </div>
      )}

      {/* Rekomendasi pengadaan */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/60">
        <div className="flex-1">
          <p className="text-xs text-slate-500 mb-1">Jumlah pengadaan</p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => onChangeRek(item.id, Math.max(1, rekQty - 1))}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-sm
                hover:bg-slate-50 transition-colors flex items-center justify-center">−</button>
            <input type="number" min={1} value={rekQty}
              onChange={(e) => onChangeRek(item.id, Math.max(1, Number(e.target.value)))}
              className="w-14 text-center font-mono font-bold text-sm border border-slate-200 rounded-lg
                bg-white px-1 py-1 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900/20" />
            <button onClick={() => onChangeRek(item.id, rekQty + 1)}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-sm
                hover:bg-slate-50 transition-colors flex items-center justify-center">+</button>
            <span className="text-xs text-slate-400">{item.unit}</span>
          </div>
        </div>
        <button onClick={() => onOrder(item, rekQty)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl
            transition-all text-white ${
              item.level === 'habis'
                ? 'bg-red-600 hover:bg-red-700'
                : item.level === 'kritis'
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-slate-700 hover:bg-slate-900'
            }`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12l7-7 7 7"/>
          </svg>
          Buat PO
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PO MODAL (simple)
// ─────────────────────────────────────────────────────────────

function POModal({ item, qty, onClose }: {
  item: LowStockItem; qty: number; onClose: () => void;
}) {
  const [supplier, setSupplier] = useState(item.lastSupplier);
  const [notes, setNotes]       = useState('');
  const [done, setDone]         = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDone(true);
    setTimeout(onClose, 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,10,20,.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: 'slideUp .2s ease' }}>

        {done ? (
          <div className="px-6 py-10 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-900">PO Berhasil Dibuat!</p>
            <p className="text-xs text-slate-400">
              Permintaan pengadaan {qty} {item.unit} {item.name} telah dicatat.
            </p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Buat Purchase Order</h3>
                <p className="text-xs text-slate-400 mt-0.5">{item.name}</p>
              </div>
              <button onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">
              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Produk</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">{item.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SKU</span>
                  <span className="font-mono text-slate-700">{item.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stok Saat Ini</span>
                  <span className={`font-mono font-bold ${item.currentStock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                    {item.currentStock} {item.unit}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1.5">
                  <span className="text-slate-500 font-medium">Jumlah PO</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{qty} {item.unit}</span>
                </div>
              </div>

              {/* Supplier */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Supplier</label>
                <input type="text" value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Nama supplier..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800
                    focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all" />
              </div>

              {/* Catatan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Catatan PO</label>
                <input type="text" value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Urgent, sesuai spec, dsb..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800
                    focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all" />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  Batal
                </button>
                <button type="submit"
                  className="flex-1 bg-slate-900 text-[#b5ff47] text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-700 transition-colors">
                  Konfirmasi PO
                </button>
              </div>
            </form>
          </>
        )}
      </div>
      <style jsx>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function LowStockPage() {
  const [items]      = useState<LowStockItem[]>(MOCK_LOW_STOCK);
  const [rekQtys, setRekQtys] = useState<Record<number, number>>(
    () => Object.fromEntries(MOCK_LOW_STOCK.map((i) => [i.id, i.rekQty]))
  );
  const [filterLevel, setFilterLevel] = useState<'all' | StockLevel>('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [poTarget, setPOTarget]       = useState<{ item: LowStockItem; qty: number } | null>(null);
  const [exporting, setExporting]     = useState(false);

  const brands = [...new Set(items.map((i) => i.brand))];

  const displayed = useMemo(() => items.filter((i) => {
    if (filterLevel !== 'all' && i.level !== filterLevel) return false;
    if (filterBrand !== 'all' && i.brand !== filterBrand) return false;
    return true;
  }), [items, filterLevel, filterBrand]);

  // Sort: habis → kritis → menipis, then by currentStock asc
  const sorted = useMemo(() => [...displayed].sort((a, b) => {
    const order = { habis: 0, kritis: 1, menipis: 2 };
    if (order[a.level] !== order[b.level]) return order[a.level] - order[b.level];
    return a.currentStock - b.currentStock;
  }), [displayed]);

  function handleChangeRek(id: number, qty: number) {
    setRekQtys((prev) => ({ ...prev, [id]: qty }));
  }

  function handleOrder(item: LowStockItem, qty: number) {
    setPOTarget({ item, qty });
  }

  async function handleExport() {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 300));
    try {
      exportStockData(items.map((i) => ({
        id: i.id, nama: i.name, sku: i.sku,
        kategori: i.kategori, brand: i.brand,
        modelPrinter: i.printerModel ?? '-',
        warna: i.color,
        stokSaat: i.currentStock,
        stokMinimum: i.minStock,
        satuan: i.unit,
        status: i.level === 'habis' ? 'Habis' : i.level === 'kritis' ? 'Kritis' : 'Menipis',
      })));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar alertCount={items.length} />

      <main className="flex-1 sm:ml-56">
        <div className="sm:hidden h-14" />

        {/* Header */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
          <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                Low Stock Alert
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {items.length}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>
            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200
                disabled:text-slate-400 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all">
              {exporting ? (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-18 0"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </header>

        <div className="px-4 sm:px-6 py-5 space-y-4 max-w-7xl mx-auto">

          {/* Urgent banner */}
          <UrgentBanner items={items} />

          {/* Summary cards */}
          <SummaryCards items={items} />

          {/* Filter + count */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">
                Menampilkan {sorted.length} dari {items.length} item bermasalah
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Level filter */}
              {(['all', 'habis', 'kritis', 'menipis'] as const).map((l) => (
                <button key={l} onClick={() => setFilterLevel(l)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    filterLevel === l
                      ? 'bg-slate-900 text-[#b5ff47] border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}>
                  {l === 'all' ? 'Semua' : l.charAt(0).toUpperCase() + l.slice(1)}
                </button>
              ))}
              {/* Brand filter */}
              <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}
                className="text-xs border border-slate-200 rounded-full px-3 py-1.5 bg-white text-slate-600
                  focus:outline-none focus:border-slate-900 transition-colors">
                <option value="all">Semua Brand</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Cards grid */}
          {sorted.length === 0 ? (
            <div className="bg-white rounded-2xl py-16 text-center border border-slate-100"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
              <div className="text-4xl mb-3">✅</div>
              <p className="text-sm font-semibold text-slate-700">Semua stok aman!</p>
              <p className="text-xs text-slate-400 mt-1">Tidak ada item yang perlu perhatian saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {sorted.map((item) => (
                <AlertCard key={item.id} item={item}
                  rekQty={rekQtys[item.id] ?? item.rekQty}
                  onChangeRek={handleChangeRek}
                  onOrder={handleOrder} />
              ))}
            </div>
          )}

          {/* Reorder summary table */}
          {sorted.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Ringkasan Kebutuhan Pengadaan</h2>
                <p className="text-xs text-slate-400 mt-0.5">Estimasi total item yang perlu segera diadakan</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {['Produk', 'SKU', 'Brand', 'Stok Saat Ini', 'Min. Stok', 'Rek. Pengadaan', 'Supplier', 'Aksi'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((item) => {
                      const cfg = LEVEL_CONFIG[item.level];
                      return (
                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                          <td className="px-4 py-3">
                            <p className="text-xs font-semibold text-slate-900 max-w-[160px] truncate">{item.name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-slate-500">{item.sku}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">{item.brand}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-mono font-bold text-sm ${cfg.text}`}>{item.currentStock}</span>
                            <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-slate-500">{item.minStock} {item.unit}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-slate-900">
                              {rekQtys[item.id] ?? item.rekQty}
                            </span>
                            <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">{item.lastSupplier || '—'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleOrder(item, rekQtys[item.id] ?? item.rekQty)}
                              className="text-xs font-semibold bg-slate-900 text-[#b5ff47] px-3 py-1.5 rounded-lg
                                hover:bg-slate-700 transition-colors">
                              Buat PO
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Total row */}
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">
                        TOTAL KEBUTUHAN PENGADAAN:
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {Object.values(rekQtys).reduce((s, v) => s + v, 0)} item
                        </span>
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* PO Modal */}
      {poTarget && (
        <POModal item={poTarget.item} qty={poTarget.qty} onClose={() => setPOTarget(null)} />
      )}
    </div>
  );
}
