// lib/exportExcel.ts
// Utility export Excel menggunakan library SheetJS (xlsx)
// Dipanggil client-side — tidak butuh server

import * as XLSX from 'xlsx';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface TransactionRow {
  id: number;
  tanggal: string;
  namaPengambil: string;
  produk: string;
  sku: string;
  kategori: string;
  brand: string;
  jumlah: number;
  satuan: string;
  departemen: string;
  kodeDept: string;
  keperluan: string;
  stokSetelah: number;
}

export interface StockRow {
  id: number;
  nama: string;
  sku: string;
  kategori: string;
  brand: string;
  modelPrinter: string;
  warna: string;
  stokSaat: number;
  stokMinimum: number;
  satuan: string;
  status: string;
}

// ─────────────────────────────────────────────────────────────
// HELPER: Style header cell
// ─────────────────────────────────────────────────────────────

function styleHeader(ws: XLSX.WorkSheet, range: XLSX.Range) {
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[cellRef]) continue;
    ws[cellRef].s = {
      font:      { bold: true, color: { rgb: 'FFFFFF' }, name: 'Arial', sz: 10 },
      fill:      { fgColor: { rgb: '0F172A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        bottom: { style: 'thin', color: { rgb: '94A3B8' } },
      },
    };
  }
}

// ─────────────────────────────────────────────────────────────
// HELPER: Set column widths
// ─────────────────────────────────────────────────────────────

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map((w) => ({ wch: w }));
}

// ─────────────────────────────────────────────────────────────
// HELPER: Format date string → readable
// ─────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─────────────────────────────────────────────────────────────
// EXPORT 1: Riwayat Pengambilan (Stok Keluar)
// ─────────────────────────────────────────────────────────────

export function exportTransactionHistory(rows: TransactionRow[], filename?: string) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Riwayat Pengambilan ──────────────────────────
  const headers = [
    'No', 'Tanggal & Waktu', 'Nama Pengambil', 'Produk',
    'SKU', 'Kategori', 'Brand', 'Jumlah', 'Satuan',
    'Departemen', 'Kode Dept', 'Keperluan', 'Stok Setelah',
  ];

  const data = rows.map((r, i) => [
    i + 1,
    fmtDate(r.tanggal),
    r.namaPengambil,
    r.produk,
    r.sku,
    r.kategori,
    r.brand,
    r.jumlah,
    r.satuan,
    r.departemen,
    r.kodeDept,
    r.keperluan || '-',
    r.stokSetelah,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Styling
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  styleHeader(ws, range);
  setColWidths(ws, [5, 20, 20, 30, 14, 14, 10, 8, 8, 24, 10, 28, 12]);

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Pengambilan');

  // ── Sheet 2: Ringkasan per Departemen ────────────────────
  const deptMap = new Map<string, { total: number; items: string[] }>();
  rows.forEach((r) => {
    const key = r.departemen;
    if (!deptMap.has(key)) deptMap.set(key, { total: 0, items: [] });
    const d = deptMap.get(key)!;
    d.total += r.jumlah;
    if (!d.items.includes(r.produk)) d.items.push(r.produk);
  });

  const summaryHeaders = ['Departemen', 'Total Item Diambil', 'Jenis Produk Diambil'];
  const summaryData = Array.from(deptMap.entries()).map(([dept, val]) => [
    dept,
    val.total,
    val.items.join(', '),
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryData]);
  const range2 = XLSX.utils.decode_range(ws2['!ref'] ?? 'A1');
  styleHeader(ws2, range2);
  setColWidths(ws2, [28, 20, 50]);
  ws2['!freeze'] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan Departemen');

  // ── Download ──────────────────────────────────────────────
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, filename ?? `riwayat-pengambilan-${date}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// EXPORT 2: Data Stok Saat Ini
// ─────────────────────────────────────────────────────────────

export function exportStockData(rows: StockRow[], filename?: string) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'No', 'Nama Produk', 'SKU', 'Kategori', 'Brand',
    'Model Printer', 'Warna', 'Stok Saat Ini',
    'Stok Minimum', 'Satuan', 'Status',
  ];

  const data = rows.map((r, i) => [
    i + 1, r.nama, r.sku, r.kategori, r.brand,
    r.modelPrinter || '-', r.warna || '-',
    r.stokSaat, r.stokMinimum, r.satuan, r.status,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Warnai baris status 'Habis' dan 'Menipis'
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  styleHeader(ws, range);

  for (let R = 1; R <= range.e.r; R++) {
    const statusCell = ws[XLSX.utils.encode_cell({ r: R, c: 10 })];
    if (!statusCell) continue;
    const isHabis   = statusCell.v === 'Habis';
    const isMenipis = statusCell.v === 'Menipis';
    if (!isHabis && !isMenipis) continue;

    // Warnai seluruh baris
    for (let C = 0; C <= range.e.c; C++) {
      const ref = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[ref]) continue;
      ws[ref].s = {
        fill: { fgColor: { rgb: isHabis ? 'FEE2E2' : 'FFF7ED' } },
        font: { color: { rgb: isHabis ? 'B91C1C' : 'C2410C' }, name: 'Arial', sz: 10 },
      };
    }
  }

  setColWidths(ws, [5, 32, 14, 14, 10, 26, 10, 12, 12, 8, 12]);
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(wb, ws, 'Data Stok');

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, filename ?? `data-stok-${date}.xlsx`);
}
