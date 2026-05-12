// hooks/useInventory.ts
// Custom hook — mengelola semua state & logika data inventori

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
// HOOK
// ─────────────────────────────────────────────────────────────

export function useInventory() {
  // ── Data state ──────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [alertItems, setAlertItems] = useState<AlertItem[]>([]);

  // ── Loading & Error ─────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Filter state ────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({
    brand: 'all',
    search: '',
    showLowOnly: false,
  });

  // ── Modal state ─────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // ── Toast state ─────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // ─────────────────────────────────────────────────────────────
  // MOCK DATA — dipakai saat backend belum running (development)
  // Hapus / komentari blok ini jika backend sudah aktif
  // ─────────────────────────────────────────────────────────────
  const MOCK_PRODUCTS: Product[] = [
    { id:1, name:'HP 17A Black LaserJet Toner',  sku:'HP-CF217A',  color:'Black',  currentStock:8, minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:2,name:'Toner'},       brand:{id:1,name:'HP'},      printerModel:{id:1,name:'HP LaserJet Pro M404dn',type:'Laser'}, stockStatus:'tersedia', isLowStock:false },
    { id:2, name:'HP 678 Black Cartridge',        sku:'HP-678-BK',  color:'Black',  currentStock:2, minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:1,name:'Cartridge'},   brand:{id:1,name:'HP'},      printerModel:null,                                              stockStatus:'menipis',  isLowStock:true  },
    { id:3, name:'Epson 664 Tinta Botol Hitam',   sku:'EPS-664-BK', color:'Black',  currentStock:5, minStock:3, unit:'botol', description:null, createdAt:'', updatedAt:'', category:{id:3,name:'Tinta Botol'}, brand:{id:3,name:'Epson'},   printerModel:{id:3,name:'Epson L3210',type:'Inkjet'},           stockStatus:'tersedia', isLowStock:false },
    { id:4, name:'Epson 664 Tinta Botol Cyan',    sku:'EPS-664-CY', color:'Cyan',   currentStock:1, minStock:3, unit:'botol', description:null, createdAt:'', updatedAt:'', category:{id:3,name:'Tinta Botol'}, brand:{id:3,name:'Epson'},   printerModel:{id:3,name:'Epson L3210',type:'Inkjet'},           stockStatus:'menipis',  isLowStock:true  },
    { id:5, name:'Brother TN-2380 Black Toner',   sku:'BRO-TN2380', color:'Black',  currentStock:4, minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:2,name:'Toner'},       brand:{id:4,name:'Brother'}, printerModel:{id:4,name:'Brother DCP-L2540DW',type:'Laser'},    stockStatus:'tersedia', isLowStock:false },
    { id:6, name:'Canon PG-745 Black Cartridge',  sku:'CAN-PG745',  color:'Black',  currentStock:3, minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:1,name:'Cartridge'},   brand:{id:2,name:'Canon'},   printerModel:{id:2,name:'Canon PIXMA G2010',type:'Inkjet'},     stockStatus:'menipis',  isLowStock:true  },
    { id:7, name:'Canon CL-746 Color Cartridge',  sku:'CAN-CL746',  color:'Color',  currentStock:0, minStock:3, unit:'pcs',   description:null, createdAt:'', updatedAt:'', category:{id:1,name:'Cartridge'},   brand:{id:2,name:'Canon'},   printerModel:{id:2,name:'Canon PIXMA G2010',type:'Inkjet'},     stockStatus:'habis',    isLowStock:true  },
    { id:8, name:'Epson 664 Tinta Botol Magenta', sku:'EPS-664-MG', color:'Magenta',currentStock:2, minStock:3, unit:'botol', description:null, createdAt:'', updatedAt:'', category:{id:3,name:'Tinta Botol'}, brand:{id:3,name:'Epson'},   printerModel:{id:3,name:'Epson L3210',type:'Inkjet'},           stockStatus:'menipis',  isLowStock:true  },
  ];

  // ─────────────────────────────────────────────────────────────
  // FETCH: Load stok + alert secara paralel
  // ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [stockRes, alertRes] = await Promise.all([
        fetchStock(filters),
        fetchAlerts(),
      ]);

      setProducts(stockRes.data ?? []);

      const allAlerts = [
        ...alertRes.data.kritis,
        ...alertRes.data.menipis,
      ];
      setAlertItems(allAlerts);
    } catch (err) {
      // ── Backend belum aktif: selalu gunakan mock data ─────────
      console.warn('[useInventory] API tidak tersedia, menggunakan mock data.');
      const low = MOCK_PRODUCTS.filter((p) => p.isLowStock);
      setProducts(MOCK_PRODUCTS);
      setAlertItems(low.map((p) => ({
        id: p.id, nama: p.name, sku: p.sku,
        kategori: p.category.name, brand: p.brand.name,
        printerModel: p.printerModel?.name ?? '-',
        stokSaat: p.currentStock, stokMinimum: p.minStock,
        unit: p.unit, kekurangan: Math.max(0, p.minStock - p.currentStock),
        status: (p.currentStock === 0 ? 'HABIS' : 'MENIPIS') as const,
      })));
      // Jangan tampilkan error banner — mock data sudah cukup
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fetch saat komponen mount atau filter berubah
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─────────────────────────────────────────────────────────────
  // COMPUTED: Statistik dashboard
  // ─────────────────────────────────────────────────────────────
  const stats: DashboardStats = {
    totalToner: products
      .filter((p) => p.category.name === 'Toner')
      .reduce((sum, p) => sum + p.currentStock, 0),
    totalCartridge: products
      .filter((p) => p.category.name === 'Cartridge')
      .reduce((sum, p) => sum + p.currentStock, 0),
    totalTintaBotol: products
      .filter((p) => p.category.name === 'Tinta Botol')
      .reduce((sum, p) => sum + p.currentStock, 0),
    lowStockCount: alertItems.length,
  };

  // ─────────────────────────────────────────────────────────────
  // COMPUTED: Produk terfilter (client-side untuk UX instant)
  // ─────────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchBrand =
      filters.brand === 'all' || p.brand.name === filters.brand;
    const matchSearch =
      !filters.search ||
      p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      p.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
      p.printerModel?.name.toLowerCase().includes(filters.search.toLowerCase());
    const matchLow = !filters.showLowOnly || p.isLowStock;
    return matchBrand && matchSearch && matchLow;
  });

  // ─────────────────────────────────────────────────────────────
  // FILTER HANDLERS
  // ─────────────────────────────────────────────────────────────
  const setBrand = (brand: BrandFilter) => {
    setFilters((prev) => ({ ...prev, brand, showLowOnly: false }));
  };

  const setSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  };

  const setShowLowOnly = (showLowOnly: boolean) => {
    setFilters((prev) => ({ ...prev, showLowOnly, brand: 'all' }));
  };

  // ─────────────────────────────────────────────────────────────
  // MODAL HANDLERS
  // ─────────────────────────────────────────────────────────────
  const openModal = (product?: Product) => {
    setSelectedProduct(product ?? null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // ─────────────────────────────────────────────────────────────
  // TOAST HELPERS
  // ─────────────────────────────────────────────────────────────
  const addToast = useCallback(
    (message: string, type: Toast['type'] = 'success') => {
      const id = ++toastId.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  // ─────────────────────────────────────────────────────────────
  // SUBMIT: POST /stok-keluar
  // ─────────────────────────────────────────────────────────────
  const handleStockOut = async (payload: StockOutPayload): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const res = await postStockOut(payload);

      if (res.peringatan) {
        addToast(res.peringatan.message, res.peringatan.level === 'KRITIS' ? 'error' : 'warning');
      } else {
        addToast(res.message, 'success');
      }

      await loadData();
      closeModal();
      return true;
    } catch {
      // ── Backend offline: simulasi pengambilan di client ────────
      const product = products.find((p) => p.id === payload.productId);
      if (!product) {
        addToast('Produk tidak ditemukan', 'error');
        return false;
      }
      if (payload.quantity > product.currentStock) {
        addToast(`Stok tidak cukup. Tersedia: ${product.currentStock} ${product.unit}`, 'error');
        return false;
      }

      // Update stok secara lokal
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== payload.productId) return p;
          const newStock = p.currentStock - payload.quantity;
          return {
            ...p,
            currentStock: newStock,
            stockStatus: newStock === 0 ? 'habis' : newStock <= p.minStock ? 'menipis' : 'tersedia',
            isLowStock: newStock <= p.minStock,
          };
        })
      );

      // Update alert items
      setAlertItems((prev) => {
        const updated = products
          .map((p) => p.id === payload.productId
            ? { ...p, currentStock: p.currentStock - payload.quantity }
            : p
          )
          .filter((p) => p.currentStock <= p.minStock)
          .map((p) => ({
            id: p.id, nama: p.name, sku: p.sku,
            kategori: p.category.name, brand: p.brand.name,
            printerModel: p.printerModel?.name ?? '-',
            stokSaat: p.id === payload.productId ? p.currentStock - payload.quantity : p.currentStock,
            stokMinimum: p.minStock,
            unit: p.unit,
            kekurangan: Math.max(0, p.minStock - p.currentStock),
            status: (p.currentStock - (p.id === payload.productId ? payload.quantity : 0) === 0
              ? 'HABIS' : 'MENIPIS') as const,
          }));
        return updated;
      });

      const newStock = product.currentStock - payload.quantity;
      if (newStock === 0) {
        addToast(`⚠️ Stok "${product.name}" telah HABIS!`, 'error');
      } else if (newStock <= product.minStock) {
        addToast(`${payload.quantity} ${product.unit} "${product.name}" berhasil diambil. ⚠️ Stok menipis!`, 'warning');
      } else {
        addToast(`${payload.quantity} ${product.unit} "${product.name}" berhasil diambil.`, 'success');
      }

      closeModal();
      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // Data
    products,
    filteredProducts,
    alertItems,
    stats,
    // Loading & Error
    isLoading,
    isSubmitting,
    error,
    // Filters
    filters,
    setBrand,
    setSearch,
    setShowLowOnly,
    // Modal
    isModalOpen,
    selectedProduct,
    openModal,
    closeModal,
    // Actions
    handleStockOut,
    refetch: loadData,
    // Toast
    toasts,
  };
}
