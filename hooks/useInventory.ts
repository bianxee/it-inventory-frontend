// hooks/useInventory.ts
// Custom hook — data SELALU dari API backend (Railway)
// Mock data hanya digunakan jika API benar-benar tidak dapat dihubungi

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchStock, fetchAlerts, postStockOut } from '@/lib/api';
import type {
  Product,
  DashboardStats,
  FilterState,
  BrandFilter,
  Toast,
  StockOutPayload,
  AlertItem,
} from '@/types/inventory';

// ─────────────────────────────────────────────────────────────
// MOCK DATA — fallback terakhir jika API tidak tersedia sama sekali
// Tidak dipakai jika NEXT_PUBLIC_API_URL sudah diset dan server running
// ─────────────────────────────────────────────────────────────
const MOCK_PRODUCTS: Product[] = [
  { id:1, name:'HP 17A Black LaserJet Toner',  sku:'HP-CF217A',  color:'Black',   currentStock:8, minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:2,name:'Toner'},       brand:{id:1,name:'HP'},      printerModel:{id:1,name:'HP LaserJet Pro M404dn',type:'Laser'}, stockStatus:'tersedia', isLowStock:false },
  { id:2, name:'HP 678 Black Cartridge',        sku:'HP-678-BK',  color:'Black',   currentStock:2, minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:1,name:'Cartridge'},   brand:{id:1,name:'HP'},      printerModel:null,                                               stockStatus:'menipis',  isLowStock:true  },
  { id:3, name:'Epson 664 Tinta Botol Hitam',   sku:'EPS-664-BK', color:'Black',   currentStock:5, minStock:3, unit:'botol', description:null, createdAt:'', updatedAt:'', category:{id:3,name:'Tinta Botol'}, brand:{id:3,name:'Epson'},   printerModel:{id:3,name:'Epson L3210',type:'Inkjet'},            stockStatus:'tersedia', isLowStock:false },
  { id:4, name:'Epson 664 Tinta Botol Cyan',    sku:'EPS-664-CY', color:'Cyan',    currentStock:1, minStock:3, unit:'botol', description:null, createdAt:'', updatedAt:'', category:{id:3,name:'Tinta Botol'}, brand:{id:3,name:'Epson'},   printerModel:{id:3,name:'Epson L3210',type:'Inkjet'},            stockStatus:'menipis',  isLowStock:true  },
  { id:5, name:'Brother TN-2380 Black Toner',   sku:'BRO-TN2380', color:'Black',   currentStock:4, minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:2,name:'Toner'},       brand:{id:4,name:'Brother'}, printerModel:{id:4,name:'Brother DCP-L2540DW',type:'Laser'},     stockStatus:'tersedia', isLowStock:false },
  { id:6, name:'Canon PG-745 Black Cartridge',  sku:'CAN-PG745',  color:'Black',   currentStock:3, minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:1,name:'Cartridge'},   brand:{id:2,name:'Canon'},   printerModel:{id:2,name:'Canon PIXMA G2010',type:'Inkjet'},      stockStatus:'menipis',  isLowStock:true  },
  { id:7, name:'Canon CL-746 Color Cartridge',  sku:'CAN-CL746',  color:'Color',   currentStock:0, minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:1,name:'Cartridge'},   brand:{id:2,name:'Canon'},   printerModel:{id:2,name:'Canon PIXMA G2010',type:'Inkjet'},      stockStatus:'habis',    isLowStock:true  },
  { id:8, name:'Epson 664 Tinta Botol Magenta', sku:'EPS-664-MG', color:'Magenta', currentStock:2, minStock:3, unit:'botol', description:null, createdAt:'', updatedAt:'', category:{id:3,name:'Tinta Botol'}, brand:{id:3,name:'Epson'},   printerModel:{id:3,name:'Epson L3210',type:'Inkjet'},            stockStatus:'menipis',  isLowStock:true  },
];

