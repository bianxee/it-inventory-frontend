// app/stok-masuk/page.tsx
import StockInPage from '@/components/dashboard/StockInPage';

export const metadata = {
  title: 'Stok Masuk | IT Inventory',
  description: 'Catat penerimaan barang dari supplier',
};

export default function StokMasukPage() {
  return <StockInPage />;
}
