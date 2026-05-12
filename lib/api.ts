// lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP Error ${res.status}`);
  }

  const data = await res.json();
  return data;
}

// ==================== API FUNCTIONS ====================

/** GET /stok - Ambil daftar produk */
export async function fetchStock(filters: any = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.brand && filters.brand !== 'Semua') {
    // Sesuaikan dengan logic backend kamu
    params.append('brandId', filters.brand === 'HP' ? '1' : 
                           filters.brand === 'Canon' ? '2' :
                           filters.brand === 'Epson' ? '3' : '4');
  }
  if (filters.showLowOnly) params.append('threshold', '10'); // sesuaikan dengan backend

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/stok${query}`);
}

/** POST /stok-keluar */
export async function postStockOut(payload: any) {
  return apiFetch('/stok-keluar', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** GET /alert */
export async function fetchAlerts() {
  return apiFetch('/alert');
}

/** GET /riwayat */
export async function fetchHistory() {
  return apiFetch('/riwayat');
}