// Apakah API URL sudah dikonfigurasi?
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const IS_API_CONFIGURED = !!API_URL && !API_URL.includes('localhost');

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function useInventory() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [alertItems, setAlertItems]   = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [usingMock, setUsingMock]     = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    brand: 'all', search: '', showLowOnly: false,
  });
  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [selectedProduct, setSelectedProduct]   = useState<Product | null>(null);
  const [toasts, setToasts]                     = useState<Toast[]>([]);
  const toastId = useRef(0);

  // ─────────────────────────────────────────────────────────────
  // FETCH: Selalu ambil dari API — fallback mock hanya jika gagal total
  // ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [stockRes, alertRes] = await Promise.all([
        fetchStock(filters),
        fetchAlerts(),
      ]);

      // ✅ Data dari API — persistent di database
      setProducts(stockRes.data ?? []);
      setAlertItems([
        ...(alertRes.data?.kritis  ?? []),
        ...(alertRes.data?.menipis ?? []),
      ]);
      setUsingMock(false);

    } catch (err) {
      console.warn('[useInventory] API tidak tersedia:', err);

      if (IS_API_CONFIGURED) {
        // API sudah dikonfigurasi tapi gagal — tampilkan error nyata
        const msg = err instanceof Error ? err.message : 'Gagal memuat data dari server';
        setError(`Koneksi ke server gagal: ${msg}. Data mungkin tidak terkini.`);
      }

      // Fallback ke mock hanya jika belum ada data sama sekali
      if (products.length === 0) {
        const low = MOCK_PRODUCTS.filter((p) => p.isLowStock);
        setProducts(MOCK_PRODUCTS);
        setAlertItems(low.map((p) => ({
          id: p.id, nama: p.name, sku: p.sku,
          kategori: p.category.name, brand: p.brand.name,
          printerModel: p.printerModel?.name ?? '-',
          stokSaat: p.currentStock, stokMinimum: p.minStock,
          unit: p.unit,
          kekurangan: Math.max(0, p.minStock - p.currentStock),
          status: (p.currentStock === 0 ? 'HABIS' : 'MENIPIS') as const,
        })));
        setUsingMock(true);
      }
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─────────────────────────────────────────────────────────────
  // COMPUTED STATS
  // ─────────────────────────────────────────────────────────────
  const stats: DashboardStats = {
    totalToner:      products.filter((p) => p.category.name === 'Toner').reduce((s, p) => s + p.currentStock, 0),
    totalCartridge:  products.filter((p) => p.category.name === 'Cartridge').reduce((s, p) => s + p.currentStock, 0),
    totalTintaBotol: products.filter((p) => p.category.name === 'Tinta Botol').reduce((s, p) => s + p.currentStock, 0),
    lowStockCount:   alertItems.length,
  };

  // ─────────────────────────────────────────────────────────────
  // FILTERED PRODUCTS (client-side, instant UX)
  // ─────────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchBrand  = filters.brand === 'all' || p.brand.name === filters.brand;
    const matchSearch = !filters.search ||
      p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      p.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
      p.printerModel?.name.toLowerCase().includes(filters.search.toLowerCase());
    const matchLow = !filters.showLowOnly || p.isLowStock;
    return matchBrand && matchSearch && matchLow;
  });

  // ─────────────────────────────────────────────────────────────
  // FILTER HANDLERS
  // ─────────────────────────────────────────────────────────────
  const setBrand      = (brand: BrandFilter) => setFilters((p) => ({ ...p, brand, showLowOnly: false }));
  const setSearch     = (search: string)     => setFilters((p) => ({ ...p, search }));
  const setShowLowOnly = (v: boolean)        => setFilters((p) => ({ ...p, showLowOnly: v, brand: 'all' }));

  // ─────────────────────────────────────────────────────────────
  // MODAL HANDLERS
  // ─────────────────────────────────────────────────────────────
  const openModal  = (product?: Product) => { setSelectedProduct(product ?? null); setIsModalOpen(true); };
  const closeModal = ()                  => { setIsModalOpen(false); setSelectedProduct(null); };

  // ─────────────────────────────────────────────────────────────
  // TOAST
  // ─────────────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // SUBMIT: POST /stok-keluar
  // Jika berhasil → re-fetch dari API agar data sinkron dengan database
  // Jika gagal (mock mode) → update state lokal saja
  // ─────────────────────────────────────────────────────────────
  const handleStockOut = async (payload: StockOutPayload): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      // Coba kirim ke API backend
      const res = await postStockOut(payload);

      // ✅ API berhasil — tampilkan notifikasi
      if (res.peringatan) {
        addToast(res.peringatan.message, res.peringatan.level === 'KRITIS' ? 'error' : 'warning');
      } else {
        addToast(res.message, 'success');
      }

      // Re-fetch data terbaru dari database
      await loadData();
      closeModal();
      return true;

    } catch {
      // ❌ API gagal — mode offline/mock
      const product = products.find((p) => p.id === payload.productId);
      if (!product) { addToast('Produk tidak ditemukan', 'error'); return false; }
      if (payload.quantity > product.currentStock) {
        addToast(`Stok tidak cukup. Tersedia: ${product.currentStock} ${product.unit}`, 'error');
        return false;
      }

      // Update state lokal (tidak persistent — akan reset saat refresh)
      setProducts((prev) => prev.map((p) => {
        if (p.id !== payload.productId) return p;
        const newStock = p.currentStock - payload.quantity;
        return {
          ...p,
          currentStock: newStock,
          stockStatus:  newStock === 0 ? 'habis' : newStock <= p.minStock ? 'menipis' : 'tersedia',
          isLowStock:   newStock <= p.minStock,
        };
      }));

      const newStock = product.currentStock - payload.quantity;
      if (newStock === 0) {
        addToast(`⚠️ Stok "${product.name}" HABIS! (Mode offline — data tidak tersimpan)`, 'error');
      } else {
        addToast(
          `${payload.quantity} ${product.unit} diambil. ${usingMock ? '⚠️ Mode offline — data tidak tersimpan ke database.' : ''}`,
          usingMock ? 'warning' : 'success'
        );
      }

      closeModal();
      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    products, filteredProducts, alertItems, stats,
    isLoading, isSubmitting, error, usingMock,
    filters, setBrand, setSearch, setShowLowOnly,
    isModalOpen, selectedProduct, openModal, closeModal,
    handleStockOut,
    refetch: loadData,
    toasts,
  };
}
