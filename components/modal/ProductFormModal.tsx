// components/modal/ProductFormModal.tsx
// Modal Tambah / Edit Produk menggunakan shadcn Dialog

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  type ProductFormData, type ManagedProduct,
  CATEGORIES, BRANDS, PRINTER_MODELS, UNITS, COLORS,
} from '@/hooks/useProducts';

// ─────────────────────────────────────────────────────────────
// FIELD WRAPPER
// ─────────────────────────────────────────────────────────────

function Field({ htmlFor, label, required, error, hint, children }: {
  htmlFor: string; label: string; required?: boolean;
  error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint  && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>{error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLED SELECT
// ─────────────────────────────────────────────────────────────

function ShadSelect({ id, value, onChange, hasError, children }: {
  id: string; value: string | number; onChange: (v: string) => void;
  hasError?: boolean; children: React.ReactNode;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
      className={[
        'flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 transition-colors',
        hasError ? 'border-red-400 bg-red-50' : 'border-input hover:border-slate-400',
      ].join(' ')}
    >
      {children}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────
// COLOR DOT PICKER
// ─────────────────────────────────────────────────────────────

const COLOR_HEX: Record<string, string> = {
  Black: '#1e293b', Cyan: '#0ea5e9', Magenta: '#ec4899',
  Yellow: '#f59e0b', Color: 'linear-gradient(135deg,#0ea5e9,#ec4899,#f59e0b)', Lainnya: '#94a3b8',
};

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)}
          title={c}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
            value === c
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 text-slate-600 hover:border-slate-400'
          }`}
        >
          <span className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10"
            style={{ background: COLOR_HEX[c] ?? '#94a3b8' }} />
          {c}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────

interface ProductFormModalProps {
  mode:         'create' | 'edit';
  isOpen:       boolean;
  product:      ManagedProduct | null;   // untuk mode edit
  emptyForm:    ProductFormData;
  isSubmitting: boolean;
  onClose:      () => void;
  onCreate:     (data: ProductFormData) => Promise<boolean>;
  onUpdate:     (id: number, data: ProductFormData) => Promise<boolean>;
}

type Errors = Partial<Record<keyof ProductFormData, string>>;

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function ProductFormModal({
  mode, isOpen, product, emptyForm, isSubmitting, onClose, onCreate, onUpdate,
}: ProductFormModalProps) {
  const [form, setForm]     = useState<ProductFormData>(emptyForm);
  const [errors, setErrors] = useState<Errors>({});

  // ── Init form ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && product) {
      setForm({
        name:           product.name,
        sku:            product.sku,
        categoryId:     product.categoryId,
        brandId:        product.brandId,
        printerModelId: product.printerModelId ?? '',
        color:          product.color,
        currentStock:   product.currentStock,
        minStock:       product.minStock,
        unit:           product.unit,
        description:    product.description,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [isOpen, mode, product, emptyForm]);

  const set = <K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));
  const clrErr = (k: keyof ProductFormData) =>
    setErrors((prev) => ({ ...prev, [k]: undefined }));

  // ── Validate ────────────────────────────────────────────────
  function validate(): boolean {
    const e: Errors = {};
    if (!form.name.trim())       e.name       = 'Nama produk wajib diisi';
    if (!form.sku.trim())        e.sku        = 'SKU wajib diisi';
    if (!form.categoryId)        e.categoryId = 'Pilih kategori';
    if (!form.brandId)           e.brandId    = 'Pilih brand';
    if (form.currentStock === '') e.currentStock = 'Stok awal wajib diisi';
    if (form.minStock === '')    e.minStock   = 'Stok minimum wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ───────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const ok = mode === 'create'
      ? await onCreate(form)
      : await onUpdate(product!.id, form);
    if (ok) onClose();
  }

  const title = mode === 'create' ? 'Tambah Produk Baru' : 'Edit Produk';
  const desc  = mode === 'create'
    ? 'Isi data produk baru yang akan ditambahkan ke inventori.'
    : `Edit data produk: ${product?.name ?? ''}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">{desc}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 py-1 max-h-[65vh] overflow-y-auto pr-1">

            {/* Nama */}
            <Field htmlFor="pf-name" label="Nama Produk" required error={errors.name}>
              <Input id="pf-name" value={form.name}
                onChange={(e) => { set('name', e.target.value); clrErr('name'); }}
                placeholder="HP 17A Black LaserJet Toner"
                className={errors.name ? 'border-red-400 bg-red-50' : ''} />
            </Field>

            {/* SKU */}
            <Field htmlFor="pf-sku" label="SKU / Kode Produk" required error={errors.sku}
              hint="Akan diubah ke UPPERCASE otomatis">
              <Input id="pf-sku" value={form.sku}
                onChange={(e) => { set('sku', e.target.value); clrErr('sku'); }}
                placeholder="HP-CF217A"
                className={`font-mono ${errors.sku ? 'border-red-400 bg-red-50' : ''}`} />
            </Field>

            {/* Kategori + Brand */}
            <div className="grid grid-cols-2 gap-3">
              <Field htmlFor="pf-cat" label="Kategori" required error={errors.categoryId}>
                <ShadSelect id="pf-cat" value={form.categoryId}
                  onChange={(v) => { set('categoryId', v ? Number(v) : ''); clrErr('categoryId'); }}
                  hasError={!!errors.categoryId}>
                  <option value="">— Pilih —</option>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </ShadSelect>
              </Field>
              <Field htmlFor="pf-brand" label="Brand" required error={errors.brandId}>
                <ShadSelect id="pf-brand" value={form.brandId}
                  onChange={(v) => { set('brandId', v ? Number(v) : ''); clrErr('brandId'); }}
                  hasError={!!errors.brandId}>
                  <option value="">— Pilih —</option>
                  {BRANDS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </ShadSelect>
              </Field>
            </div>

            {/* Model Printer */}
            <Field htmlFor="pf-pm" label="Model Printer Kompatibel">
              <ShadSelect id="pf-pm" value={form.printerModelId}
                onChange={(v) => set('printerModelId', v ? Number(v) : '')}>
                <option value="">— Semua / Tidak diketahui —</option>
                {PRINTER_MODELS.map((pm) => (
                  <option key={pm.id} value={pm.id}>{pm.name} ({pm.type})</option>
                ))}
              </ShadSelect>
            </Field>

            {/* Warna */}
            <Field htmlFor="pf-color" label="Warna">
              <ColorPicker value={form.color} onChange={(c) => set('color', c)} />
            </Field>

            {/* Stok + Min Stok + Satuan */}
            <div className="grid grid-cols-3 gap-3">
              <Field htmlFor="pf-stock" label="Stok Awal" required error={errors.currentStock}>
                <Input id="pf-stock" type="number" min={0} value={form.currentStock}
                  onChange={(e) => { set('currentStock', e.target.value !== '' ? Number(e.target.value) : ''); clrErr('currentStock'); }}
                  placeholder="0"
                  className={errors.currentStock ? 'border-red-400 bg-red-50' : ''} />
              </Field>
              <Field htmlFor="pf-min" label="Min. Stok" required error={errors.minStock}>
                <Input id="pf-min" type="number" min={1} value={form.minStock}
                  onChange={(e) => { set('minStock', e.target.value !== '' ? Number(e.target.value) : ''); clrErr('minStock'); }}
                  placeholder="3"
                  className={errors.minStock ? 'border-red-400 bg-red-50' : ''} />
              </Field>
              <Field htmlFor="pf-unit" label="Satuan">
                <ShadSelect id="pf-unit" value={form.unit} onChange={(v) => set('unit', v)}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </ShadSelect>
              </Field>
            </div>

            {/* Deskripsi */}
            <Field htmlFor="pf-desc" label="Deskripsi">
              <textarea id="pf-desc" value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Keterangan tambahan produk... (opsional)"
                rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm
                  placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1
                  focus-visible:ring-slate-900 transition-colors resize-none" />
            </Field>

          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}
              disabled={isSubmitting} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}
              className={`w-full sm:w-auto text-white ${
                mode === 'create'
                  ? 'bg-slate-900 hover:bg-slate-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-18 0"/>
                  </svg>
                  Menyimpan...
                </span>
              ) : mode === 'create' ? '+ Simpan Produk' : '✓ Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
