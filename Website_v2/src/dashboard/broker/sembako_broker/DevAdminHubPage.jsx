import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Terminal, ShieldCheck, Users, Activity, Trash2, RefreshCw, 
  Search, AlertTriangle, CheckCircle2, Cpu, Database, 
  KeyRound, ShieldAlert, HardDrive, Wifi, Server,
  Copy, Check, FileText, ArrowRight, CornerDownRight, Zap
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/hooks/useAuth'
import SembakoRecycleBin from '@/dashboard/broker/sembako_broker/components/SembakoRecycleBin'
import { SembakoAuditLogView } from '@/dashboard/broker/sembako_broker/components/SembakoAuditLogView'
import KelolaAkunPage from '@/dashboard/broker/sembako_broker/KelolaAkunPage'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useLicense } from '@/hooks/useLicense'
import { LicenseStatusCard } from '@/components/license/LicenseStatusCard'
import { LicenseTimeline } from '@/components/license/LicenseTimeline'
import { LicenseActions } from '@/components/license/LicenseActions'
import { LicenseHistory } from '@/components/license/LicenseHistory'

export default function DevAdminHubPage() {
  const { user, profile, tenant } = useAuth()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('logs')
  const [dbLatency, setDbLatency] = useState(null)
  const [isCheckingPing, setIsCheckingPing] = useState(false)
  const [copiedLogId, setCopiedLogId] = useState(null)

  // Reset database states
  const [wipeTransactions] = useState(true)
  const [wipeCatalog, setWipeCatalog] = useState(false)
  const [showConfirm1, setShowConfirm1] = useState(false)
  const [showConfirm2, setShowConfirm2] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [showConfirmStockOnly, setShowConfirmStockOnly] = useState(false)
  const [confirmStockText, setConfirmStockText] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  // License hook
  const license = useLicense()

  // (license actions are handled via useLicense hook)

  // System Logs State (mocked + localStorage captured errors)
  const [logFilter, setLogFilter] = useState('ALL')
  const [logSearch, setLogSearch] = useState('')
  const [systemLogs, setSystemLogs] = useState(() => {
    const saved = localStorage.getItem('ternakos_dev_logs')
    if (saved) {
      try { return JSON.parse(saved) } catch { /* ignore */ }
    }
    return [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        level: 'INFO',
        source: 'Supabase REST',
        message: 'Database Connection Pool Ready (Active Tenant Sync)',
        details: { tenant_id: tenant?.id || 'default' }
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        level: 'WARN',
        source: 'PostgREST Schema',
        message: 'Column fallback engaged for sembako_customers payload sanitization',
        details: { table: 'sembako_customers', stripped_fields: ['area', 'credit_limit'] }
      }
    ]
  })

  // Measure Supabase Connection Latency
  const checkHealth = async () => {
    setIsCheckingPing(true)
    const start = performance.now()
    try {
      await supabase.from('sembako_products').select('id').limit(1)
      const end = performance.now()
      setDbLatency(Math.round(end - start))
      toast.success('Database health check normal')
    } catch {
      setDbLatency(999)
      toast.error('Ping ke database mengalami kendala')
    } finally {
      setIsCheckingPing(false)
    }
  }

  useEffect(() => {
    checkHealth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id])

  const handleClearLogs = () => {
    setSystemLogs([])
    localStorage.removeItem('ternakos_dev_logs')
    toast.success('Logs konsol berhasil dibersihkan')
  }

  const handleResetDatabase = async () => {
    if (confirmText !== 'RESET DATABASE') {
      toast.error('Konfirmasi kata kunci salah')
      return
    }
    setIsResetting(true)
    const toastId = toast.loading('Sedang mereset database bisnis & riwayat...')
    try {
      const tenantId = tenant.id
      const userId = user?.id

      // 1. Delete notifications & logs
      try {
        let notifQuery = supabase.from('notifications').delete()
        if (userId) {
          notifQuery = notifQuery.or(`tenant_id.eq.${tenantId},user_id.eq.${userId}`)
        } else {
          notifQuery = notifQuery.eq('tenant_id', tenantId)
        }
        await notifQuery
      } catch (e) {
        console.warn('Notifications delete fallback:', e)
      }

      try {
        await supabase.from('notification_events').delete().eq('tenant_id', tenantId)
      } catch (e) {
        console.warn('Notification events delete fallback:', e)
      }

      try {
        await supabase.from('system_error_logs').delete().eq('tenant_id', tenantId)
      } catch (e) {
        console.warn('System error logs delete fallback:', e)
      }

      // 2. Delete transactional data in correct order of dependency (child tables first)
      const { error: errDeliv } = await supabase.from('sembako_deliveries').delete().eq('tenant_id', tenantId)
      if (errDeliv) throw errDeliv

      const { error: errPaym } = await supabase.from('sembako_payments').delete().eq('tenant_id', tenantId)
      if (errPaym) throw errPaym

      const { error: errReturns } = await supabase.from('sembako_returns').delete().eq('tenant_id', tenantId)
      if (errReturns) throw errReturns

      try {
        await supabase.from('sembako_return_items').delete().eq('tenant_id', tenantId)
      } catch (e) {
        console.warn('sembako_return_items delete fallback:', e)
      }

      try {
        await supabase.from('sembako_inventory_mutations').delete().eq('tenant_id', tenantId)
      } catch (e) {
        console.warn('sembako_inventory_mutations delete fallback:', e)
      }

      const { error: errStockOut } = await supabase.from('sembako_stock_out').delete().eq('tenant_id', tenantId)
      if (errStockOut) throw errStockOut

      // Clean sembako_sale_items for sales belonging to this tenant
      try {
        const { data: salesList } = await supabase.from('sembako_sales').select('id').eq('tenant_id', tenantId)
        if (salesList && salesList.length > 0) {
          const saleIds = salesList.map(s => s.id)
          await supabase.from('sembako_sale_items').delete().in('sale_id', saleIds)
        }
      } catch (e) {
        console.warn('sembako_sale_items delete fallback:', e)
      }

      const { error: errSales } = await supabase.from('sembako_sales').delete().eq('tenant_id', tenantId)
      if (errSales) throw errSales

      const { error: errSupPay } = await supabase.from('sembako_supplier_payments').delete().eq('tenant_id', tenantId)
      if (errSupPay) throw errSupPay

      const { error: errPay } = await supabase.from('sembako_payroll').delete().eq('tenant_id', tenantId)
      if (errPay) throw errPay

      const { error: errExpenses } = await supabase.from('sembako_expenses').delete().eq('tenant_id', tenantId)
      if (errExpenses) throw errExpenses

      const { error: errBatches } = await supabase.from('sembako_stock_batches').delete().eq('tenant_id', tenantId)
      if (errBatches) throw errBatches

      const { error: errAudit } = await supabase.from('sembako_audit_logs').delete().eq('tenant_id', tenantId)
      if (errAudit) throw errAudit

      // 3. Conditional wipe of catalog/master files
      if (wipeCatalog) {
        const { error: errProd } = await supabase.from('sembako_products').delete().eq('tenant_id', tenantId)
        if (errProd) throw errProd

        try {
          await supabase.from('sembako_raw_materials').delete().eq('tenant_id', tenantId)
        } catch (e) {
          console.warn('sembako_raw_materials delete fallback:', e)
        }

        const { error: errCust } = await supabase.from('sembako_customers').delete().eq('tenant_id', tenantId)
        if (errCust) throw errCust

        const { error: errSupp } = await supabase.from('sembako_suppliers').delete().eq('tenant_id', tenantId)
        if (errSupp) throw errSupp

        const { error: errEmp } = await supabase.from('sembako_employees').delete().eq('tenant_id', tenantId)
        if (errEmp) throw errEmp
      } else {
        // Reset current_stock and avg_buy_price in sembako_products to 0
        try {
          const { data: prodList } = await supabase.from('sembako_products').select('id').eq('tenant_id', tenantId)
          if (prodList && prodList.length > 0) {
            const prodIds = prodList.map(p => p.id)
            await supabase.from('sembako_products')
              .update({ current_stock: 0, avg_buy_price: 0 })
              .in('id', prodIds)
          } else {
            await supabase.from('sembako_products')
              .update({ current_stock: 0, avg_buy_price: 0 })
              .eq('tenant_id', tenantId)
          }
        } catch (errProdReset) {
          console.warn('sembako_products reset fallback:', errProdReset)
        }

        // Reset current_stock and total_spent in sembako_raw_materials to 0 (preserves master definitions & unit_cost reference)
        try {
          const { data: rawList } = await supabase.from('sembako_raw_materials').select('id').eq('tenant_id', tenantId)
          if (rawList && rawList.length > 0) {
            const rawIds = rawList.map(r => r.id)
            await supabase.from('sembako_raw_materials')
              .update({ current_stock: 0, total_spent: 0 })
              .in('id', rawIds)
          } else {
            await supabase.from('sembako_raw_materials')
              .update({ current_stock: 0, total_spent: 0 })
              .eq('tenant_id', tenantId)
          }
        } catch (e) {
          console.warn('sembako_raw_materials stock reset fallback:', e)
        }
      }

      // 4. Clear LocalStorage and React Query Cache
      try {
        localStorage.removeItem('ternakos_dev_logs')
        localStorage.removeItem('erp_retur_list')
        localStorage.removeItem(`ternak_os_wizard_draft_${tenantId}`)
      } catch (e) {
        /* silent */
      }

      queryClient.setQueryData(['notifications', tenantId, userId], [])
      queryClient.removeQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-raw-materials'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-inventory-mutations'] })
      queryClient.invalidateQueries()

      setSystemLogs([])

      toast.success('Database bisnis & riwayat notifikasi berhasil di-reset!', { id: toastId })
      setShowConfirm2(false)
      setConfirmText('')
    } catch (e) {
      toast.error('Gagal melakukan reset database: ' + e.message, { id: toastId })
    } finally {
      setIsResetting(false)
    }
  }

  const handleResetStocksOnly = async () => {
    if (confirmStockText !== 'RESET STOK') {
      toast.error('Konfirmasi kata kunci salah. Ketik RESET STOK.')
      return
    }
    if (!tenant?.id) return
    setIsResetting(true)
    const toastId = toast.loading('Sedang mengosongkan seluruh stok gudang ke 0...')
    try {
      const tenantId = tenant.id

      // 1. Reset all raw materials
      try {
        const { data: rawList } = await supabase.from('sembako_raw_materials').select('id').eq('tenant_id', tenantId).eq('is_deleted', false)
        if (rawList && rawList.length > 0) {
          const rawIds = rawList.map(r => r.id)
          await supabase.from('sembako_raw_materials').update({ current_stock: 0, total_spent: 0 }).in('id', rawIds)
        } else {
          await supabase.from('sembako_raw_materials').update({ current_stock: 0, total_spent: 0 }).eq('tenant_id', tenantId)
        }
      } catch (e) {
        console.warn('sembako_raw_materials reset fallback:', e)
      }

      // 2. Reset all products
      try {
        const { data: prodList } = await supabase.from('sembako_products').select('id').eq('tenant_id', tenantId).eq('is_deleted', false)
        if (prodList && prodList.length > 0) {
          const prodIds = prodList.map(p => p.id)
          await supabase.from('sembako_products').update({ current_stock: 0, avg_buy_price: 0 }).in('id', prodIds)
        } else {
          await supabase.from('sembako_products').update({ current_stock: 0, avg_buy_price: 0 }).eq('tenant_id', tenantId)
        }
      } catch (e) {
        console.warn('sembako_products reset fallback:', e)
      }

      // 3. Clear finished batches, restock audit logs & inventory mutations
      await supabase.from('sembako_stock_batches').delete().eq('tenant_id', tenantId)
      await supabase.from('sembako_audit_logs').delete().eq('tenant_id', tenantId)
      try {
        await supabase.from('sembako_inventory_mutations').delete().eq('tenant_id', tenantId)
      } catch { /* optional fallback */ }

      queryClient.invalidateQueries({ queryKey: ['sembako-raw-materials'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-inventory-mutations'] })
      queryClient.invalidateQueries()

      toast.success('Seluruh stok bahan baku mentah, kemasan, dan produk jadi berhasil di-reset ke 0!', { id: toastId })
      setShowConfirmStockOnly(false)
      setConfirmStockText('')
    } catch (e) {
      toast.error('Gagal reset stok: ' + e.message, { id: toastId })
    } finally {
      setIsResetting(false)
    }
  }

  const handleClearNotifications = async () => {
    if (!tenant?.id) return
    const toastId = toast.loading('Sedang membersihkan riwayat notifikasi...')
    try {
      const tenantId = tenant.id
      const userId = user?.id
      let notifQuery = supabase.from('notifications').delete()
      if (userId) {
        notifQuery = notifQuery.or(`tenant_id.eq.${tenantId},user_id.eq.${userId}`)
      } else {
        notifQuery = notifQuery.eq('tenant_id', tenantId)
      }
      await notifQuery
      await supabase.from('notification_events').delete().eq('tenant_id', tenantId)

      queryClient.setQueryData(['notifications', tenantId, userId], [])
      queryClient.removeQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })

      toast.success('Seluruh riwayat notifikasi berhasil dibersihkan!', { id: toastId })
    } catch (e) {
      toast.error('Gagal membersihkan notifikasi: ' + e.message, { id: toastId })
    }
  }

  const handleFlushCache = () => {
    queryClient.invalidateQueries()
    toast.success('React Query Cache & Invalidation berhasil dibersihkan')
  }

  const filteredLogs = useMemo(() => {
    return systemLogs.filter(log => {
      const matchFilter = logFilter === 'ALL' || log.level === logFilter
      const matchSearch = !logSearch || 
        log.message?.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.source?.toLowerCase().includes(logSearch.toLowerCase())
      return matchFilter && matchSearch
    })
  }, [systemLogs, logFilter, logSearch])

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 p-4 sm:p-8 space-y-6 selection:bg-[#0F172A]/30 selection:text-slate-900">
      
      {/* Header Admin Console */}
      <header className="relative z-10 bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0F172A] to-slate-800 border border-slate-700/30 flex items-center justify-center text-white shadow-md shadow-slate-900/20 shrink-0">
            <Terminal size={28} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-100 text-[#0F172A] border border-slate-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 animate-pulse">
                DEV MODE ACTIVE
              </Badge>
              <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5">
                Role: {profile?.role || 'Developer'}
              </Badge>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
              Web Admin & System Management
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Konsol inspeksi kesehatan sistem, error log, manajemen akses akun, dan diagnosa cache.
            </p>
          </div>
        </div>

        {/* Server & DB Status Badges */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Server size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Supabase DB</p>
              <p className="text-xs font-black text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                CONNECTED {dbLatency !== null && `(${dbLatency}ms)`}
              </p>
            </div>
          </div>

          <Button 
            onClick={checkHealth} 
            disabled={isCheckingPing}
            variant="outline" 
            className="h-12 rounded-2xl bg-white border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold gap-2 px-4 shadow-sm cursor-pointer"
          >
            <RefreshCw size={14} className={cn(isCheckingPing && "animate-spin text-slate-900")} />
            Ping System
          </Button>
        </div>
      </header>

      {/* Main Tabs Navigation */}
      <main className="relative z-10 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-200/70 border border-slate-300/60 p-1.5 h-auto rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
            <TabsTrigger 
              value="logs" 
              className="rounded-xl text-xs font-black uppercase tracking-wider gap-2 data-[state=active]:bg-[#0F172A] data-[state=active]:text-white text-slate-700 hover:text-slate-900 transition-all h-11 cursor-pointer"
            >
              <Activity size={16} /> Error & System Logs
            </TabsTrigger>
            <TabsTrigger 
              value="audit" 
              className="rounded-xl text-xs font-black uppercase tracking-wider gap-2 data-[state=active]:bg-[#0F172A] data-[state=active]:text-white text-slate-700 hover:text-slate-900 transition-all h-11 cursor-pointer"
            >
              <ShieldCheck size={16} /> Audit Trail
            </TabsTrigger>
            <TabsTrigger 
              value="accounts" 
              className="rounded-xl text-xs font-black uppercase tracking-wider gap-2 data-[state=active]:bg-[#0F172A] data-[state=active]:text-white text-slate-700 hover:text-slate-900 transition-all h-11 cursor-pointer"
            >
              <Users size={16} /> Kelola Akun Login
            </TabsTrigger>
            <TabsTrigger 
              value="diagnostics" 
              className="rounded-xl text-xs font-black uppercase tracking-wider gap-2 data-[state=active]:bg-[#0F172A] data-[state=active]:text-white text-slate-700 hover:text-slate-900 transition-all h-11 cursor-pointer"
            >
              <Cpu size={16} /> Diagnostics & Cache
            </TabsTrigger>
            <TabsTrigger 
              value="recycle" 
              className="rounded-xl text-xs font-black uppercase tracking-wider gap-2 data-[state=active]:bg-[#0F172A] data-[state=active]:text-white text-slate-700 hover:text-slate-900 transition-all h-11 cursor-pointer"
            >
              <Trash2 size={16} /> Recycle Bin Data
            </TabsTrigger>
          </TabsList>

          {/* TAB: AUDIT TRAIL TENANT */}
          <TabsContent value="audit" className="mt-0">
            <Card className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-black text-slate-900 font-display uppercase tracking-tight">
                  Tenant Audit Trail & Security Activity
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Rekaman seluruh aktivitas bisnis, mutasi stok, manipulasi nota, serta penghapusan/edit data mitra toko & supplier.
                </p>
              </div>
              <SembakoAuditLogView />
            </Card>
          </TabsContent>

          {/* TAB 1: ERROR & SYSTEM LOGS CONSOLE */}
          <TabsContent value="logs" className="mt-0 space-y-4">
            <Card className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-6">
              
              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-72">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input 
                      value={logSearch}
                      onChange={e => setLogSearch(e.target.value)}
                      placeholder="Cari log kesalahan..."
                      className="bg-[#111C24] border-white/10 pl-10 h-11 text-xs font-bold text-white rounded-xl focus:border-slate-500"
                    />
                  </div>

                  <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    {['ALL', 'ERROR', 'WARN', 'INFO'].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setLogFilter(lvl)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                          logFilter === lvl 
                            ? "bg-[#0F172A] text-white shadow-md" 
                            : "text-slate-400 hover:text-white"
                        )}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleClearLogs}
                  variant="outline" 
                  size="sm"
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20 rounded-xl font-bold text-xs gap-2 h-11 px-4 w-full sm:w-auto"
                >
                  <Trash2 size={14} /> Clear Logs
                </Button>
              </div>

              {/* Logs Console Box */}
              <div className="bg-[#06090F] border border-white/10 rounded-2xl p-4 font-mono text-xs overflow-x-auto min-h-[380px] max-h-[500px] space-y-3 shadow-inner">
                {filteredLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 space-y-2">
                    <CheckCircle2 size={36} className="text-emerald-500/40" />
                    <p className="font-bold text-slate-400">Tidak ada log kesalahan yang tercatat</p>
                    <p className="text-[11px] text-slate-600">Sistem berjalan bersih tanpa exception PostgREST atau Runtime Error.</p>
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <div 
                      key={log.id} 
                      className="p-3.5 rounded-xl bg-[#0F172A]/80 border border-white/5 hover:border-white/10 transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase",
                            log.level === 'ERROR' && "bg-rose-500/20 text-rose-400 border border-rose-500/30",
                            log.level === 'WARN' && "bg-[#0F172A]/20 text-amber-400 border border-[#0F172A]/30",
                            log.level === 'INFO' && "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          )}>
                            {log.level}
                          </span>
                          <span className="text-slate-400 font-bold">[{log.source}]</span>
                          <span className="text-slate-500 text-[10px]">
                            {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                          </span>
                        </div>

                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(log, null, 2))
                            setCopiedLogId(log.id)
                            setTimeout(() => setCopiedLogId(null), 2000)
                          }}
                          className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          {copiedLogId === log.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>

                      <p className="text-slate-200 font-semibold leading-relaxed">
                        {log.message}
                      </p>

                      {log.details && (
                        <div className="bg-[#06090F] p-2.5 rounded-lg border border-white/5 text-[10px] text-slate-400 overflow-x-auto">
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: KELOLA AKUN LOGIN */}
          <TabsContent value="accounts" className="mt-0">
            <KelolaAkunPage />
          </TabsContent>

          {/* TAB 3: DIAGNOSTICS & CACHE */}
          <TabsContent value="diagnostics" className="mt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Cache Management Card */}
              <Card className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
                    <Zap size={22} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-lg tracking-tight uppercase">Cache & State Manager</h3>
                    <p className="text-xs text-slate-500">Purge data sementara dan atur ulang cache React Query</p>
                  </div>
                </div>

                <Separator className="bg-slate-200 my-2" />

                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">React Query Invalidation</p>
                      <p className="text-[11px] text-slate-500">Refresh semua query toko, stok, dan penjualan</p>
                    </div>
                    <Button 
                      onClick={handleFlushCache}
                      className="!bg-[#0F172A] hover:!bg-[#1E293B] !text-white rounded-xl text-xs font-bold h-10 px-4 cursor-pointer border-none"
                    >
                      Flush Cache
                    </Button>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">Riwayat Notifikasi In-App</p>
                      <p className="text-[11px] text-slate-500">Kosongkan seluruh notifikasi lonceng 🔔 tenant</p>
                    </div>
                    <Button 
                      onClick={handleClearNotifications}
                      variant="outline"
                      className="border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold h-10 px-4 cursor-pointer shadow-none"
                    >
                      Bersihkan Notifikasi
                    </Button>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">Tenant Storage State</p>
                      <p className="text-[11px] text-slate-500">Active Tenant: {tenant?.id || 'Default'}</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      ACTIVE
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Database Connection Info */}
              <Card className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-cyan-100 text-cyan-700">
                    <Database size={22} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-lg tracking-tight uppercase">Supabase REST Diagnostics</h3>
                    <p className="text-xs text-slate-500">Informasi endpoint PostgREST API</p>
                  </div>
                </div>

                <Separator className="bg-slate-200 my-2" />

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Project Endpoint</p>
                    <p className="font-mono text-slate-800 truncate">https://kqbxzokrpcwuxrfjshuf.supabase.co</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Auth User ID</p>
                    <p className="font-mono text-slate-800 truncate">{user?.id || 'Dev Session'}</p>
                  </div>
                </div>
              </Card>

            </div>

            {/* License Management Section */}
            <Card className="bg-white border border-slate-200 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6 mt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
                  <Server size={22} />
                </div>
                <div>
                  <h3 className="font-display font-black text-slate-900 text-lg tracking-tight uppercase">License Management</h3>
                  <p className="text-xs text-slate-500">Atur dan perbarui masa aktif server klien distributor secara langsung. Semua tindakan perubahan memerlukan konfirmasi.</p>
                </div>
              </div>

              <Separator className="bg-slate-200 my-1" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Col 1: Status + Timeline */}
                <div className="lg:col-span-4 space-y-5">
                  <LicenseStatusCard
                    statusInfo={license.statusInfo}
                    licenseActivatedAt={license.licenseActivatedAt}
                    licenseExpiresAt={license.licenseExpiresAt}
                    loading={license.loading}
                    formatLicenseDate={license.formatLicenseDate}
                    getGraceDate={license.getGraceDate}
                  />
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Alur Lisensi</h4>
                    <LicenseTimeline statusInfo={license.statusInfo} loading={license.loading} />
                  </div>
                </div>

                {/* Col 2: Actions + History */}
                <div className="lg:col-span-8 space-y-6">
                  <LicenseActions
                    updating={license.updating}
                    customDateInput={license.customDateInput}
                    setCustomDateInput={license.setCustomDateInput}
                    prepareLicenseUpdate={license.prepareLicenseUpdate}
                    showConfirm={license.showConfirm}
                    setShowConfirm={license.setShowConfirm}
                    pendingAction={license.pendingAction}
                    pendingExpiry={license.pendingExpiry}
                    executeLicenseUpdate={license.executeLicenseUpdate}
                  />
                  <Separator className="bg-slate-200" />
                  <LicenseHistory
                    history={license.history}
                    loading={license.historyLoading}
                    onRefresh={license.fetchHistory}
                  />
                </div>
              </div>
            </Card>

            {/* Danger Zone: Reset Data Bisnis */}
            <Card className="bg-red-50 border border-red-200 rounded-[28px] p-6 shadow-sm space-y-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-100 text-red-600">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="font-display font-black text-red-600 text-lg tracking-tight uppercase leading-none">Zona Bahaya: Reset Database Bisnis</h3>
                  <p className="text-[11px] text-red-500/80 font-bold uppercase tracking-wider mt-1">Hanya untuk Owner / Dev Superadmin</p>
                </div>
              </div>

              <Separator className="bg-red-200 my-2" />

              <div className="bg-white p-4 rounded-2xl border border-red-200 space-y-4 shadow-xs">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-800">
                    Pilih cakupan data bisnis yang ingin dihapus/dibersihkan dari database:
                  </p>
                  
                  <div className="space-y-2.5 pt-2 text-xs">
                    <label className="flex items-start gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900">
                      <input 
                        type="checkbox" 
                        checked={wipeTransactions} 
                        disabled 
                        className="mt-0.5 rounded border-slate-300 bg-slate-100 text-red-600 focus:ring-red-500 cursor-not-allowed" 
                      />
                      <div>
                        <strong>Reset Transaksi & Operasional (Wajib)</strong>
                        <p className="text-[10px] text-slate-500 mt-0.5">Menghapus Nota Penjualan, Pembayaran, Trip Kirim Barang, Kas Masuk/Keluar, Retur Toko, Payroll, dan Logs.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900">
                      <input 
                        type="checkbox" 
                        checked={wipeCatalog} 
                        onChange={e => setWipeCatalog(e.target.checked)} 
                        className="mt-0.5 rounded border-slate-300 bg-white text-red-600 focus:ring-red-500" 
                      />
                      <div>
                        <strong>Reset Katalog & Kontak (Opsional)</strong>
                        <p className="text-[10px] text-slate-500 mt-0.5">Menghapus Produk Katalog, Daftar Toko (Pelanggan), Supplier (Pabrik), dan Pegawai.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-[10px] font-bold text-red-600 leading-relaxed uppercase tracking-wider">
                    PENTING: Akun Login Owner/Superadmin, Hak Akses Akun, Tenant Bisnis, dan Info Langganan TIDAK akan dihapus. Anda tidak akan terkunci keluar dari sistem.
                  </p>
                </div>

                <Button 
                  onClick={() => setShowConfirm1(true)}
                  className="w-full !bg-red-600 hover:!bg-red-700 !text-white rounded-2xl h-12 font-black uppercase tracking-widest text-xs shadow-md shadow-red-600/20 transition-all active:scale-[0.98] cursor-pointer border-none flex items-center justify-center gap-2"
                >
                  <ShieldAlert size={16} />
                  Mulai Reset Data Bisnis
                </Button>
              </div>
            </Card>

            {/* Danger Zone: Reset Seluruh Stok Gudang Saja */}
            <Card className="bg-amber-500/10 border border-amber-500/30 rounded-[28px] p-6 shadow-sm space-y-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <RefreshCw size={22} />
                </div>
                <div>
                  <h3 className="font-display font-black text-amber-700 dark:text-amber-400 text-lg tracking-tight uppercase leading-none">
                    Zona Stok: Reset Seluruh Stok Gudang ke 0
                  </h3>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-300/80 font-bold uppercase tracking-wider mt-1">
                    Khusus Mengosongkan Stok Bahan Baku & Produk (Nota Penjualan & Kontak Tetap Aman)
                  </p>
                </div>
              </div>

              <Separator className="bg-amber-500/20 my-2" />

              <div className="bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-amber-500/20 space-y-3">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Gunakan tombol ini jika Anda hanya ingin <strong>mengosongkan seluruh stok fisik gudang menjadi 0 pcs / 0 kg</strong> (Bawang Mentah, Pouch, Stiker, dan Produk Jadi).
                  <br />
                  <span className="text-[11px] text-slate-500">
                    💡 Master produk, harga jual, kontak toko/pelanggan, dan supplier <strong>TIDAK AKAN HILANG</strong>.
                  </span>
                </p>

                <Button
                  onClick={() => {
                    setConfirmStockText('')
                    setShowConfirmStockOnly(true)
                  }}
                  className="w-full !bg-amber-600 hover:!bg-amber-700 !text-white rounded-2xl h-11 font-black uppercase tracking-wider text-xs shadow-md shadow-amber-600/20 transition-all active:scale-[0.98] cursor-pointer border-none flex items-center justify-center gap-2"
                >
                  <RefreshCw size={15} />
                  Reset Seluruh Stok Gudang ke 0
                </Button>
              </div>
            </Card>

          </TabsContent>

          {/* TAB 4: RECYCLE BIN DATA RECOVERY */}
          <TabsContent value="recycle" className="mt-0">
            <SembakoRecycleBin tenantId={tenant?.id || '00000000-0000-0000-0000-000000000002'} />
          </TabsContent>

        </Tabs>
      </main>

      {/* Modals Konfirmasi Reset Database */}
      {/* Konfirmasi 1 */}
      <AlertDialog open={showConfirm1} onOpenChange={setShowConfirm1}>
        <AlertDialogContent 
          className="rounded-[28px] p-6 max-w-md text-left shadow-2xl border"
          style={{
            backgroundColor: '#0F172A',
            borderColor: 'rgba(255,255,255,0.12)',
            color: '#F8FAFC',
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle 
              className="font-display font-black tracking-tight uppercase text-lg flex items-center gap-2.5"
              style={{ color: '#FFFFFF' }}
            >
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                <ShieldAlert size={20} className="shrink-0" />
              </div>
              Reset Database (Konfirmasi 1 dari 2)
            </AlertDialogTitle>
            <AlertDialogDescription 
              className="font-medium mt-3 text-xs leading-relaxed"
              style={{ color: '#94A3B8' }}
            >
              Apakah Anda benar-benar yakin ingin melakukan reset data bisnis Anda? Tindakan ini akan menghapus semua data operasional yang dipilih. Ini bersifat permanen dan tidak dapat dibatalkan di masa depan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-6 flex flex-row items-center justify-end">
            <AlertDialogCancel 
              className="rounded-xl h-11 px-5 font-bold text-xs cursor-pointer border transition-all"
              style={{
                backgroundColor: '#1E293B',
                borderColor: '#334155',
                color: '#E2E8F0',
              }}
            >
              Batal
            </AlertDialogCancel>
            <button 
              type="button"
              onClick={() => {
                setShowConfirm1(false)
                setTimeout(() => setShowConfirm2(true), 300)
              }}
              className="h-11 px-5 rounded-xl font-bold text-xs cursor-pointer flex-1 flex items-center justify-center transition-all shadow-md active:scale-95 border-none"
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
              }}
            >
              Lanjutkan ke Konfirmasi Akhir
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi 2 */}
      <AlertDialog open={showConfirm2} onOpenChange={(v) => { if (!v && !isResetting) { setShowConfirm2(false); setConfirmText(''); } }}>
        <AlertDialogContent 
          className="rounded-[28px] p-6 max-w-md text-left shadow-2xl border"
          style={{
            backgroundColor: '#0F172A',
            borderColor: 'rgba(239,68,68,0.3)',
            color: '#F8FAFC',
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle 
              className="font-display font-black tracking-tight uppercase text-lg flex items-center gap-2.5"
              style={{ color: '#EF4444' }}
            >
              <div className="p-2 rounded-xl bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse">
                <AlertTriangle size={20} className="shrink-0" />
              </div>
              PERINGATAN KERAS! (Konfirmasi 2 dari 2)
            </AlertDialogTitle>
            <AlertDialogDescription 
              className="font-medium mt-3 text-xs leading-relaxed"
              style={{ color: '#CBD5E1' }}
            >
              Ini adalah langkah terakhir. Seluruh transaksi operasional, sisa hutang/piutang, serta riwayat stok akan bersih total. 
              <br /><br />
              Ketik kata kunci <strong style={{ color: '#F87171', fontWeight: 900 }}>"RESET DATABASE"</strong> di bawah untuk mengonfirmasi:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4">
            <input 
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="Ketik RESET DATABASE di sini..."
              disabled={isResetting}
              autoFocus
              className="w-full h-12 px-4 rounded-xl text-sm font-black tracking-wider transition-all outline-none border focus:ring-2 focus:ring-red-500/30"
              style={{
                backgroundColor: '#090D16',
                color: '#FFFFFF',
                borderColor: confirmText === 'RESET DATABASE' ? '#22C55E' : 'rgba(255,255,255,0.18)',
              }}
            />
          </div>

          <AlertDialogFooter className="gap-3 mt-6 flex flex-row items-center justify-end">
            <AlertDialogCancel 
              disabled={isResetting}
              className="rounded-xl h-11 px-5 font-bold text-xs cursor-pointer border transition-all"
              style={{
                backgroundColor: '#1E293B',
                borderColor: '#334155',
                color: '#E2E8F0',
              }}
            >
              Batal
            </AlertDialogCancel>
            <button 
              type="button"
              disabled={isResetting || confirmText !== 'RESET DATABASE'}
              onClick={handleResetDatabase}
              className="h-11 px-5 rounded-xl font-black text-xs transition-all flex-1 flex items-center justify-center border-none"
              style={{
                backgroundColor: isResetting || confirmText !== 'RESET DATABASE' ? '#3B1212' : '#DC2626',
                color: isResetting || confirmText !== 'RESET DATABASE' ? 'rgba(255,255,255,0.35)' : '#FFFFFF',
                boxShadow: confirmText === 'RESET DATABASE' ? '0 4px 16px rgba(220, 38, 38, 0.45)' : 'none',
                cursor: isResetting || confirmText !== 'RESET DATABASE' ? 'not-allowed' : 'pointer',
              }}
            >
              {isResetting ? 'Mereset Database...' : 'Ya, Reset Seluruh Database Sekarang!'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Konfirmasi Reset Stok Only */}
      <AlertDialog open={showConfirmStockOnly} onOpenChange={(v) => { if (!v && !isResetting) { setShowConfirmStockOnly(false); setConfirmStockText(''); } }}>
        <AlertDialogContent 
          className="rounded-[28px] p-6 max-w-md text-left shadow-2xl border"
          style={{
            backgroundColor: '#0F172A',
            borderColor: 'rgba(245,158,11,0.3)',
            color: '#F8FAFC',
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle 
              className="font-display font-black tracking-tight uppercase text-lg flex items-center gap-2.5 text-amber-500"
            >
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
                <RefreshCw size={20} className="shrink-0" />
              </div>
              Reset Semua Stok Gudang ke 0?
            </AlertDialogTitle>
            <AlertDialogDescription 
              className="font-medium mt-3 text-xs leading-relaxed"
              style={{ color: '#CBD5E1' }}
            >
              Tindakan ini akan mengosongkan seluruh stok bahan baku mentah, kemasan/pouch, stiker, dan kapasitas siap kemas produk jadi menjadi <strong>0</strong>.
              <br /><br />
              Ketik kata kunci <strong style={{ color: '#FBBF24', fontWeight: 900 }}>"RESET STOK"</strong> di bawah untuk mengonfirmasi:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-4">
            <input 
              type="text"
              value={confirmStockText}
              onChange={e => setConfirmStockText(e.target.value)}
              placeholder="Ketik RESET STOK di sini..."
              disabled={isResetting}
              autoFocus
              className="w-full h-12 px-4 rounded-xl text-sm font-black tracking-wider transition-all outline-none border focus:ring-2 focus:ring-amber-500/30"
              style={{
                backgroundColor: '#090D16',
                color: '#FFFFFF',
                borderColor: confirmStockText === 'RESET STOK' ? '#22C55E' : 'rgba(255,255,255,0.18)',
              }}
            />
          </div>

          <AlertDialogFooter className="gap-3 mt-6 flex flex-row items-center justify-end">
            <AlertDialogCancel 
              disabled={isResetting}
              className="rounded-xl h-11 px-5 font-bold text-xs cursor-pointer border transition-all"
              style={{
                backgroundColor: '#1E293B',
                borderColor: '#334155',
                color: '#E2E8F0',
              }}
            >
              Batal
            </AlertDialogCancel>
            <button 
              type="button"
              disabled={isResetting || confirmStockText !== 'RESET STOK'}
              onClick={handleResetStocksOnly}
              className="h-11 px-5 rounded-xl font-black text-xs transition-all flex-1 flex items-center justify-center border-none"
              style={{
                backgroundColor: confirmStockText === 'RESET STOK' ? '#D97706' : '#475569',
                color: '#FFFFFF',
                cursor: confirmStockText === 'RESET STOK' && !isResetting ? 'pointer' : 'not-allowed',
                boxShadow: confirmStockText === 'RESET STOK' ? '0 4px 14px rgba(217, 119, 6, 0.4)' : 'none',
              }}
            >
              {isResetting ? 'Mereset Stok...' : 'Konfirmasi Reset Stok'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
