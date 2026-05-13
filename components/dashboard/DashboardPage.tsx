// app/dashboard/page.tsx  (atau components/dashboard/DashboardPage.tsx)
// Komponen utama Dashboard — orchestrator semua sub-komponen

'use client';

import { useInventory }    from '@/hooks/useInventory';
import Sidebar             from '@/components/dashboard/Sidebar';
import InventoryTable      from '@/components/dashboard/InventoryTable';
import StockOutModal       from '@/components/modal/StockOutModal';
import {
  StatGrid,
  ToastContainer,
  DashboardSkeleton,
  ErrorBanner,
} from '@/components/dashboard/widgets/index';

// ─────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────
function DashboardHeader({
  alertCount,
  onOpenModal,
  onRefetch,
  isLoading,
}: {
  alertCount: number;
  onOpenModal: () => void;
  onRefetch: () => void;
  isLoading: boolean;
}) {
  const now = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
      <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-slate-900">Dashboard Inventori</h1>
          <p className="text-xs text-slate-400 mt-0.5">{now}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={onRefetch}
            disabled={isLoading}
            title="Refresh data"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-40"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={isLoading ? 'animate-spin' : ''}
            >
              <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
          </button>

          {/* Alert bell */}
          {alertCount > 0 && (
            <div className="relative p-2 text-slate-500">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </div>
          )}

          {/* CTA: Tambah pengambilan */}
          <button
            onClick={onOpenModal}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-[#b5ff47] text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors"
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span className="hidden sm:inline">Pengambilan</span>
            <span className="sm:hidden">Ambil</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT PAGE COMPONENT
// ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const {
    products,
    filteredProducts,
    alertItems,
    stats,
    isLoading,
    isSubmitting,
    error,
    usingMock,
    filters,
    setBrand,
    setSearch,
    setShowLowOnly,
    isModalOpen,
    selectedProduct,
    openModal,
    closeModal,
    handleStockOut,
    refetch,
    toasts,
  } = useInventory();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar alertCount={alertItems.length} />

      {/* Main content */}
      <main className="flex-1 sm:ml-56">
        {/* Mobile top padding (karena mobile header fixed) */}
        <div className="sm:hidden h-14" />

        {/* Dashboard header */}
        <DashboardHeader
          alertCount={alertItems.length}
          onOpenModal={() => openModal()}
          onRefetch={refetch}
          isLoading={isLoading}
        />

        {/* Page body */}
        <div className="px-4 sm:px-6 py-5 space-y-5 max-w-7xl mx-auto">

          {/* Error banner */}
          {error && (
            <ErrorBanner message={error} onRetry={refetch} />
          )}

          {/* Loading skeleton */}
          {isLoading && !error ? (
            <DashboardSkeleton />
          ) : !error ? (
            <>
              {/* Stat cards */}
              <StatGrid
                stats={stats}
                onLowStockClick={() => setShowLowOnly(true)}
              />

          {/* Offline mode warning */}
          {(usingMock as boolean) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-800">Mode Offline — Data Tidak Tersimpan</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Tidak dapat terhubung ke server. Perubahan stok tidak akan tersimpan ke database.
                </p>
              </div>
            </div>
          )}
              {alertItems.some((a) => a.status === 'HABIS') && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-lg">🚨</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-red-800">
                      {alertItems.filter((a) => a.status === 'HABIS').length} item stok HABIS
                    </p>
                    <p className="text-xs text-red-600 mt-0.5 truncate">
                      {alertItems.filter((a) => a.status === 'HABIS').map((a) => a.nama).join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowLowOnly(true)}
                    className="text-xs font-semibold text-red-700 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-100 flex-shrink-0 transition-colors"
                  >
                    Lihat
                  </button>
                </div>
              )}

              {/* Inventory table */}
              <InventoryTable
                products={filteredProducts}
                allProducts={products}
                filters={filters}
                onBrand={setBrand}
                onSearch={setSearch}
                onLowStock={() => setShowLowOnly(!filters.showLowOnly)}
                onTakeStock={(product) => openModal(product)}
              />
            </>
          ) : null}
        </div>
      </main>

      {/* Modal — products dilewatkan hanya jika sudah berisi data */}
      <StockOutModal
        isOpen={isModalOpen}
        products={products ?? []}
        selectedProduct={selectedProduct}
        isSubmitting={isSubmitting}
        onClose={closeModal}
        onSubmit={handleStockOut}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
