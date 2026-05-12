// app/produk/page.tsx
import ProductsPage from '@/components/dashboard/ProductsPage';

export const metadata = {
  title: 'Manajemen Produk | IT Inventory',
  description: 'Tambah, edit, dan hapus data master produk inventori',
};

export default function ProdukPage() {
  return <ProductsPage />;
}
