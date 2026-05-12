// app/page.tsx
import RouteGuard from '@/components/auth/RouteGuard';
import DashboardPage from '@/components/dashboard/DashboardPage';

export const metadata = {
  title: 'Dashboard | IT Inventory Management',
};

export default function Home() {
  return (
    <RouteGuard>
      <DashboardPage />
    </RouteGuard>
  );
}
