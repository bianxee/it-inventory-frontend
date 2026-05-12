// hooks/useTransactionHistory.ts
// Hook untuk data riwayat transaksi (stok keluar)

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TransactionRow } from '@/lib/exportExcel';

// ─────────────────────────────────────────────────────────────
// TYPES (sesuai response GET /api/v1/riwayat)
// ─────────────────────────────────────────────────────────────

export interface RawTransaction {
  id: number;
  productId: number;
  departmentId: number;
  quantity: number;
  takenDate: string;
  takenBy: string;
  purpose: string | null;
  notes: string | null;
  createdAt: string;
  jenis: 'MASUK' | 'KELUAR';
  pihak: string;
  product: {
    id: number;
    name: string;
    sku: string;
    unit: string;
  };
  department?: {
    id: number;
    name: string;
    code: string;
  };
}

export type FilterType = 'semua' | 'masuk' | 'keluar';

interface UseTransactionHistoryReturn {
  transactions: RawTransaction[];
  filteredTransactions: RawTransaction[];
  isLoading: boolean;
  error: string | null;
  filterType: FilterType;
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
  setFilterType: (t: FilterType) => void;
  setSearchQuery: (q: string) => void;
  setDateFrom: (d: string) => void;
  setDateTo: (d: string) => void;
  refetch: () => void;
  toExportRows: () => TransactionRow[];
}

// ─────────────────────────────────────────────────────────────
// MOCK DATA (dipakai saat API belum siap / development)
// Ganti dengan fetch nyata ke GET /api/v1/riwayat
// ─────────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS: RawTransaction[] = [
  {
    id: 1, productId: 1, departmentId: 2, quantity: 2,
    takenDate: '2025-05-01T08:30:00.000Z', takenBy: 'Sari Dewi',
    purpose: 'Printer Finance lantai 3', notes: null,
    createdAt: '2025-05-01T08:30:00.000Z', jenis: 'KELUAR', pihak: 'Finance & Accounting',
    product: { id: 1, name: 'HP 17A Black LaserJet Toner', sku: 'HP-CF217A', unit: 'pcs' },
    department: { id: 2, name: 'Finance & Accounting', code: 'FIN-001' },
  },
  {
    id: 2, productId: 3, departmentId: 1, quantity: 1,
    takenDate: '2025-05-02T10:15:00.000Z', takenBy: 'Budi Santoso',
    purpose: 'Epson L3210 di ruang IT', notes: null,
    createdAt: '2025-05-02T10:15:00.000Z', jenis: 'KELUAR', pihak: 'Information Technology',
    product: { id: 3, name: 'Epson 664 Tinta Botol Hitam', sku: 'EPS-664-BK', unit: 'botol' },
    department: { id: 1, name: 'Information Technology', code: 'IT-001' },
  },
  {
    id: 3, productId: 5, departmentId: 4, quantity: 1,
    takenDate: '2025-05-03T13:45:00.000Z', takenBy: 'Rini Utami',
    purpose: 'Penggantian toner bulanan', notes: 'Urgent',
    createdAt: '2025-05-03T13:45:00.000Z', jenis: 'KELUAR', pihak: 'Operations',
    product: { id: 5, name: 'Brother TN-2380 Black Toner', sku: 'BRO-TN2380', unit: 'pcs' },
    department: { id: 4, name: 'Operations', code: 'OPS-001' },
  },
  {
    id: 4, productId: 6, departmentId: 5, quantity: 3,
    takenDate: '2025-05-04T09:00:00.000Z', takenBy: 'Doni Kurniawan',
    purpose: 'Cetak brosur event marketing', notes: null,
    createdAt: '2025-05-04T09:00:00.000Z', jenis: 'KELUAR', pihak: 'Marketing',
    product: { id: 6, name: 'Canon PG-745 Black Cartridge', sku: 'CAN-PG745', unit: 'pcs' },
    department: { id: 5, name: 'Marketing', code: 'MKT-001' },
  },
  {
    id: 5, productId: 2, departmentId: 3, quantity: 1,
    takenDate: '2025-05-05T14:20:00.000Z', takenBy: 'Andi Pratama',
    purpose: 'Printer absensi HR', notes: null,
    createdAt: '2025-05-05T14:20:00.000Z', jenis: 'KELUAR', pihak: 'Human Resources',
    product: { id: 2, name: 'HP 678 Black Cartridge', sku: 'HP-678-BK', unit: 'pcs' },
    department: { id: 3, name: 'Human Resources', code: 'HR-001' },
  },
  {
    id: 6, productId: 4, departmentId: 2, quantity: 2,
    takenDate: '2025-05-06T11:00:00.000Z', takenBy: 'Sari Dewi',
    purpose: 'Isi ulang tinta warna', notes: null,
    createdAt: '2025-05-06T11:00:00.000Z', jenis: 'KELUAR', pihak: 'Finance & Accounting',
    product: { id: 4, name: 'Epson 664 Tinta Botol Cyan', sku: 'EPS-664-CY', unit: 'botol' },
    department: { id: 2, name: 'Finance & Accounting', code: 'FIN-001' },
  },
];

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function useTransactionHistory(): UseTransactionHistoryReturn {
  const [transactions, setTransactions] = useState<RawTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('keluar');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      // ── Gunakan fetch nyata ke API bila sudah tersedia ─────
      // const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      // const res = await fetch(`${apiUrl}/riwayat?type=${filterType}&limit=200`, {
      //   signal: controller.signal,
      // });
      // if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // const json = await res.json();
      // setTransactions(json.data);

      // ── Mock data untuk development ────────────────────────
      await new Promise((r) => setTimeout(r, 600)); // simulasi network delay
      if (controller.signal.aborted) return;
      setTransactions(MOCK_TRANSACTIONS);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Gagal memuat riwayat');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => abortRef.current?.abort();
  }, [loadData]);

  // ── Client-side filter ──────────────────────────────────────
  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'semua' && t.jenis !== filterType.toUpperCase()) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hit =
        t.takenBy?.toLowerCase().includes(q) ||
        t.product.name.toLowerCase().includes(q) ||
        t.product.sku.toLowerCase().includes(q) ||
        t.department?.name.toLowerCase().includes(q) ||
        t.purpose?.toLowerCase().includes(q);
      if (!hit) return false;
    }

    if (dateFrom) {
      if (new Date(t.takenDate ?? t.createdAt) < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (new Date(t.takenDate ?? t.createdAt) > end) return false;
    }

    return true;
  });

  // ── Convert to export rows ──────────────────────────────────
  const toExportRows = (): TransactionRow[] =>
    filteredTransactions
      .filter((t) => t.jenis === 'KELUAR')
      .map((t) => ({
        id: t.id,
        tanggal: t.takenDate ?? t.createdAt,
        namaPengambil: t.takenBy,
        produk: t.product.name,
        sku: t.product.sku,
        kategori: '',       // enriched di komponen
        brand: '',          // enriched di komponen
        jumlah: t.quantity,
        satuan: t.product.unit,
        departemen: t.department?.name ?? t.pihak,
        kodeDept: t.department?.code ?? '-',
        keperluan: t.purpose ?? '',
        stokSetelah: 0,     // tidak tersedia dari endpoint riwayat
      }));

  return {
    transactions,
    filteredTransactions,
    isLoading,
    error,
    filterType,
    searchQuery,
    dateFrom,
    dateTo,
    setFilterType,
    setSearchQuery,
    setDateFrom,
    setDateTo,
    refetch: loadData,
    toExportRows,
  };
}
