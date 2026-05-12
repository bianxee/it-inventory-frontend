// hooks/useStockIn.ts
// Hook untuk halaman Stok Masuk — form + riwayat penerimaan barang

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Product } from '@/types/inventory';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface StockInRecord {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  kategori: string;
  brand: string;
  quantity: number;
  unit: string;
  receivedDate: string;
  supplier: string;
  poNumber: string;
  receivedBy: string;
  notes: string;
}

export interface StockInPayload {
  productId: number;
  quantity: number;
  receivedDate: string;
  supplier: string;
  poNumber: string;
  receivedBy: string;
  notes: string;
}

export interface StockInFormErrors {
  productId?: string;
  quantity?: string;
  receivedBy?: string;
}

// ─────────────────────────────────────────────────────────────
// MOCK PRODUCTS (sama dengan useInventory — diganti API saat backend aktif)
// ─────────────────────────────────────────────────────────────

const MOCK_PRODUCTS: Product[] = [
  { id:1, name:'HP 17A Black LaserJet Toner',  sku:'HP-CF217A',  color:'Black',   currentStock:8,  minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:2,name:'Toner'},       brand:{id:1,name:'HP'},      printerModel:{id:1,name:'HP LaserJet Pro M404dn',type:'Laser'},  stockStatus:'tersedia', isLowStock:false },
  { id:2, name:'HP 678 Black Cartridge',        sku:'HP-678-BK',  color:'Black',   currentStock:2,  minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:1,name:'Cartridge'},   brand:{id:1,name:'HP'},      printerModel:null,                                               stockStatus:'menipis',  isLowStock:true  },
  { id:3, name:'Epson 664 Tinta Botol Hitam',   sku:'EPS-664-BK', color:'Black',   currentStock:5,  minStock:3, unit:'botol', description:null, createdAt:'', updatedAt:'', category:{id:3,name:'Tinta Botol'}, brand:{id:3,name:'Epson'},   printerModel:{id:3,name:'Epson L3210',type:'Inkjet'},            stockStatus:'tersedia', isLowStock:false },
  { id:4, name:'Epson 664 Tinta Botol Cyan',    sku:'EPS-664-CY', color:'Cyan',    currentStock:1,  minStock:3, unit:'botol', description:null, createdAt:'', updatedAt:'', category:{id:3,name:'Tinta Botol'}, brand:{id:3,name:'Epson'},   printerModel:{id:3,name:'Epson L3210',type:'Inkjet'},            stockStatus:'menipis',  isLowStock:true  },
  { id:5, name:'Brother TN-2380 Black Toner',   sku:'BRO-TN2380', color:'Black',   currentStock:4,  minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:2,name:'Toner'},       brand:{id:4,name:'Brother'}, printerModel:{id:4,name:'Brother DCP-L2540DW',type:'Laser'},     stockStatus:'tersedia', isLowStock:false },
  { id:6, name:'Canon PG-745 Black Cartridge',  sku:'CAN-PG745',  color:'Black',   currentStock:3,  minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:1,name:'Cartridge'},   brand:{id:2,name:'Canon'},   printerModel:{id:2,name:'Canon PIXMA G2010',type:'Inkjet'},      stockStatus:'menipis',  isLowStock:true  },
  { id:7, name:'Canon CL-746 Color Cartridge',  sku:'CAN-CL746',  color:'Color',   currentStock:0,  minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:1,name:'Cartridge'},   brand:{id:2,name:'Canon'},   printerModel:{id:2,name:'Canon PIXMA G2010',type:'Inkjet'},      stockStatus:'habis',    isLowStock:true  },
  { id:8, name:'Epson 664 Tinta Botol Magenta', sku:'EPS-664-MG', color:'Magenta', currentStock:2,  minStock:3, unit:'botol', description:null, createdAt:'', updatedAt:'', category:{id:3,name:'Tinta Botol'}, brand:{id:3,name:'Epson'},   printerModel:{id:3,name:'Epson L3210',type:'Inkjet'},            stockStatus:'menipis',  isLowStock:true  },
];

