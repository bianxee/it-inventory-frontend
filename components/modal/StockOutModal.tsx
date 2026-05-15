// components/modal/StockOutModal.tsx
// Modal pengambilan barang — menggunakan shadcn/ui Dialog, Input, Label, Button

'use client';

import { useState, useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import type { Product, StockOutPayload } from '@/types/inventory';

// ─────────────────────────────────────────────────────────────
// CONSTANTS — departments di-fetch dari API saat runtime
// ─────────────────────────────────────────────────────────────
const FALLBACK_DEPARTMENTS = [
  { id: 1, name: 'Information Technology', code: 'IT-001' },
  { id: 2, name: 'Finance & Accounting',   code: 'FIN-001' },
  { id: 3, name: 'Human Resources',        code: 'HR-001' },
  { id: 4, name: 'Operations',             code: 'OPS-001' },
  { id: 5, name: 'Marketing',              code: 'MKT-001' },
];

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface FormState {
  productId:    number | '';
  departmentId: number | '';
  quantity:     number | '';
  takenBy:      string;
  purpose:      string;
}

interface FormErrors {
  productId?:    string;
  departmentId?: string;
  quantity?:     string;
  takenBy?:      string;
}

interface StockOutModalProps {
  isOpen:          boolean;
  products:        Product[];
  selectedProduct: Product | null;
  isSubmitting:    boolean;
  onClose:         () => void;
  onSubmit:        (payload: StockOutPayload) => Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────
// STOCK PREVIEW BAR
// ─────────────────────────────────────────────────────────────

function StockPreviewBar({
  product,
  requestedQty,
}: {
  product:      Product;
  requestedQty: number;
}) {
  const afterQty     = Math.max(0, product.currentStock - (requestedQty || 0));
  const maxRef       = Math.max(product.minStock * 3, 1);
  const beforePct    = Math.min(100, (product.currentStock / maxRef) * 100);
  const afterPct     = Math.min(100, (afterQty / maxRef) * 100);
  const wouldBeLow   = afterQty > 0 && afterQty <= product.minStock;
  const wouldBeEmpty = afterQty === 0;

  const barColor = (qty: number) =>
    qty === 0              ? '#ef4444'
    : qty <= product.minStock ? '#f97316'
    : '#22c55e';

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs">
      <div className="flex justify-between items-center">
        <span className="text-slate-500">Stok saat ini</span>
        <span className="font-mono font-semibold text-slate-800">
          {product.currentStock} {product.unit}
        </span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${beforePct}%`, background: barColor(product.currentStock) }}
        />
      </div>

      {requestedQty > 0 && (
        <>
          <div className="flex justify-between items-center pt-1">
            <span className="text-slate-500">Setelah pengambilan</span>
            <span className={`font-mono font-semibold ${
              wouldBeEmpty ? 'text-red-600' : wouldBeLow ? 'text-orange-500' : 'text-green-600'
            }`}>
              {afterQty} {product.unit}
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${afterPct}%`, background: barColor(afterQty) }}
            />
          </div>
          {(wouldBeLow || wouldBeEmpty) && (
            <p className={`font-medium pt-0.5 ${wouldBeEmpty ? 'text-red-600' : 'text-orange-500'}`}>
              {wouldBeEmpty
                ? '⚠️ Stok akan HABIS setelah pengambilan ini'
                : `⚠️ Stok akan menipis — sisa ${afterQty} (min ${product.minStock}) ${product.unit}`}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FIELD WRAPPER  (Label + control + error hint)
// ─────────────────────────────────────────────────────────────

function Field({
  htmlFor, label, required, error, children,
}: {
  htmlFor:   string;
  label:     string;
  required?: boolean;
  error?:    string;
  children:  React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8"  x2="12"    y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SELECT (styled to match shadcn Input)
// ─────────────────────────────────────────────────────────────

function ShadSelect({
  id, value, onChange, hasError, children,
}: {
  id:       string;
  value:    string | number;
  onChange: (v: string) => void;
  hasError: boolean;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={[
        'flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm',
        'transition-colors placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        hasError
          ? 'border-red-400 bg-red-50 focus-visible:ring-red-400'
          : 'border-input hover:border-slate-400',
      ].join(' ')}
    >
      {children}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function StockOutModal({
  isOpen,
  products = [],
  selectedProduct,
  isSubmitting,
  onClose,
  onSubmit,
}: StockOutModalProps) {
  const [form, setForm]           = useState<FormState>({ productId: '', departmentId: '', quantity: '', takenBy: '', purpose: '' });
  const [errors, setErrors]       = useState<FormErrors>({});
  const [departments, setDepts]   = useState(FALLBACK_DEPARTMENTS);

  // Fetch departments dari API
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
    fetch(`${apiUrl}/departments`)
      .then((r) => r.json())
      .then((json) => { if (json.success && json.data?.length) setDepts(json.data); })
      .catch(() => {}); // gunakan fallback jika gagal
  }, []);

  // Reset setiap kali modal dibuka
  useEffect(() => {
    if (isOpen) {
      setForm({ productId: selectedProduct?.id ?? '', departmentId: '', quantity: '', takenBy: '', purpose: '' });
      setErrors({});
    }
  }, [isOpen, selectedProduct]);

  // Guard: pastikan products selalu array sebelum .find()
  const safeProducts  = Array.isArray(products) ? products : [];
  const activeProduct = safeProducts.find((p) => p.id === Number(form.productId)) ?? null;

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const clearErr = (key: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [key]: undefined }));

  // ── Validation ─────────────────────────────────────────────
  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.productId)
      e.productId = 'Pilih produk terlebih dahulu';
    else if (activeProduct?.currentStock === 0)
      e.productId = 'Stok produk ini sudah habis';

    if (!form.departmentId)
      e.departmentId = 'Pilih departemen';

    if (!form.quantity || Number(form.quantity) <= 0)
      e.quantity = 'Jumlah harus minimal 1';
    else if (activeProduct && Number(form.quantity) > activeProduct.currentStock)
      e.quantity = `Melebihi stok (${activeProduct.currentStock} ${activeProduct.unit})`;

    if (!form.takenBy.trim())
      e.takenBy = 'Nama pengambil wajib diisi';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ─────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      productId:    Number(form.productId),
      departmentId: Number(form.departmentId),
      quantity:     Number(form.quantity),
      takenBy:      form.takenBy.trim(),
      purpose:      form.purpose.trim() || undefined,
    });
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">

        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-sm">Pengambilan Barang</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Catat stok keluar ke departemen. Field bertanda{' '}
            <span className="text-red-500 font-medium">*</span> wajib diisi.
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-1">

          {/* Produk */}
          <Field htmlFor="f-product" label="Produk" required error={errors.productId}>
            <ShadSelect
              id="f-product"
              value={form.productId}
              hasError={!!errors.productId}
              onChange={(v) => {
                set('productId', v ? Number(v) : '');
                set('quantity', '');
                clearErr('productId');
              }}
            >
              <option value="">— Pilih produk —</option>
              {safeProducts.map((p) => (
                <option key={p.id} value={p.id} disabled={p.currentStock === 0}>
                  {p.name} ({p.currentStock} {p.unit})
                  {p.currentStock === 0 ? ' — Habis' : ''}
                </option>
              ))}
            </ShadSelect>
          </Field>

          {/* Stock preview */}
          {activeProduct && (
            <StockPreviewBar
              product={activeProduct}
              requestedQty={Number(form.quantity) || 0}
            />
          )}

          {/* Jumlah + Departemen */}
          <div className="grid grid-cols-2 gap-3">
            <Field htmlFor="f-qty" label="Jumlah" required error={errors.quantity}>
              <Input
                id="f-qty"
                type="number"
                min={1}
                max={activeProduct?.currentStock ?? undefined}
                value={form.quantity}
                onChange={(e) => {
                  set('quantity', e.target.value ? Number(e.target.value) : '');
                  clearErr('quantity');
                }}
                placeholder="0"
                className={errors.quantity ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : ''}
              />
            </Field>

            <Field htmlFor="f-dept" label="Departemen" required error={errors.departmentId}>
              <ShadSelect
                id="f-dept"
                value={form.departmentId}
                hasError={!!errors.departmentId}
                onChange={(v) => {
                  set('departmentId', v ? Number(v) : '');
                  clearErr('departmentId');
                }}
              >
                <option value="">— Pilih —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </ShadSelect>
            </Field>
          </div>

          {/* Nama Pengambil */}
          <Field htmlFor="f-takenby" label="Nama Pengambil" required error={errors.takenBy}>
            <Input
              id="f-takenby"
              type="text"
              value={form.takenBy}
              onChange={(e) => { set('takenBy', e.target.value); clearErr('takenBy'); }}
              placeholder="Nama lengkap"
              className={errors.takenBy ? 'border-red-400 bg-red-50 focus-visible:ring-red-400' : ''}
            />
          </Field>

          {/* Keperluan */}
          <Field htmlFor="f-purpose" label="Keperluan">
            <Input
              id="f-purpose"
              type="text"
              value={form.purpose}
              onChange={(e) => set('purpose', e.target.value)}
              placeholder="Isi toner printer lantai 2... (opsional)"
            />
          </Field>

          {/* Footer buttons */}
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-slate-900 text-[#b5ff47] hover:bg-slate-700 focus-visible:ring-slate-900"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-18 0"/>
                  </svg>
                  Menyimpan...
                </span>
              ) : 'Simpan Pengambilan'}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
