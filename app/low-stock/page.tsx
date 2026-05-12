// app/low-stock/page.tsx
import LowStockPage from '@/components/dashboard/LowStockPage';

export const metadata = {
  title: 'Low Stock Alert | IT Inventory',
  description: 'Daftar item stok kritis dan rekomendasi pengadaan',
};

export default function LowStockRoute() {
  return <LowStockPage />;
}
