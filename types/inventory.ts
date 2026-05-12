// types/inventory.ts
// Semua TypeScript types & interfaces untuk IT Inventory

// ─────────────────────────────────────────────────────────────
// CORE ENTITIES
// ─────────────────────────────────────────────────────────────

export type StockStatus = 'tersedia' | 'menipis' | 'habis';

export interface Category {
  id: number;
  name: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface PrinterModel {
  id: number;
  name: string;
  type: string | null;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  picName: string | null;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  color: string | null;
  currentStock: number;
  minStock: number;
  unit: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  // Relasi
  category: Category;
  brand: Brand;
  printerModel: PrinterModel | null;
  // Computed dari API
  stockStatus: StockStatus;
  isLowStock: boolean;
}

// ─────────────────────────────────────────────────────────────
// API RESPONSE SHAPES
// ─────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  showing: string;
}

export interface StockListResponse {
  success: boolean;
  data: Product[];
  meta: PaginationMeta;
}

export interface AlertSummary {
  totalAlert: number;
  itemHabis: number;
  itemMenipis: number;
  generatedAt: string;
}

export interface AlertItem {
  id: number;
  nama: string;
  sku: string;
  kategori: string;
  brand: string;
  printerModel: string;
  stokSaat: number;
  stokMinimum: number;
  unit: string;
  kekurangan: number;
  status: 'HABIS' | 'MENIPIS';
}

export interface AlertResponse {
  success: boolean;
  ringkasan: AlertSummary;
  data: {
    kritis: AlertItem[];
    menipis: AlertItem[];
  };
}

export interface StockOutResponse {
  success: boolean;
  message: string;
  data: {
    transaksi: Record<string, unknown>;
    stokUpdate: {
      currentStock: number;
      stokSebelum: number;
      stokSesudah: number;
      selisih: string;
      stockStatus: StockStatus;
    };
  };
  peringatan?: {
    level: 'KRITIS' | 'RENDAH';
    message: string;
  };
}

// ─────────────────────────────────────────────────────────────
// FORM PAYLOADS
// ─────────────────────────────────────────────────────────────

export interface StockOutPayload {
  productId: number;
  departmentId: number;
  quantity: number;
  takenBy: string;
  purpose?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────
// UI STATE
// ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalToner: number;
  totalCartridge: number;
  totalTintaBotol: number;
  lowStockCount: number;
}

export type BrandFilter = 'all' | 'HP' | 'Canon' | 'Epson' | 'Brother';

export interface FilterState {
  brand: BrandFilter;
  search: string;
  showLowOnly: boolean;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}
