// hooks/useProducts.ts
// Hook CRUD untuk manajemen master data produk

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface ProductFormData {
  name:           string;
  sku:            string;
  categoryId:     number | '';
  brandId:        number | '';
  printerModelId: number | '';
  color:          string;
  currentStock:   number | '';
  minStock:       number | '';
  unit:           string;
  description:    string;
}

export interface ManagedProduct {
  id:             number;
  name:           string;
  sku:            string;
  categoryId:     number;
  categoryName:   string;
  brandId:        number;
  brandName:      string;
  printerModelId: number | null;
  printerModel:   string | null;
  color:          string;
  currentStock:   number;
  minStock:       number;
  unit:           string;
  description:    string;
  createdAt:      string;
  stockStatus:    'tersedia' | 'menipis' | 'habis';
  isLowStock:     boolean;
}

export interface Category    { id: number; name: string; }
export interface Brand       { id: number; name: string; }
export interface PrinterModel{ id: number; name: string; type: string; }

export type SortField = 'name' | 'sku' | 'currentStock' | 'categoryName' | 'brandName';
export type SortDir   = 'asc' | 'desc';

// ─────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Cartridge' },
  { id: 2, name: 'Toner' },
  { id: 3, name: 'Tinta Botol' },
];

export const BRANDS: Brand[] = [
  { id: 1, name: 'HP' },
  { id: 2, name: 'Canon' },
  { id: 3, name: 'Epson' },
  { id: 4, name: 'Brother' },
];

export const PRINTER_MODELS: PrinterModel[] = [
  { id: 1, name: 'HP LaserJet Pro M404dn',  type: 'Laser' },
  { id: 2, name: 'Canon PIXMA G2010',        type: 'Inkjet' },
  { id: 3, name: 'Epson L3210',              type: 'Inkjet' },
  { id: 4, name: 'Brother DCP-L2540DW',      type: 'Laser' },
];

export const UNITS = ['pcs', 'botol', 'box', 'set', 'roll'];
export const COLORS = ['Black', 'Cyan', 'Magenta', 'Yellow', 'Color', 'Lainnya'];

const MOCK_PRODUCTS: ManagedProduct[] = [
  { id:1, name:'HP 17A Black LaserJet Toner',  sku:'HP-CF217A',  categoryId:2, categoryName:'Toner',       brandId:1, brandName:'HP',      printerModelId:1, printerModel:'HP LaserJet Pro M404dn', color:'Black',   currentStock:8,  minStock:3, unit:'pcs',   description:'Toner HP Original untuk LaserJet Pro M102/M130', createdAt:'2025-01-10T09:00:00Z', stockStatus:'tersedia', isLowStock:false },
  { id:2, name:'HP 678 Black Cartridge',        sku:'HP-678-BK',  categoryId:1, categoryName:'Cartridge',   brandId:1, brandName:'HP',      printerModelId:null, printerModel:null,                   color:'Black',   currentStock:2,  minStock:3, unit:'pcs',   description:'HP 678 Ink Cartridge Black',                     createdAt:'2025-01-10T09:00:00Z', stockStatus:'menipis',  isLowStock:true  },
  { id:3, name:'Epson 664 Tinta Botol Hitam',   sku:'EPS-664-BK', categoryId:3, categoryName:'Tinta Botol', brandId:3, brandName:'Epson',   printerModelId:3, printerModel:'Epson L3210',            color:'Black',   currentStock:5,  minStock:3, unit:'botol', description:'',                                               createdAt:'2025-01-12T09:00:00Z', stockStatus:'tersedia', isLowStock:false },
  { id:4, name:'Epson 664 Tinta Botol Cyan',    sku:'EPS-664-CY', categoryId:3, categoryName:'Tinta Botol', brandId:3, brandName:'Epson',   printerModelId:3, printerModel:'Epson L3210',            color:'Cyan',    currentStock:1,  minStock:3, unit:'botol', description:'',                                               createdAt:'2025-01-12T09:00:00Z', stockStatus:'menipis',  isLowStock:true  },
  { id:5, name:'Brother TN-2380 Black Toner',   sku:'BRO-TN2380', categoryId:2, categoryName:'Toner',       brandId:4, brandName:'Brother', printerModelId:4, printerModel:'Brother DCP-L2540DW',    color:'Black',   currentStock:4,  minStock:3, unit:'pcs',   description:'',                                               createdAt:'2025-01-15T09:00:00Z', stockStatus:'tersedia', isLowStock:false },
  { id:6, name:'Canon PG-745 Black Cartridge',  sku:'CAN-PG745',  categoryId:1, categoryName:'Cartridge',   brandId:2, brandName:'Canon',   printerModelId:2, printerModel:'Canon PIXMA G2010',      color:'Black',   currentStock:3,  minStock:3, unit:'pcs',   description:'',                                               createdAt:'2025-01-18T09:00:00Z', stockStatus:'menipis',  isLowStock:true  },
  { id:7, name:'Canon CL-746 Color Cartridge',  sku:'CAN-CL746',  categoryId:1, categoryName:'Cartridge',   brandId:2, brandName:'Canon',   printerModelId:2, printerModel:'Canon PIXMA G2010',      color:'Color',   currentStock:0,  minStock:3, unit:'pcs',   description:'',                                               createdAt:'2025-01-18T09:00:00Z', stockStatus:'habis',    isLowStock:true  },
  { id:8, name:'Epson 664 Tinta Botol Magenta', sku:'EPS-664-MG', categoryId:3, categoryName:'Tinta Botol', brandId:3, brandName:'Epson',   printerModelId:3, printerModel:'Epson L3210',            color:'Magenta', currentStock:2,  minStock:3, unit:'botol', description:'',                                               createdAt:'2025-01-20T09:00:00Z', stockStatus:'menipis',  isLowStock:true  },
];

