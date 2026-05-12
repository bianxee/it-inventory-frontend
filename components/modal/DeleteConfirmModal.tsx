// components/modal/DeleteConfirmModal.tsx
// Modal konfirmasi hapus produk

'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ManagedProduct } from '@/hooks/useProducts';

interface Props {
  isOpen:       boolean;
  product:      ManagedProduct | null;
  isSubmitting: boolean;
  onClose:      () => void;
  onConfirm:    (id: number) => Promise<boolean>;
}

export default function DeleteConfirmModal({ isOpen, product, isSubmitting, onClose, onConfirm }: Props) {
  async function handleConfirm() {
    if (!product) return;
    const ok = await onConfirm(product.id);
    if (ok) onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </div>
            <DialogTitle className="text-sm">Hapus Produk</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 leading-relaxed">
            Anda akan menghapus produk:
            <span className="block font-semibold text-slate-800 mt-1">
              {product?.name} <span className="font-mono font-normal text-slate-500">({product?.sku})</span>
            </span>
            <span className="block mt-2 text-red-600 font-medium">
              ⚠️ Tindakan ini tidak dapat dibatalkan. Seluruh data produk akan dihapus permanen.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}
            disabled={isSubmitting} className="w-full sm:w-auto">
            Batal
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isSubmitting}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-600">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-18 0"/>
                </svg>
                Menghapus...
              </span>
            ) : 'Ya, Hapus Produk'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
