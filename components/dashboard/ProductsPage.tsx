// components/dashboard/ProductsPage.tsx
// Halaman Manajemen Produk — Tambah / Edit / Hapus

'use client';

import { useState, useMemo } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import ProductFormModal from '@/components/modal/ProductFormModal';
import DeleteConfirmModal from '@/components/modal/DeleteConfirmModal';
import { Button } from '@/components/ui/button';
import {
  useProducts,
  type ManagedProduct,
  type SortField,
  type SortDir,
  CATEGORIES,
  BRANDS,
} from '@/hooks/useProducts';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  tersedia: 'bg-emerald-50 text-emerald-700',
  menipis:  'bg-orange-50  text-orange-600',
  habis:    'bg-red-50     text-red-600',
};
const STATUS_LABEL = { tersedia: 'Tersedia', menipis: 'Menipis', habis: 'Habis' };

const COLOR_HEX: Record<string, string> = {
  Black: '#1e293b', Cyan: '#0ea5e9', Magenta: '#ec4899',
  Yellow: '#f59e0b', Color: 'linear-gradient(135deg,#0ea5e9,#ec4899,#f59e0b)', Lainnya: '#94a3b8',
};

function StatusBadge({ status }: { status: ManagedProduct['stockStatus'] }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[status]}
    </span>
  );
}

function ColorDot({ color }: { color: string }) {
  return (
    <span className="inline-block w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
      style={{ background: COLOR_HEX[color] ?? '#94a3b8' }} title={color} />
  );
}