const EMPTY_FORM: ProductFormData = {
  name:'', sku:'', categoryId:'', brandId:'', printerModelId:'',
  color:'Black', currentStock:'', minStock:3, unit:'pcs', description:'',
};

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function useProducts() {
  const [products, setProducts]         = useState<ManagedProduct[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast]               = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const nextId = useRef(MOCK_PRODUCTS.length + 1);

  // ── Load ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setProducts(MOCK_PRODUCTS); setIsLoading(false); }, 400);
    return () => clearTimeout(t);
  }, []);

  const showToast = useCallback((msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const computeStatus = (stock: number, min: number): ManagedProduct['stockStatus'] =>
    stock === 0 ? 'habis' : stock <= min ? 'menipis' : 'tersedia';

  // ── CREATE ──────────────────────────────────────────────────
  const createProduct = useCallback(async (data: ProductFormData): Promise<boolean> => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 350));
    try {
      const cat   = CATEGORIES.find((c) => c.id === Number(data.categoryId));
      const brand = BRANDS.find((b) => b.id === Number(data.brandId));
      const pm    = PRINTER_MODELS.find((p) => p.id === Number(data.printerModelId));
      const stock = Number(data.currentStock) || 0;
      const min   = Number(data.minStock)     || 3;

      const newProduct: ManagedProduct = {
        id: nextId.current++,
        name: data.name.trim(),
        sku: data.sku.trim().toUpperCase(),
        categoryId:   Number(data.categoryId),
        categoryName: cat?.name   ?? '',
        brandId:      Number(data.brandId),
        brandName:    brand?.name ?? '',
        printerModelId: data.printerModelId ? Number(data.printerModelId) : null,
        printerModel:   pm?.name ?? null,
        color:       data.color,
        currentStock: stock,
        minStock:     min,
        unit:         data.unit,
        description:  data.description.trim(),
        createdAt:    new Date().toISOString(),
        stockStatus:  computeStatus(stock, min),
        isLowStock:   stock <= min,
      };

      setProducts((prev) => [newProduct, ...prev]);
      showToast(`Produk "${newProduct.name}" berhasil ditambahkan.`);
      return true;
    } catch {
      showToast('Gagal menambahkan produk.', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [showToast]);

  // ── UPDATE ──────────────────────────────────────────────────
  const updateProduct = useCallback(async (id: number, data: ProductFormData): Promise<boolean> => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 350));
    try {
      const cat   = CATEGORIES.find((c) => c.id === Number(data.categoryId));
      const brand = BRANDS.find((b) => b.id === Number(data.brandId));
      const pm    = PRINTER_MODELS.find((p) => p.id === Number(data.printerModelId));
      const stock = Number(data.currentStock) || 0;
      const min   = Number(data.minStock)     || 3;

      setProducts((prev) => prev.map((p) =>
        p.id !== id ? p : {
          ...p,
          name:          data.name.trim(),
          sku:           data.sku.trim().toUpperCase(),
          categoryId:    Number(data.categoryId),
          categoryName:  cat?.name   ?? p.categoryName,
          brandId:       Number(data.brandId),
          brandName:     brand?.name ?? p.brandName,
          printerModelId: data.printerModelId ? Number(data.printerModelId) : null,
          printerModel:   pm?.name ?? null,
          color:         data.color,
          currentStock:  stock,
          minStock:      min,
          unit:          data.unit,
          description:   data.description.trim(),
          stockStatus:   computeStatus(stock, min),
          isLowStock:    stock <= min,
        }
      ));
      showToast(`Produk "${data.name}" berhasil diperbarui.`);
      return true;
    } catch {
      showToast('Gagal memperbarui produk.', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [showToast]);

  // ── DELETE ──────────────────────────────────────────────────
  const deleteProduct = useCallback(async (id: number): Promise<boolean> => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 300));
    try {
      const target = products.find((p) => p.id === id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast(`Produk "${target?.name}" berhasil dihapus.`);
      return true;
    } catch {
      showToast('Gagal menghapus produk.', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [products, showToast]);

  return {
    products, isLoading, isSubmitting, toast,
    createProduct, updateProduct, deleteProduct,
    EMPTY_FORM,
  };
}
