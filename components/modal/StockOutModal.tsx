'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Product = {
  id: number;
  name: string;
  sku: string;
  brand: string;
  currentStock: number;
  minStock: number;
  unit: string;
  harga: number;
};

type StockOutModalProps = {
  isOpen: boolean;
  products: Product[];
  selectedProduct: Product | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
};

export default function StockOutModal({
  isOpen,
  selectedProduct,
  isSubmitting,
  onClose,
  onSubmit,
}: StockOutModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!selectedProduct) return null;

  const handleSubmit = () => {
    if (quantity < 1 || quantity > selectedProduct.currentStock) {
      alert('Jumlah tidak valid!');
      return;
    }
    onSubmit({
      productId: selectedProduct.id,
      quantity: quantity,
    });
    setQuantity(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pengambilan Stok</DialogTitle>
          <DialogDescription>
            {selectedProduct.name} • {selectedProduct.sku}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div>
            <Label>Stok Tersedia</Label>
            <p className="text-3xl font-bold">{selectedProduct.currentStock} {selectedProduct.unit}</p>
          </div>

          <div>
            <Label htmlFor="qty">Jumlah yang diambil</Label>
            <Input
              id="qty"
              type="number"
              min={1}
              max={selectedProduct.currentStock}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="text-center text-2xl"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Ambil'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}