// ─────────────────────────────────────────────────────────────
// SORT ICON
// ─────────────────────────────────────────────────────────────

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-30">
      <path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>
    </svg>
  );
  return dir === 'asc' ? (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 15l7-7 7 7"/>
    </svg>
  ) : (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M19 9l-7 7-7-7"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-slate-50">
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-3.5 bg-slate-100 rounded animate-pulse" style={{ width: `${50 + (j * 13) % 45}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl
      shadow-2xl text-xs font-medium text-white max-w-sm
      ${type === 'success' ? 'bg-slate-900' : 'bg-red-600'}`}
      style={{ animation: 'toastIn .25s ease' }}>
      <span className={type === 'success' ? 'text-[#b5ff47]' : 'text-white'}>{type === 'success' ? '✓' : '✕'}</span>
      <span className="leading-snug">{msg}</span>
      <style jsx>{`
        @keyframes toastIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STAT CARDS
// ─────────────────────────────────────────────────────────────

function ProductStats({ products }: { products: ManagedProduct[] }) {
  const total    = products.length;
  const tersedia = products.filter((p) => p.stockStatus === 'tersedia').length;
  const menipis  = products.filter((p) => p.stockStatus === 'menipis').length;
  const habis    = products.filter((p) => p.stockStatus === 'habis' || p.currentStock === 0).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Total Produk',   value: total,    color: 'text-slate-900' },
        { label: 'Stok Tersedia',  value: tersedia,  color: 'text-emerald-600' },
        { label: 'Stok Menipis',   value: menipis,   color: 'text-orange-500' },
        { label: 'Stok Habis',     value: habis,     color: 'text-red-600' },
      ].map((s) => (
        <div key={s.label} className="bg-white rounded-xl p-3.5 border border-slate-100"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <p className="text-xs text-slate-400 font-medium">{s.label}</p>
          <p className={`text-xl font-mono font-bold mt-0.5 ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function ProductsPage() {
  const {
    products, isLoading, isSubmitting, toast,
    createProduct, updateProduct, deleteProduct, EMPTY_FORM,
  } = useProducts();

  // ── Local UI state ──────────────────────────────────────────
  const [modalMode, setModalMode]           = useState<ModalMode>(null);
  const [activeProduct, setActiveProduct]   = useState<ManagedProduct | null>(null);
  const [search, setSearch]                 = useState('');
  const [filterCategory, setFilterCategory] = useState<number | 'all'>('all');
  const [filterBrand, setFilterBrand]       = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus]     = useState<string>('all');
  const [sortField, setSortField]           = useState<SortField>('name');
  const [sortDir, setSortDir]               = useState<SortDir>('asc');

  // ── Handlers ────────────────────────────────────────────────
  const openCreate = () => { setActiveProduct(null); setModalMode('create'); };
  const openEdit   = (p: ManagedProduct) => { setActiveProduct(p); setModalMode('edit'); };
  const openDelete = (p: ManagedProduct) => { setActiveProduct(p); setModalMode('delete'); };
  const closeModal = () => { setModalMode(null); setActiveProduct(null); };

  function toggleSort(field: SortField) {
    if (field === sortField) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  // ── Filtered + sorted data ──────────────────────────────────
  const displayed = useMemo(() => {
    let list = products.filter((p) => {
      if (filterCategory !== 'all' && p.categoryId !== filterCategory) return false;
      if (filterBrand    !== 'all' && p.brandId    !== filterBrand)    return false;
      if (filterStatus   !== 'all' && p.stockStatus !== filterStatus)  return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)  ||
          p.brandName.toLowerCase().includes(q) ||
          (p.printerModel ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });

    list.sort((a, b) => {
      let va: string | number = a[sortField] ?? '';
      let vb: string | number = b[sortField] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

    return list;
  }, [products, filterCategory, filterBrand, filterStatus, search, sortField, sortDir]);

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar alertCount={products.filter((p) => p.isLowStock).length} />

      <main className="flex-1 sm:ml-56">
        <div className="sm:hidden h-14" />

        {/* Header */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
          <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Manajemen Produk</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>
            <Button onClick={openCreate}
              className="bg-slate-900 hover:bg-slate-700 text-[#b5ff47] text-xs gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah Produk
            </Button>
          </div>
        </header>

        <div className="px-4 sm:px-6 py-5 space-y-5 max-w-7xl mx-auto">

          {/* Stats */}
          {!isLoading && <ProductStats products={products} />}

          {/* Table card */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06)' }}>

            {/* Filters */}
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-slate-900">Daftar Produk</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {displayed.length} dari {products.length} produk
                  </p>
                </div>
                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama, SKU, brand..."
                    className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg w-full sm:w-52
                      bg-slate-50 focus:outline-none focus:border-slate-900 focus:ring-2
                      focus:ring-slate-900/10 transition-all text-slate-800" />
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap gap-2">
                {/* Kategori */}
                <select value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700
                    focus:outline-none focus:border-slate-900 transition-colors">
                  <option value="all">Semua Kategori</option>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                {/* Brand */}
                <select value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700
                    focus:outline-none focus:border-slate-900 transition-colors">
                  <option value="all">Semua Brand</option>
                  {BRANDS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>

                {/* Status */}
                {(['all','tersedia','menipis','habis'] as const).map((s) => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      filterStatus === s
                        ? 'bg-slate-900 text-[#b5ff47] border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}>
                    {s === 'all' ? 'Semua Status' : STATUS_LABEL[s]}
                  </button>
                ))}

                {/* Reset */}
                {(search || filterCategory !== 'all' || filterBrand !== 'all' || filterStatus !== 'all') && (
                  <button onClick={() => { setSearch(''); setFilterCategory('all'); setFilterBrand('all'); setFilterStatus('all'); }}
                    className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5 transition-colors underline underline-offset-2">
                    Reset filter
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    {[
                      { label: 'Produk / SKU',  field: 'name'         as SortField },
                      { label: 'Kategori',       field: 'categoryName' as SortField },
                      { label: 'Brand',          field: 'brandName'    as SortField },
                      { label: 'Model Printer',  field: null },
                      { label: 'Stok',           field: 'currentStock' as SortField },
                      { label: 'Status',         field: null },
                      { label: 'Aksi',           field: null },
                    ].map(({ label, field }) => (
                      <th key={label}
                        className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap ${field ? 'cursor-pointer hover:text-slate-700 select-none' : ''}`}
                        onClick={() => field && toggleSort(field)}>
                        <span className="flex items-center gap-1">
                          {label}
                          {field && <SortIcon field={field} current={sortField} dir={sortDir} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? <TableSkeleton /> :
                  displayed.length === 0 ? (
                    <tr><td colSpan={7} className="py-14 text-center text-sm text-slate-400">
                      Tidak ada produk ditemukan
                    </td></tr>
                  ) : displayed.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <ColorDot color={p.color} />
                          <div>
                            <p className="text-xs font-semibold text-slate-900 max-w-[200px] truncate">{p.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{p.categoryName}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {p.brandName}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 max-w-[140px]">
                        <span className="truncate block" title={p.printerModel ?? ''}>
                          {p.printerModel ?? <span className="text-slate-300">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-sm text-slate-900">{p.currentStock}</span>
                          <span className="text-xs text-slate-400">{p.unit}</span>
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${Math.min(100,(p.currentStock/Math.max(p.minStock*3,1))*100)}%`,
                              background: p.currentStock===0 ? '#ef4444' : p.isLowStock ? '#f97316' : '#22c55e',
                            }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={p.stockStatus} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {/* Edit */}
                          <button onClick={() => openEdit(p)} title="Edit produk"
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          {/* Delete */}
                          <button onClick={() => openDelete(p)} title="Hapus produk"
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {displayed.map((p) => (
                <div key={p.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <ColorDot color={p.color} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 leading-snug">{p.name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {p.sku} · {p.brandName} · {p.categoryName}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={p.stockStatus} />
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900">{p.currentStock}</span>
                      <span className="text-xs text-slate-400">{p.unit}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)}
                        className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => openDelete(p)}
                        className="text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>

      {/* Modals */}
      <ProductFormModal
        mode={modalMode === 'edit' ? 'edit' : 'create'}
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        product={activeProduct}
        emptyForm={EMPTY_FORM}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onCreate={createProduct}
        onUpdate={updateProduct}
      />
      <DeleteConfirmModal
        isOpen={modalMode === 'delete'}
        product={activeProduct}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onConfirm={deleteProduct}
      />

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