const MOCK_STOCK_IN: StockInRecord[] = [
  { id:1, productId:1, productName:'HP 17A Black LaserJet Toner', sku:'HP-CF217A', kategori:'Toner',       brand:'HP',      quantity:10, unit:'pcs',   receivedDate:'2025-04-10T09:00:00Z', supplier:'CV Maju Jaya',     poNumber:'PO-2025-001', receivedBy:'Budi Santoso', notes:'Pengadaan Q2 2025' },
  { id:2, productId:3, productName:'Epson 664 Tinta Botol Hitam',  sku:'EPS-664-BK',kategori:'Tinta Botol', brand:'Epson',   quantity:12, unit:'botol', receivedDate:'2025-04-12T10:30:00Z', supplier:'PT Sinar Abadi',   poNumber:'PO-2025-002', receivedBy:'Budi Santoso', notes:'' },
  { id:3, productId:5, productName:'Brother TN-2380 Black Toner',  sku:'BRO-TN2380',kategori:'Toner',       brand:'Brother', quantity:5,  unit:'pcs',   receivedDate:'2025-04-20T14:00:00Z', supplier:'Toko Printer Jaya', poNumber:'PO-2025-003', receivedBy:'Rini Utami',   notes:'Stok cadangan' },
  { id:4, productId:2, productName:'HP 678 Black Cartridge',       sku:'HP-678-BK', kategori:'Cartridge',   brand:'HP',      quantity:6,  unit:'pcs',   receivedDate:'2025-05-01T08:00:00Z', supplier:'CV Maju Jaya',     poNumber:'PO-2025-004', receivedBy:'Budi Santoso', notes:'' },
];

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function useStockIn() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [records, setRecords]         = useState<StockInRecord[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const nextId = useRef(MOCK_STOCK_IN.length + 1);

  // ── Load data ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setProducts(MOCK_PRODUCTS);
      setRecords(MOCK_STOCK_IN);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // ── Auto-clear messages ──────────────────────────────────────
  useEffect(() => {
    if (!successMsg && !errorMsg) return;
    const t = setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
    return () => clearTimeout(t);
  }, [successMsg, errorMsg]);

  // ── Submit stok masuk ────────────────────────────────────────
  const submitStockIn = useCallback(async (payload: StockInPayload): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      // Coba kirim ke API
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'}/stok-masuk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setSuccessMsg(json.message ?? 'Stok masuk berhasil dicatat!');
        // re-fetch dari server
        return true;
      }
    } catch {
      // Backend offline — simulasi lokal
    }

    // ── Simulasi lokal ──────────────────────────────────────────
    await new Promise((r) => setTimeout(r, 400));
    const product = products.find((p) => p.id === payload.productId);
    if (!product) { setErrorMsg('Produk tidak ditemukan'); return false; }

    const newRecord: StockInRecord = {
      id: nextId.current++,
      productId: payload.productId,
      productName: product.name,
      sku: product.sku,
      kategori: product.category.name,
      brand: product.brand.name,
      quantity: payload.quantity,
      unit: product.unit,
      receivedDate: payload.receivedDate || new Date().toISOString(),
      supplier: payload.supplier,
      poNumber: payload.poNumber,
      receivedBy: payload.receivedBy,
      notes: payload.notes,
    };

    setRecords((prev) => [newRecord, ...prev]);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === payload.productId
          ? { ...p, currentStock: p.currentStock + payload.quantity,
              stockStatus: (p.currentStock + payload.quantity > p.minStock ? 'tersedia' : 'menipis') as Product['stockStatus'],
              isLowStock: (p.currentStock + payload.quantity) <= p.minStock }
          : p
      )
    );
    setSuccessMsg(`${payload.quantity} ${product.unit} "${product.name}" berhasil ditambahkan ke stok.`);
    return true;
  }, [products]);

  // ── Stats ────────────────────────────────────────────────────
  const stats = {
    totalPenerimaan: records.length,
    totalItemMasuk:  records.reduce((s, r) => s + r.quantity, 0),
    supplierAktif:   new Set(records.map((r) => r.supplier).filter(Boolean)).size,
    bulanIni:        records.filter((r) => {
      const d = new Date(r.receivedDate);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  return {
    products,
    records,
    isLoading,
    isSubmitting,
    successMsg,
    errorMsg,
    stats,
    submitStockIn,
  };
}
