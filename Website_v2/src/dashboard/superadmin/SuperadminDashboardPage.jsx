import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Users, Activity, Trash2, RefreshCw, 
  Search, CheckCircle2, Cpu, Database, 
  Zap, Server, Clock, ShieldCheck,
  ShieldAlert, AlertTriangle
} from 'lucide-react'
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
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/hooks/useAuth'
import SembakoRecycleBin from '@/dashboard/broker/sembako_broker/components/SembakoRecycleBin'
import KelolaAkunPage from '@/dashboard/broker/sembako_broker/KelolaAkunPage'
import { cn } from '@/lib/utils'

// License sub-components
import { useLicense } from '@/hooks/useLicense'
import { LicenseStatusCard, StatusBadge } from '@/components/license/LicenseStatusCard'
import { LicenseTimeline } from '@/components/license/LicenseTimeline'
import { LicenseActions } from '@/components/license/LicenseActions'
import { LicenseHistory } from '@/components/license/LicenseHistory'

export default function SuperadminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'license'

  const { user, tenant } = useAuth()
  const queryClient = useQueryClient()

  // Reset database states
  const [wipeTransactions] = useState(true)
  const [wipeCatalog, setWipeCatalog] = useState(false)
  const [showConfirm1, setShowConfirm1] = useState(false)
  const [showConfirm2, setShowConfirm2] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const [dbLatency, setDbLatency] = useState(null)
  const [isCheckingPing, setIsCheckingPing] = useState(false)
  const [copiedLogId, setCopiedLogId] = useState(null)

  // ── Real License State ──────────────────────────────────────────────────────
  const license = useLicense()

  // System Logs State
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
      }
    ]
  })

  // Dynamic Health Check Ping (Triggered on Demand)
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

  const handleClearLogs = () => {
    setSystemLogs([])
    localStorage.removeItem('ternakos_dev_logs')
    toast.success('Logs konsol berhasil dibersihkan')
  }

  const handleFlushCache = () => {
    queryClient.invalidateQueries()
    toast.success('React Query Cache berhasil dibersihkan')
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

        const { error: errCust } = await supabase.from('sembako_customers').delete().eq('tenant_id', tenantId)
        if (errCust) throw errCust

        const { error: errSupp } = await supabase.from('sembako_suppliers').delete().eq('tenant_id', tenantId)
        if (errSupp) throw errSupp

        const { error: errEmp } = await supabase.from('sembako_employees').delete().eq('tenant_id', tenantId)
        if (errEmp) throw errEmp
      } else {
        // Reset current_stock and avg_buy_price in sembako_products to 0
        const { error: errProdReset } = await supabase.from('sembako_products')
          .update({ current_stock: 0, avg_buy_price: 0 })
          .eq('tenant_id', tenantId)
        if (errProdReset) throw errProdReset
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

  const filteredLogs = useMemo(() => {
    return systemLogs.filter(log => {
      const matchFilter = logFilter === 'ALL' || log.level === logFilter
      const matchSearch = !logSearch || 
        log.message?.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.source?.toLowerCase().includes(logSearch.toLowerCase())
      return matchFilter && matchSearch
    })
  }, [systemLogs, logFilter, logSearch])

  const logLevelStyle = {
    INFO: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20',
    WARN: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
    ERROR: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400 border border-red-200 dark:border-red-500/20',
    DEBUG: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border border-slate-200 dark:border-white/10',
  }

  return (
    <div className="space-y-8 p-1">

      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Superadmin · System Command
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
            Ringkasan Pengelola System
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-lg leading-relaxed">
            Kelola lisensi server, pengguna tim, kesehatan database, serta log audit.
          </p>
        </div>

        {/* Health Check Widget */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2.5 bg-card border rounded-xl px-4 py-2.5 shadow-sm">
            <div className={cn(
              'w-2 h-2 rounded-full',
              dbLatency === null ? 'bg-emerald-500' :
              dbLatency < 300 ? 'bg-emerald-500 animate-pulse' :
              dbLatency < 600 ? 'bg-amber-500' : 'bg-red-500'
            )} />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Database</p>
              <p className="text-xs font-extrabold text-foreground">
                {dbLatency !== null ? `${dbLatency}ms` : 'Online'}
              </p>
            </div>
          </div>
          <Button
            onClick={checkHealth}
            disabled={isCheckingPing}
            variant="outline"
            size="sm"
            className="h-[42px] rounded-xl text-xs font-semibold gap-1.5 px-3"
          >
            <RefreshCw size={13} className={cn(isCheckingPing && 'animate-spin')} />
            Health Check
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Masa Server — dari Supabase plan_expires_at */}
        <Card className="p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Masa Lisensi</p>
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20">
              <Clock size={14} />
            </div>
          </div>
          {license.loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-7 w-24 bg-muted rounded-lg" />
              <div className="h-3 w-16 bg-muted rounded" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-extrabold text-foreground tracking-tight leading-none">
                {license.statusInfo?.status === 'PERMANENT' ? '∞' : (
                  <>
                    {Math.max(0, license.statusInfo?.daysRemaining ?? 0)}
                    <span className="text-sm font-semibold text-muted-foreground ml-1.5">hari</span>
                  </>
                )}
              </p>
              <div className="mt-2">
                <StatusBadge status={license.statusInfo?.status} size="sm" />
              </div>
            </>
          )}
        </Card>

        <Card className="p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Database</p>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
              <Database size={14} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">Online</p>
          <p className="text-[11px] text-muted-foreground font-medium mt-2">PostgreSQL 15 · Supabase</p>
        </Card>

        <Card className="p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pengguna</p>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
              <Users size={14} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground tracking-tight leading-none">
            3
            <span className="text-sm font-semibold text-muted-foreground ml-1.5">akun</span>
          </p>
          <p className="text-[11px] text-muted-foreground font-medium mt-2">Owner · Admin · Dev</p>
        </Card>

        <Card className="p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">System Logs</p>
            <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20">
              <Activity size={14} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground tracking-tight leading-none">
            {systemLogs.length}
            <span className="text-sm font-semibold text-muted-foreground ml-1.5">entri</span>
          </p>
          <p className="text-[11px] text-muted-foreground font-medium mt-2">Audit log status</p>
        </Card>

      </div>

      {/* ── Main Tabs ──────────────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border shadow-sm overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setSearchParams(val === 'license' ? {} : { tab: val })}
          className="w-full"
        >
          {/* Tab Navigation */}
          <div className="px-6 pt-5 border-b border-border/60">
            <TabsList className="bg-transparent p-0 h-auto gap-0 rounded-none flex items-center justify-start overflow-x-auto">
              {[
                { value: 'license',      label: 'Lisensi Server', icon: Server },
                { value: 'accounts',     label: 'Kelola Akun',    icon: Users },
                { value: 'logs',         label: 'Error Logs',     icon: Activity },
                { value: 'diagnostics',  label: 'Diagnostics',    icon: Cpu },
                { value: 'recycle',      label: 'Recycle Bin',    icon: Trash2 },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    'relative pb-3.5 pt-1 px-4 h-auto rounded-none bg-transparent text-xs font-semibold gap-1.5 shrink-0',
                    'text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-bold',
                    'data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-foreground data-[state=active]:after:rounded-full',
                    'hover:text-foreground transition-colors'
                  )}
                >
                  <Icon size={13} />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── TAB: LISENSI SERVER (Real Supabase License Management) ──────────── */}
          <TabsContent value="license" className="mt-0 p-6 space-y-0">
            <div className="space-y-1 mb-6">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                License Management
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Perbarui masa aktif server bisnis klien secara langsung. Semua perubahan tercatat di audit log.
              </p>
            </div>

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
                <div className="bg-muted/30 border rounded-2xl p-5">
                  <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-4">Alur Lisensi</h4>
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
                <Separator className="bg-border/50" />
                <LicenseHistory
                  history={license.history}
                  loading={license.historyLoading}
                  onRefresh={license.fetchHistory}
                />
              </div>
            </div>
          </TabsContent>

          {/* ── TAB: KELOLA AKUN ──────────────────────────────────────────────── */}
          <TabsContent value="accounts" className="mt-0 p-0">
            {activeTab === 'accounts' && <KelolaAkunPage />}
          </TabsContent>

          {/* ── TAB: ERROR LOGS ───────────────────────────────────────────────── */}
          <TabsContent value="logs" className="mt-0 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">System Error Logs</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{filteredLogs.length} entri ditemukan</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    placeholder="Cari log..."
                    className="pl-9 h-9 text-xs rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleClearLogs}
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl text-xs text-red-500 border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/10 gap-1.5 shrink-0"
                >
                  <Trash2 size={13} />
                  Clear
                </Button>
              </div>
            </div>

            <div className="bg-muted/30 border rounded-xl p-4 font-mono text-xs overflow-x-auto min-h-[340px] max-h-[480px] overflow-y-auto space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 size={22} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Tidak ada log</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Semua bersih, tidak ada error tercatat.</p>
                  </div>
                </div>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-lg bg-background border border-border/50 space-y-1.5 hover:border-border transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-black', logLevelStyle[log.level] || logLevelStyle.DEBUG)}>
                          {log.level}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground">{log.source}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground leading-relaxed">{log.message}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ── TAB: DIAGNOSTICS ─────────────────────────────────────────────── */}
          <TabsContent value="diagnostics" className="mt-0 p-6 space-y-6">

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Zap size={15} className="text-amber-500" />
                  Cache & Diagnostics Manager
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Hapus cache React Query untuk memaksa pengambilan data terbaru dari server.
                </p>
              </div>
              <Button
                onClick={handleFlushCache}
                size="sm"
                className="h-9 rounded-xl text-xs font-semibold gap-1.5"
              >
                <RefreshCw size={13} />
                Flush React Query Cache
              </Button>
            </div>

            <Separator />

            {/* Danger Zone */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-500/20 mt-0.5">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-600 dark:text-red-400">Zona Bahaya: Reset Database Bisnis</h3>
                  <p className="text-[11px] text-red-500/70 font-medium mt-0.5 uppercase tracking-wide">Hanya untuk Owner / Dev Superadmin</p>
                </div>
              </div>

              <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 rounded-xl p-5 space-y-4">
                <p className="text-xs font-semibold text-foreground">
                  Pilih cakupan data bisnis yang ingin dihapus dari database:
                </p>

                <div className="space-y-3 text-xs">
                  <label className="flex items-start gap-3 cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={wipeTransactions}
                      disabled
                      className="mt-0.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-red-600 focus:ring-red-500 cursor-not-allowed"
                    />
                    <div>
                      <p className="font-semibold text-foreground">Reset Transaksi & Operasional <span className="text-[10px] text-muted-foreground font-normal">(Wajib)</span></p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">Menghapus Nota Penjualan, Pembayaran, Trip Kirim, Kas Masuk/Keluar, Retur, Payroll, dan Logs.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                    <input
                      type="checkbox"
                      checked={wipeCatalog}
                      onChange={e => setWipeCatalog(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <p className="font-semibold text-foreground">Reset Katalog & Kontak <span className="text-[10px] text-muted-foreground font-normal">(Opsional)</span></p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">Menghapus Produk Katalog, Daftar Toko, Supplier, dan Pegawai.</p>
                    </div>
                  </label>
                </div>

                <div className="bg-red-100/80 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3 flex items-start gap-2.5">
                  <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 leading-relaxed">
                    Akun Login, Hak Akses, Tenant Bisnis, dan Info Langganan TIDAK akan dihapus.
                  </p>
                </div>

                <Button
                  onClick={() => setShowConfirm1(true)}
                  variant="destructive"
                  className="w-full h-10 rounded-xl text-xs font-bold tracking-wide"
                >
                  Mulai Reset Data Bisnis
                </Button>
              </div>
            </div>

          </TabsContent>

          {/* ── TAB: RECYCLE BIN ─────────────────────────────────────────────── */}
          <TabsContent value="recycle" className="mt-0 p-0">
            {activeTab === 'recycle' && <SembakoRecycleBin tenantId={tenant?.id || '00000000-0000-0000-0000-000000000002'} />}
          </TabsContent>

        </Tabs>
      </Card>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}

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
              Reset Database — Konfirmasi 1 dari 2
            </AlertDialogTitle>
            <AlertDialogDescription 
              className="font-medium mt-3 text-xs leading-relaxed"
              style={{ color: '#94A3B8' }}
            >
              Apakah Anda benar-benar yakin ingin melakukan reset data bisnis? Tindakan ini menghapus semua data operasional yang dipilih secara permanen.
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
              onClick={() => { setShowConfirm1(false); setTimeout(() => setShowConfirm2(true), 300) }}
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

      <AlertDialog open={showConfirm2} onOpenChange={(v) => { if (!v && !isResetting) { setShowConfirm2(false); setConfirmText('') } }}>
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
              PERINGATAN KERAS! — Konfirmasi 2 dari 2
            </AlertDialogTitle>
            <AlertDialogDescription 
              className="font-medium mt-3 text-xs leading-relaxed"
              style={{ color: '#CBD5E1' }}
            >
              Ini adalah langkah terakhir. Seluruh transaksi operasional akan bersih total.{' '}
              Ketik kata kunci <strong style={{ color: '#F87171', fontWeight: 900 }}>&ldquo;RESET DATABASE&rdquo;</strong> untuk mengonfirmasi:
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

    </div>
  )
}
