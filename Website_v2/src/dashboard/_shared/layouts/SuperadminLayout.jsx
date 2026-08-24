import React from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { 
  ShieldCheck, Users, Trash2, Cpu, Activity, 
  Store, Server, LayoutDashboard, Sparkles, ChevronRight, Zap, Layers, Lock
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export default function SuperadminLayout() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans text-slate-900 selection:bg-orange-500/30 antialiased">
      
      {/* High-End Sleek Topbar */}
      <header className="relative z-40 bg-white border-b border-slate-200 px-6 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        
        {/* Brand & Mode Title */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-[1px] shadow-sm shrink-0">
            <div className="w-full h-full bg-orange-500/10 rounded-[15px] flex items-center justify-center">
              <ShieldCheck size={20} className="text-orange-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                Superadmin Control Center
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-500" /> System Command
              </span>
            </div>
            <h1 className="font-display text-base font-extrabold text-slate-900 tracking-tight pt-0.5">
              Pusat Kontrol Web Admin
            </h1>
          </div>
        </div>

        {/* Switcher Button: Back to Client View */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => navigate('/beranda')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs h-10 px-4 gap-2 shadow-sm border border-emerald-500/20 active:scale-[0.98] transition-all group cursor-pointer"
          >
            <Store size={15} className="text-white" />
            <span>Switch ke Bisnis Client</span>
            <ChevronRight size={14} className="text-white group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex relative z-10">
        
        {/* Sleek Admin Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-5 flex flex-col justify-between hidden md:flex shrink-0">
          <div className="space-y-6">
            
            <div className="px-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigasi Utama</p>
            </div>

            <nav className="space-y-1.5">
              <AdminNavItem 
                to="/admin/dashboard" 
                icon={LayoutDashboard} 
                label="Overview Admin" 
                active={location.pathname === '/admin/dashboard' && !location.search} 
              />
              <AdminNavItem 
                to="/admin/dashboard?tab=accounts" 
                icon={Users} 
                label="Kelola Akun Login" 
                active={location.search.includes('tab=accounts')} 
              />
              <AdminNavItem 
                to="/admin/dashboard?tab=logs" 
                icon={Activity} 
                label="System Error Logs" 
                active={location.search.includes('tab=logs')} 
              />
              <AdminNavItem 
                to="/admin/dashboard?tab=diagnostics" 
                icon={Cpu} 
                label="Diagnostics & Cache" 
                active={location.search.includes('tab=diagnostics')} 
              />
              <AdminNavItem 
                to="/admin/dashboard?tab=recycle" 
                icon={Trash2} 
                label="Recycle Bin Recovery" 
                active={location.search.includes('tab=recycle')} 
              />
            </nav>
          </div>

          {/* Admin Profile Footbar */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
            <Avatar className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200">
              <AvatarFallback className="bg-transparent text-orange-600 font-bold text-xs">
                {(profile?.full_name || 'SA')?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {profile?.full_name || 'Superadmin'}
              </p>
              <p className="text-[10px] font-medium text-slate-500 truncate">
                {user?.email || 'dev@sembako.id'}
              </p>
            </div>
          </div>
        </aside>

        {/* Dynamic Content Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 bg-slate-50">
          <Outlet />
        </main>

      </div>
    </div>
  )
}

function AdminNavItem({ to, icon: Icon, label, active }) {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all group duration-150",
        active 
          ? "bg-orange-600 text-white font-extrabold shadow-md shadow-orange-600/20 border border-orange-500" 
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      )}
    >
      <Icon size={17} className={cn(active ? "text-white" : "text-slate-500 group-hover:text-slate-800")} />
      <span>{label}</span>
    </Link>
  )
}
