// components/dashboard/StockInPage.tsx
// Halaman Stok Masuk — Form penerimaan barang + Riwayat

'use client';

import { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useStockIn, type StockInPayload, type StockInRecord } from '@/hooks/useStockIn';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';

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
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────
// STAT STRIP
// ─────────────────────────────────────────────────────────────

function StatsStrip({ stats }: { stats: ReturnType<typeof useStockIn>['stats'] }) {
  const items = [
    { label: 'Total Penerimaan', value: stats.totalPenerimaan, color: 'text-slate-900' },
    { label: 'Total Item Masuk', value: stats.totalItemMasuk,  color: 'text-violet-600' },
    { label: 'Supplier Aktif',   value: stats.supplierAktif,   color: 'text-emerald-600' },
    { label: 'Bulan Ini',        value: stats.bulanIni,        color: 'text-sky-600' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((s) => (
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
// FIELD WRAPPER
// ─────────────────────────────────────────────────────────────

function Field({ htmlFor, label, required, error, children }: {
  htmlFor: string; label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500 flex items-center gap-1">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>{error}
      </p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STOCK IN FORM
// ─────────────────────────────────────────────────────────────

interface FormState {
  productId:    number | '';
  quantity:     number | '';
  receivedDate: string;
  supplier:     string;
  poNumber:     string;
  receivedBy:   string;
  notes:        string;
}

const EMPTY_FORM: FormState = {
  productId: '', quantity: '', receivedDate: todayISO(),
  supplier: '', poNumber: '', receivedBy: '', notes: '',
};

function StockInForm({ products, isSubmitting, onSubmit }: {
  products: ReturnType<typeof useStockIn>['products'];
  isSubmitting: boolean;
  onSubmit: (p: StockInPayload) => Promise<boolean>;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const activeProduct = products.find((p) => p.id === Number(form.productId)) ?? null;

  function validate() {
    const e: typeof errors = {};
    if (!form.productId)            e.productId    = 'Pilih produk';
    if (!form.quantity || Number(form.quantity) < 1) e.quantity = 'Jumlah minimal 1';
    if (!form.receivedBy.trim())    e.receivedBy   = 'Nama penerima wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const ok = await onSubmit({
      productId:    Number(form.productId),
      quantity:     Number(form.quantity),
      receivedDate: form.receivedDate ? new Date(form.receivedDate).toISOString() : new Date().toISOString(),
      supplier:     form.supplier.trim(),
      poNumber:     form.poNumber.trim(),
      receivedBy:   form.receivedBy.trim(),
      notes:        form.notes.trim(),
    });
    if (ok) setForm({ ...EMPTY_FORM, receivedBy: form.receivedBy });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06)' }}>

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
            <path d="M12 5v14M5 12l7-7 7 7"/>
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Tambah Stok Masuk</h2>
          <p className="text-xs text-slate-400 mt-0.5">Catat penerimaan barang dari supplier</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">

        {/* Produk */}
        <Field htmlFor="si-product" label="Produk" required error={errors.productId}>
          <select
            id="si-product"
            value={form.productId}
            onChange={(e) => { set('productId', e.target.value ? Number(e.target.value) : ''); setErrors((err) => ({ ...err, productId: undefined })); }}
            className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 transition-colors
              ${errors.productId ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-400'}`}
          >
            <option value="">— Pilih produk —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — stok saat ini: {p.currentStock} {p.unit}
              </option>
            ))}
          </select>
        </Field>

        {/* Preview stok saat ini */}
        {activeProduct && (
          <div className={`rounded-lg px-3.5 py-2.5 flex items-center justify-between text-xs border
            ${activeProduct.isLowStock ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <span className={activeProduct.isLowStock ? 'text-orange-700' : 'text-emerald-700'}>
              {activeProduct.isLowStock ? '⚠️ Stok menipis —' : '✓ Stok saat ini:'}
            </span>
            <span className="font-mono font-bold text-slate-800">
              {activeProduct.currentStock} {activeProduct.unit}
              {form.quantity ? ` → ${activeProduct.currentStock + Number(form.quantity)} ${activeProduct.unit}` : ''}
            </span>
          </div>
        )}

        {/* Jumlah + Tanggal */}
        <div className="grid grid-cols-2 gap-3">
          <Field htmlFor="si-qty" label="Jumlah Diterima" required error={errors.quantity}>
            <Input id="si-qty" type="number" min={1} value={form.quantity}
              onChange={(e) => { set('quantity', e.target.value ? Number(e.target.value) : ''); setErrors((err) => ({ ...err, quantity: undefined })); }}
              placeholder="0"
              className={errors.quantity ? 'border-red-400 bg-red-50' : ''} />
          </Field>
          <Field htmlFor="si-date" label="Tanggal Terima">
            <Input id="si-date" type="date" value={form.receivedDate}
              onChange={(e) => set('receivedDate', e.target.value)} />
          </Field>
        </div>

        {/* Supplier + No PO */}
        <div className="grid grid-cols-2 gap-3">
          <Field htmlFor="si-supplier" label="Supplier / Vendor">
            <Input id="si-supplier" type="text" value={form.supplier}
              onChange={(e) => set('supplier', e.target.value)}
              placeholder="CV Maju Jaya..." />
          </Field>
          <Field htmlFor="si-po" label="Nomor PO">
            <Input id="si-po" type="text" value={form.poNumber}
              onChange={(e) => set('poNumber', e.target.value)}
              placeholder="PO-2025-001" />
          </Field>
        </div>

        {/* Diterima Oleh */}
        <Field htmlFor="si-by" label="Diterima Oleh" required error={errors.receivedBy}>
          <Input id="si-by" type="text" value={form.receivedBy}
            onChange={(e) => { set('receivedBy', e.target.value); setErrors((err) => ({ ...err, receivedBy: undefined })); }}
            placeholder="Nama lengkap penerima"
            className={errors.receivedBy ? 'border-red-400 bg-red-50' : ''} />
        </Field>

        {/* Catatan */}
        <Field htmlFor="si-notes" label="Catatan">
          <Input id="si-notes" type="text" value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Pengadaan Q2, urgent, dsb... (opsional)" />
        </Field>

        {/* Submit */}
        <div className="pt-1">
          <Button type="submit" disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white focus-visible:ring-emerald-600">
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-18 0"/>
                </svg>
                Menyimpan...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12l7-7 7 7"/>
                </svg>
                Simpan Stok Masuk
              </span>
            )}
          </Button>
        </div>

      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HISTORY TABLE
// ─────────────────────────────────────────────────────────────

function HistoryTable({ records, isLoading }: { records: StockInRecord[]; isLoading: boolean }) {
  const [search, setSearch] = useState('');

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.productName.toLowerCase().includes(q) ||
      r.sku.toLowerCase().includes(q) ||
      r.supplier.toLowerCase().includes(q) ||
      r.receivedBy.toLowerCase().includes(q) ||
      r.poNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06)' }}>

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-900">Riwayat Penerimaan</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {filtered.length} dari {records.length} record
          </p>
        </div>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk, supplier, PO..."
            className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg w-full sm:w-56
              text-slate-800 bg-slate-50 focus:outline-none focus:border-slate-900 focus:ring-2
              focus:ring-slate-900/10 transition-all" />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              {['Tanggal', 'Produk', 'Jumlah', 'Supplier', 'No. PO', 'Diterima Oleh', 'Catatan'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-3.5 bg-slate-100 rounded animate-pulse" style={{ width: `${55 + (j * 11) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                  Tidak ada data ditemukan
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="text-xs font-semibold text-slate-900">{fmtDate(r.receivedDate)}</p>
                    <p className="text-xs text-slate-400 font-mono">{fmtTime(r.receivedDate)}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-semibold text-slate-900 max-w-[180px] truncate">{r.productName}</p>
                    <p className="text-xs text-slate-400 font-mono">{r.sku} · {r.brand}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block bg-emerald-50 text-emerald-700 font-mono font-bold text-sm px-2 py-0.5 rounded-lg">
                      +{r.quantity}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">{r.unit}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-700">{r.supplier || <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3.5">
                    {r.poNumber
                      ? <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{r.poNumber}</span>
                      : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-700">{r.receivedBy}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[150px] truncate">
                    {r.notes || <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-slate-100">
        {filtered.map((r) => (
          <div key={r.id} className="px-4 py-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-slate-900">{r.productName}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{r.sku}</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 font-mono font-bold text-sm px-2 py-0.5 rounded-lg flex-shrink-0">
                +{r.quantity} {r.unit}
              </span>
            </div>
            <div className="mt-2 space-y-0.5">
              <p className="text-xs text-slate-500">{fmtDate(r.receivedDate)} · {r.supplier || 'Supplier tidak diketahui'}</p>
              <p className="text-xs text-slate-400">Diterima: {r.receivedBy} {r.poNumber ? `· ${r.poNumber}` : ''}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium text-white
      ${type === 'success' ? 'bg-slate-900' : 'bg-red-600'}`}
      style={{ animation: 'toastIn .25s ease' }}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span className="max-w-xs leading-snug">{msg}</span>
      <style jsx>{`
        @keyframes toastIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function StockInPage() {
  const { products, records, isLoading, isSubmitting, successMsg, errorMsg, stats, submitStockIn } = useStockIn();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar alertCount={0} />

      <main className="flex-1 sm:ml-56">
        <div className="sm:hidden h-14" />

        {/* Header */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
          <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-slate-900">Stok Masuk</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
              </p>
            </div>
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <a href="/" className="hover:text-slate-700 transition-colors">Dashboard</a>
              <span>/</span>
              <span className="text-slate-700 font-medium">Stok Masuk</span>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 py-5 space-y-5 max-w-7xl mx-auto">

          {/* Stats */}
          {!isLoading && <StatsStrip stats={stats} />}

          {/* Form + History — 2 kolom di desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Form (2/5) */}
            <div className="lg:col-span-2">
              <StockInForm
                products={products}
                isSubmitting={isSubmitting}
                onSubmit={submitStockIn}
              />
            </div>

            {/* History table (3/5) */}
            <div className="lg:col-span-3">
              <HistoryTable records={records} isLoading={isLoading} />
            </div>

          </div>

        </div>
      </main>

      {/* Toast */}
      {successMsg && <Toast msg={successMsg} type="success" />}
      {errorMsg   && <Toast msg={errorMsg}   type="error" />}
    </div>
  );
}
