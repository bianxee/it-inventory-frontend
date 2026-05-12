// app/riwayat/page.tsx
import TransactionHistoryPage from '@/components/dashboard/TransactionHistoryPage';

export const metadata = {
  title: 'Riwayat Pengambilan | IT Inventory',
  description: 'Riwayat pengambilan barang per departemen',
};

export default function RiwayatPage() {
  return <TransactionHistoryPage />;
}
