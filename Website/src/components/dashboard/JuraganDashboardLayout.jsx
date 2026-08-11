import { useState } from 'react'
import { Menu, Search } from 'lucide-react'
import JuraganSidebar from './JuraganSidebar'
import { useAuth } from '../../lib/auth/useAuthHook'

const PAGE_META = {
  inventory_batches: { title: 'Batch Stok Pabrik & Gudang', sub: 'Pemantauan stok fisik di tangan owner & tagihan modal pengambilan dari pabrik Boyolali' },
  sales_orders:      { title: 'Daftar Pesanan & Ritel',    sub: 'Pendataan pesanan ritel terkonfirmasi dan pengiriman barang' },
  warehouse_packing: { title: 'Rekapitulasi Packing Gudang', sub: 'Ringkasan kebutuhan pack ziplock bawang goreng per area & antrean customer (Real-Time Live)' },
  b2b_prospects:     { title: 'Target Prospek B2B Solo',   sub: 'Database 27 Restoran Bakso Solo Raya untuk outreach penawaran B2B' },
  expenses_payroll:  { title: 'Keuangan & Klaim Tim',     sub: 'Pencatatan kas operasional, stiker kemasan 127k, dan klaim pengeluaran Didi/Reyhan (belum ditukar)' },
  product_pricing:   { title: 'Katalog SKU & Pricing',     sub: 'Acuan HPP Pabrik Boyolali dan perbandingan Opsi Harga A & B' },
  invoice_printer:   { title: 'Printer Invoice / PDF',     sub: 'Cetak nota resmi pelanggan & invoice tagihan pengambilan ke pabrik' },
  packing_3d:        { title: 'Simulator 3D Packing Kardus', sub: 'Visualisasi interaktif 3D penataan pouch dalam kardus packing (P, L, T & Zigzag)' },
  document_hub:      { title: 'Pusat Dokumen & Legalitas', sub: 'Pencarian nomor dokumen resmi (SPK Tim, Invoices, Halal, NIB, & Notulensi) secara realtime dan rapi' },
}

export default function JuraganDashboardLayout({
  activeTab,
  onNavigate,
  onLogout,
  children
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const { profile } = useAuth()

  const meta = PAGE_META[activeTab] || PAGE_META['inventory_batches']

  const handleNavigate = (id) => {
    onNavigate(id)
    setMobileSidebar(false)
  }

  return (
    <div className="flex h-screen bg-[#F5F0EB] font-sans overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:flex flex-shrink-0">
        <JuraganSidebar
          collapsed={!sidebarOpen}
          onToggleCollapse={() => setSidebarOpen(!sidebarOpen)}
          activeTab={activeTab}
          onNavigate={handleNavigate}
          onLogout={onLogout}
        />
      </div>

      {/* ── Mobile Sidebar Overlay / Sheet ── */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebar(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 z-50 shadow-2xl">
            <JuraganSidebar
              collapsed={false}
              activeTab={activeTab}
              onNavigate={handleNavigate}
              onLogout={onLogout}
            />
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-brand-gold/20 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebar(true)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-brand-cream hover:text-brand-maroon transition-colors cursor-pointer"
              title="Buka Sidebar Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-64 md:w-80 hover:border-brand-gold/50 transition-colors">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Cari stok, order, resto B2B..."
                className="w-full text-xs text-gray-700 bg-transparent outline-none placeholder:text-gray-400 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden md:inline">Supabase Cloud</span> Active
            </div>

            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-maroon to-brand-maroon-dark rounded-xl flex items-center justify-center text-brand-gold font-black text-xs flex-shrink-0 shadow-md shadow-brand-maroon/20">
                {profile?.full_name ? profile.full_name[0] : 'J'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-gray-900 leading-none truncate max-w-[120px]">{profile?.full_name || 'Juragan Owner'}</p>
                <p className="text-[10px] text-brand-maroon font-semibold mt-0.5 capitalize">{profile?.role || 'owner'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Body Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Dynamic Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{meta.title}</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{meta.sub}</p>
            </div>
          </div>

          {/* Children / Active Admin Module */}
          <div className="min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
