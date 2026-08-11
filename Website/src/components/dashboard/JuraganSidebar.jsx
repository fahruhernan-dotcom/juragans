import { useState } from 'react'
import {
  Tag, LogOut, Boxes, ChevronLeft, ChevronRight,
  ShoppingBag, Utensils, Wallet, Printer, Layers, FileText, Package,
  UserCheck, ShieldCheck, ChevronUp, Sparkles
} from 'lucide-react'
import { useAuth } from '../../lib/auth/useAuthHook'

const NAV_GROUPS = [
  {
    label: 'OPERASIONAL & STOK',
    items: [
      { id: 'inventory_batches', label: 'Batch Stok Pabrik', icon: Layers },
      { id: 'sales_orders',      label: 'Pesanan & Ritel',   icon: ShoppingBag },
      { id: 'warehouse_packing', label: 'Rekap Packing Gudang', icon: Package },
      { id: 'b2b_prospects',     label: 'Prospek B2B Bakso', icon: Utensils },
      { id: 'expenses_payroll',  label: 'Keuangan & Tim',    icon: Wallet },
      { id: 'product_pricing',   label: 'SKU & Matriks Harga', icon: Tag },
      { id: 'invoice_printer',   label: 'Cetak Invoice / PDF', icon: Printer },
      { id: 'packing_3d',        label: 'Simulator 3D Packing', icon: Boxes },
    ],
  },
  {
    label: 'LEGALITAS & DOKUMEN',
    items: [
      { id: 'document_hub',     label: 'Pusat Dokumen & SPK', icon: FileText },
    ],
  },
]

export default function JuraganSidebar({
  collapsed,
  onToggleCollapse,
  activeTab,
  onNavigate,
  onLogout
}) {
  const { profile, loginAsRole } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleRoleSwitch = async (roleKey) => {
    await loginAsRole(roleKey)
    setShowUserMenu(false)
  }

  return (
    <aside
      className={`flex flex-col bg-brand-maroon-dark text-white border-r border-white/10 flex-shrink-0 relative transition-all duration-300 select-none z-30 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className={`flex items-center gap-3 px-4 py-4 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 bg-brand-gold text-brand-maroon-dark rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg shadow-brand-gold/30">
          👑
        </div>
        {!collapsed && (
          <div className="min-w-0 text-left">
            <p className="font-black text-sm text-white leading-none tracking-tight">Juragan Admin</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] text-brand-gold/90 font-medium">Cloud System • Boyolali</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Group Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar space-y-5 text-left">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-bold text-brand-gold/60 uppercase tracking-widest mb-2.5 px-2">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-gold/25 to-brand-gold/10 text-brand-gold border border-brand-gold/40 shadow-md shadow-brand-gold/10 font-bold'
                        : 'text-white/70 hover:bg-white/10 hover:text-white border border-transparent'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-brand-gold text-brand-maroon-dark shadow-sm shadow-brand-gold/50 font-bold'
                          : 'bg-white/10 group-hover:bg-white/15 text-white/70 group-hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    {!collapsed && (
                      <span className="text-xs font-semibold whitespace-nowrap truncate">{item.label}</span>
                    )}
                    {!collapsed && isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-gold flex-shrink-0 shadow-sm shadow-brand-gold" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer User Profile & Role Switcher */}
      <div className="p-3 border-t border-white/10 relative text-left">
        {/* User Dropdown Menu */}
        {showUserMenu && !collapsed && (
          <div className="absolute bottom-16 left-3 right-3 bg-brand-maroon border border-brand-gold/30 rounded-2xl p-3 shadow-2xl space-y-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="px-2 py-1.5 border-b border-white/10">
              <p className="text-xs font-bold text-white">{profile?.full_name || 'Juragan Owner'}</p>
              <p className="text-[10px] text-brand-gold/80 truncate">{profile?.email || 'juragan@anakbawang.id'}</p>
              <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                <ShieldCheck className="w-3 h-3 text-brand-gold" />
                {profile?.role || 'owner'} mode
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <p className="text-[9px] font-extrabold text-white/50 uppercase px-2">Switch Quick Role</p>
              <button
                onClick={() => handleRoleSwitch('owner')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-brand-gold" />
                <span>Owner Role</span>
              </button>
              <button
                onClick={() => handleRoleSwitch('admin')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Kasir Role</span>
              </button>
              <button
                onClick={() => handleRoleSwitch('dev')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-white/90 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Superadmin Dev</span>
              </button>
            </div>

            <div className="pt-2 border-t border-white/10">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Keluar Dashboard</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`w-full flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-gold to-amber-600 text-brand-maroon-dark font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md">
              {profile?.full_name ? profile.full_name[0] : 'J'}
            </div>
            {!collapsed && (
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold text-white leading-none truncate">{profile?.full_name || 'Juragan Owner'}</p>
                <p className="text-[10px] text-brand-gold/80 mt-0.5 truncate">{profile?.role || 'owner'}</p>
              </div>
            )}
          </div>
          {!collapsed && <ChevronUp className={`w-4 h-4 text-white/50 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />}
        </button>
      </div>

      {/* Collapse Toggle Button */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3.5 top-6 w-7 h-7 bg-brand-maroon-dark border-2 border-brand-gold/40 rounded-full flex items-center justify-center shadow-xl text-brand-gold hover:text-white hover:border-brand-gold hover:scale-110 transition-all z-40 cursor-pointer"
          title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      )}
    </aside>
  )
}
