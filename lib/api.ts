// lib/api.ts
// Centralized API client dengan base URL dan error handling

import type {
  StockListResponse,
  AlertResponse,
  StockOutPayload,
  StockOutResponse,
  FilterState,
} from '@/types/inventory';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

// ─────────────────────────────────────────────────────────────
// HELPER: Fetch wrapper dengan error normalization
// ─────────────────────────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',   // ← hindari stale cache di Next.js production
      ...options,
    });
  } catch (err) {
    console.error('[API] Network error:', url, err);
    throw new Error('NETWORK_ERROR');
  }

  const json = await res.json().catch(() => ({ success: false, error: 'Respons server tidak valid' }));

  if (!res.ok || json.success === false) {
    const message = json.error ?? json.message ?? `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  return json as T;
}

// ─────────────────────────────────────────────────────────────
// API FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * GET /stok — Ambil semua produk dengan filter opsional
 */
export async function fetchStock(filters?: Partial<FilterState>): Promise<StockListResponse> {
  const params = new URLSearchParams();

  if (filters?.search)      params.set('search', filters.search);
  if (filters?.brand && filters.brand !== 'all') params.set('brandId', String(brandNameToId(filters.brand)));
  if (filters?.showLowOnly) params.set('lowStock', 'true');
  params.set('limit', '100');

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<StockListResponse>(`/stok${query}`);
}

/**
 * GET /alert — Ambil item dengan stok menipis
 */
export async function fetchAlerts(): Promise<AlertResponse> {
  return apiFetch<AlertResponse>('/alert');
}

/**
 * POST /stok-keluar — Catat pengambilan barang
 */
export async function postStockOut(payload: StockOutPayload): Promise<StockOutResponse> {
  return apiFetch<StockOutResponse>('/stok-keluar', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─────────────────────────────────────────────────────────────
// HELPER: Map brand name → ID (sesuai seed data)
// ─────────────────────────────────────────────────────────────

const BRAND_ID_MAP: Record<string, number> = {
  HP: 1,
  Canon: 2,
  Epson: 3,
  Brother: 4,
};

function brandNameToId(name: string): number {
  return BRAND_ID_MAP[name] ?? 0;
}
