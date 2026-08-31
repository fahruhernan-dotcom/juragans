import React, { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Phone, MapPin, Star, Building2, Store, Package,
  ChevronRight, Calculator, CheckCircle2,
  Calendar, Info, AlertCircle, Trash2, Edit,
  Wallet, Receipt, ChevronDown, Check, Plus, Filter,
  TrendingDown, TrendingUp, History, MessageCircle, ExternalLink, ShieldCheck, CreditCard, Sparkles,
  MoreVertical, FileText, Printer, Share2, Layers
} from 'lucide-react'
import { toWaLink, CUSTOMER_TYPES } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal'
import {
  useSembakoCustomers, useSembakoSuppliers,
  useSembakoCustomerInvoices, useSembakoCustomerPayments,
  useSembakoSupplierInvoices, useRecordSembakoPayment,
  useSembakoSupplierPayments, useRecordSembakoSupplierPayment,
  useDeleteSembakoSupplierPayment,
  useUpdateSembakoCustomer, useUpdateSembakoSupplier,
  useDeleteSembakoCustomer, useDeleteSembakoSupplier
} from '@/lib/hooks/useSembakoData'
import { recordAuditLog } from '@/lib/hooks/useSembakoAudit'
import {
  formatIDR, formatDate,
  formatIDRShort
} from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import EmptyState from '@/components/EmptyState'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

export default function SembakoTokoSupplierDetail() {
  const { type, id } = useParams() // type: 'customer' | 'supplier'
  const isCustomer = type === 'customer'
  const navigate = useNavigate()
  const { profile, tenant } = useAuth()
  const queryClient = useQueryClient()

  // Data Queries
  const { data: allCustomers, isLoading: loadingCustomers } = useSembakoCustomers()
  const { data: allSuppliers, isLoading: loadingSuppliers } = useSembakoSuppliers()

  const profileData = useMemo(() => {
    if (isCustomer) return allCustomers?.find(c => c.id === id)
    return allSuppliers?.find(s => s.id === id)
  }, [allCustomers, allSuppliers, id, isCustomer])

  const { data: customerInvoices, isLoading: loadingCInvoices } = useSembakoCustomerInvoices(isCustomer ? id : null)
  const { data: customerPayments } = useSembakoCustomerPayments(isCustomer ? id : null)
  const { data: supplierInvoices, isLoading: loadingSInvoices } = useSembakoSupplierInvoices(!isCustomer ? id : null)
  const { data: supplierPayments } = useSembakoSupplierPayments(!isCustomer ? id : null)

  const [openModal, setOpenModal] = useState(null) // 'bayar' | 'edit'
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [deleteTransactions, setDeleteTransactions] = useState(false)
  const [invoiceModalData, setInvoiceModalData] = useState({ open: false, data: null, type: 'sembako_sale' })

  const deleteCustomer = useDeleteSembakoCustomer()
  const deleteSupplier = useDeleteSembakoSupplier()

  const handleConfirmDelete = async () => {
    try {
      const entityName = profileData?.customer_name || profileData?.supplier_name || (isCustomer ? 'Toko' : 'Supplier')
      if (isCustomer) {
        await deleteCustomer.mutateAsync({ id, deleteTransactions })
      } else {
        await deleteSupplier.mutateAsync({ id, deleteTransactions })
      }

      // Record audit log for security & history tracking
      await recordAuditLog({
        action_type: isCustomer ? 'DELETE_CUSTOMER' : 'DELETE_SUPPLIER',
        product_name: entityName,
        old_value: 'Aktif',
        new_value: 'Dihapus (Soft Delete)',
        notes: `Hapus ${isCustomer ? 'Toko' : 'Supplier'} '${entityName}'${deleteTransactions ? ' beserta seluruh riwayat transaksi terkait' : ' (riwayat transaksi dipertahankan)'}`,
        profile,
        tenant_id: tenant?.id,
      })

      setOpenDeleteDialog(false)
      navigate(-1)
    } catch (_err) {
      // toast is already handled inside the mutation hooks
    }
  }

  const supplierTotalCost = useMemo(() => {
    if (isCustomer) return 0
    return supplierInvoices?.reduce((s, b) => s + (b.total_cost || 0), 0) || 0
  }, [isCustomer, supplierInvoices])

  const supplierTotalPaid = useMemo(() => {
    if (isCustomer) return 0
    return supplierPayments?.reduce((s, p) => s + (p.amount || 0), 0) || 0
  }, [isCustomer, supplierPayments])

  const supplierTotalHutang = useMemo(() => {
    return Math.max(0, supplierTotalCost - supplierTotalPaid)
  }, [supplierTotalCost, supplierTotalPaid])

  const supplierOverpay = useMemo(() => {
    return Math.max(0, supplierTotalPaid - supplierTotalCost)
  }, [supplierTotalCost, supplierTotalPaid])

  // FIFO payment allocation across supplier batches
  const supplierInvoicesWithDebt = useMemo(() => {
    if (isCustomer || !supplierInvoices?.length) return []

    // Sort oldest first to calculate FIFO debt
    const sortedOldest = [...supplierInvoices].sort((a, b) => new Date(a.purchase_date || 0) - new Date(b.purchase_date || 0))
    let remainingPaymentPool = supplierTotalPaid

    const withDebt = sortedOldest.map(b => {
      const cost = Number(b.total_cost) || 0
      const paid = Math.min(remainingPaymentPool, cost)
      remainingPaymentPool = Math.max(0, remainingPaymentPool - paid)
      const remainingDebt = Math.max(0, cost - paid)
      const status = remainingDebt === 0 ? 'lunas' : (paid > 0 ? 'sebagian' : 'belum_lunas')

      return {
        ...b,
        paid_amount: paid,
        remaining_debt: remainingDebt,
        payment_status: status
      }
    })

    // Return sorted newest first for display
    return withDebt.sort((a, b) => new Date(b.purchase_date || 0) - new Date(a.purchase_date || 0))
  }, [isCustomer, supplierInvoices, supplierTotalPaid])

  if (!profileData && !loadingCustomers && !loadingSuppliers && !loadingCInvoices && !loadingSInvoices) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6 text-foreground">
        <EmptyState
          icon={AlertCircle}
          title="Data Tidak Ditemukan"
          description="Link mungkin sudah kedaluwarsa atau data telah dihapus."
          action={<Button onClick={() => navigate('../')} className="bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 rounded-xl font-bold border-none shadow-tko-brand">Kembali</Button>}
        />
      </div>
    )
  }

  const outstanding = isCustomer
    ? (customerInvoices || []).reduce((sum, inv) => sum + (Number(inv.remaining_amount) || 0), 0)
    : 0
  const activeCount = isCustomer ? customerInvoices?.filter(i => i.remaining_amount > 0).length : 0

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="bg-background min-h-screen pb-24 text-foreground selection:bg-slate-200 selection:text-slate-800"
    >
      {/* Dynamic Background Glow (Removed in Minimalist Light Mode) */}

      {/* Header Bar */}
      <header className="px-4 sm:px-8 py-5 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-md z-40 border-b border-border/60 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-muted hover:bg-muted/80 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95 group cursor-pointer"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-foreground tracking-widest uppercase bg-muted px-2 py-0.5 rounded-md border border-border/60">
                {isCustomer ? 'Toko / Customer' : 'Supplier / Agen'}
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight uppercase truncate max-w-[280px] sm:max-w-md">
              {profileData?.customer_name || profileData?.supplier_name || 'Loading...'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenModal('edit')}
            className="bg-card hover:bg-muted border-border/60 text-muted-foreground hover:text-foreground rounded-xl font-bold text-xs gap-2 px-3.5 h-10 shadow-sm cursor-pointer"
          >
            <Edit size={14} className="text-muted-foreground" />
            <span className="hidden sm:inline">Edit Profil</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-10 h-10 rounded-xl bg-card hover:bg-muted border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm active:scale-95"
                aria-label="Menu Opsi"
              >
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-card border border-border/60 shadow-xl rounded-2xl p-1.5 z-[6000]">
              <DropdownMenuItem
                onClick={() => setOpenModal('edit')}
                className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-foreground rounded-xl cursor-pointer hover:bg-muted focus:bg-muted transition-colors"
              >
                <Edit size={15} className="text-muted-foreground" />
                <span>Edit Profil</span>
              </DropdownMenuItem>

              {profileData?.phone && (
                <DropdownMenuItem asChild>
                  <a
                    href={toWaLink(profileData.phone) || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-foreground rounded-xl cursor-pointer hover:bg-muted focus:bg-muted transition-colors"
                  >
                    <MessageCircle size={15} className="text-emerald-500" />
                    <span>Hubungi WhatsApp</span>
                  </a>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="my-1 bg-border/40" />

              <DropdownMenuItem
                onClick={() => setOpenDeleteDialog(true)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-rose-500 rounded-xl cursor-pointer hover:bg-rose-500/10 focus:bg-rose-500/10 focus:text-rose-500 transition-colors"
              >
                <Trash2 size={15} />
                <span>Hapus {isCustomer ? 'Toko' : 'Supplier'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="px-4 sm:px-8 pt-6 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column: Profile Card & Actions */}
          <div className="lg:col-span-5 space-y-6">

            {/* Main Profile Card */}
            <Card className="bg-card border border-border/60 rounded-[28px] p-6 shadow-sm relative overflow-hidden group">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16 rounded-2xl bg-muted border border-border/60 shadow-sm shrink-0">
                  <AvatarFallback className="bg-transparent text-muted-foreground font-display font-black text-2xl tracking-wider">
                    {(profileData?.customer_name || profileData?.supplier_name || 'TS')?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display font-black text-foreground text-xl sm:text-2xl tracking-tight leading-tight uppercase truncate">
                      {profileData?.customer_name || profileData?.supplier_name}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {isCustomer && (
                      <Badge className="bg-muted text-muted-foreground border border-border/60 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg shadow-none">
                        {profileData?.customer_type || 'Toko'}
                      </Badge>
                    )}
                    <Badge className="bg-[#0F172A]/10 text-[#0F172A] border border-[#0F172A]/20 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-none">
                      <Star size={10} className="fill-amber-500 text-[#0F172A]" />
                      <span>{profileData?.reliability_score || 5}.0 Rating</span>
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator className="bg-border/60 my-5" />

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3.5 rounded-2xl border border-border/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone size={12} className="text-muted-foreground" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">No. HP / WA</span>
                  </div>
                  <p className="text-sm font-bold text-foreground truncate">
                    {profileData?.phone || '-'}
                  </p>
                </div>

                <div className="bg-muted p-3.5 rounded-2xl border border-border/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin size={12} className="text-emerald-600" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Area / Wilayah</span>
                  </div>
                  <p className="text-sm font-bold text-foreground truncate">
                    {profileData?.area || 'Utama'}
                  </p>
                </div>

                <div className="bg-muted p-3.5 rounded-2xl border border-border/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ShieldCheck size={12} className="text-blue-600" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Termin Bayar</span>
                  </div>
                  <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400 uppercase">
                    {profileData?.payment_terms || 'CASH'}
                  </p>
                </div>

                <div className="bg-muted p-3.5 rounded-2xl border border-border/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CreditCard size={12} className="text-purple-600" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Limit Kredit</span>
                  </div>
                  <p className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
                    {profileData?.credit_limit ? formatIDRShort(profileData.credit_limit) : 'Rp 0'}
                  </p>
                </div>
              </div>

              <div className="bg-muted p-3.5 rounded-2xl border border-border/40 mt-4 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 size={12} className="text-muted-foreground" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Alamat Lengkap</span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground line-clamp-2 leading-relaxed">
                  {profileData?.address || 'Belum ada catatan alamat'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-2">
                <Button
                  asChild
                  className="w-full bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 h-13 rounded-2xl font-black text-xs uppercase tracking-widest gap-2.5 shadow-tko-brand border-none active:scale-[0.98] transition-all"
                >
                  <a href={toWaLink(profileData?.phone) || '#'} target="_blank" rel="noreferrer">
                    <MessageCircle size={18} className="fill-white/10" />
                    Hubungi via WhatsApp
                    <ExternalLink size={14} className="opacity-70 ml-auto" />
                  </a>
                </Button>
              </div>
            </Card>

          </div>

          {/* Right Column: Financial Summary & Transaction Logs */}
          <div className="lg:col-span-7 space-y-6">

            {/* Financial Summary Card */}
            {isCustomer ? (
              <Card className="rounded-[28px] p-6 border border-border/60 bg-card shadow-sm relative overflow-hidden transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        outstanding > 0 ? "bg-rose-500" : "bg-emerald-500"
                      )} />
                      <p className={cn(
                        "text-xs font-black uppercase tracking-widest leading-none",
                        outstanding > 0 ? "text-rose-500" : "text-emerald-500"
                      )}>
                        Saldo Piutang Toko Aktif
                      </p>
                    </div>
                    <p className={cn(
                      "font-display text-4xl sm:text-5xl font-black tracking-tight tabular-nums pt-1",
                      outstanding > 0 ? "text-rose-500" : "text-emerald-500"
                    )}>
                      {formatIDR(outstanding)}
                    </p>
                  </div>

                  <div className={cn(
                    "p-4 rounded-2xl border shrink-0",
                    outstanding > 0 ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  )}>
                    {outstanding > 0
                      ? <TrendingDown size={28} className="text-rose-500" />
                      : <TrendingUp size={28} className="text-emerald-400" />
                    }
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>{activeCount} Nota Belum Lunas</span>
                  <span className="text-muted-foreground">
                    Status: <strong className={outstanding > 0 ? "text-rose-500" : "text-emerald-500"}>
                      {outstanding > 0 ? 'Ada Piutang' : 'Lunas Bersih'}
                    </strong>
                  </span>
                </div>
              </Card>
            ) : (
              <Card className="bg-card border border-border/60 rounded-[28px] p-6 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        supplierTotalHutang > 0 ? "bg-rose-500" : "bg-emerald-500"
                      )} />
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest leading-none">
                        Total Belanja Stok Supplier
                      </p>
                    </div>
                    <p className="font-display text-4xl sm:text-5xl font-black text-foreground tracking-tight tabular-nums pt-1">
                      {formatIDR(supplierTotalCost)}
                    </p>
                  </div>

                  <div className={cn(
                    "p-4 rounded-2xl border shrink-0",
                    supplierTotalHutang > 0 ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  )}>
                    {supplierTotalHutang > 0
                      ? <TrendingDown size={28} className="text-rose-500" />
                      : <TrendingUp size={28} className="text-emerald-400" />
                    }
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-border/40 grid grid-cols-2 gap-4">
                  <div className="space-y-1 bg-muted p-3 rounded-2xl border border-border/40">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Total Terbayar</p>
                    <p className="text-base font-black text-emerald-500 tabular-nums">
                      {formatIDR(supplierTotalPaid)}
                    </p>
                    {supplierOverpay > 0 && (
                      <p className="text-[10px] font-bold text-amber-500 mt-0.5">
                        ✨ Lebih Bayar: +{formatIDR(supplierOverpay)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 bg-muted p-3 rounded-2xl border border-border/40">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Sisa Hutang</p>
                    <p className={cn("text-base font-black tabular-nums", supplierTotalHutang > 0 ? "text-rose-500" : "text-emerald-500")}>
                      {supplierTotalHutang > 0 ? formatIDR(supplierTotalHutang) : 'Rp 0 (Lunas)'}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Activity Tabs */}
            <Card className="bg-card border border-border/60 rounded-[28px] p-6 shadow-sm">
              <Tabs defaultValue="log" className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display font-black text-foreground text-xl tracking-tight uppercase leading-none flex items-center gap-2">
                      <History size={20} className="text-muted-foreground" />
                      Riwayat Aktivitas & Transaksi
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1">Daftar invoice, retur, dan catatan pembayaran</p>
                  </div>

                  <TabsList className="bg-muted border border-border/40 h-11 p-1 rounded-2xl self-start sm:self-auto">
                    <TabsTrigger value="log" className="text-xs font-bold uppercase px-4 h-9 rounded-xl text-muted-foreground data-[state=active]:bg-[#0F172A] dark:data-[state=active]:bg-tko-brand-500 dark:data-[state=active]:text-tko-forest-950 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                      Tagihan / Stok
                    </TabsTrigger>
                    <TabsTrigger value="pembayaran" className="text-xs font-bold uppercase px-4 h-9 rounded-xl text-muted-foreground data-[state=active]:bg-[#0F172A] dark:data-[state=active]:bg-tko-brand-500 dark:data-[state=active]:text-tko-forest-950 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                      Pembayaran
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="log" className="mt-0 space-y-4">
                  {isCustomer ? (
                    <CustomerInvoiceList
                      invoices={customerInvoices}
                      onPay={(inv) => { setSelectedInvoice(inv); setOpenModal('bayar') }}
                      onViewInvoice={(inv) => setInvoiceModalData({
                        open: true,
                        type: 'sembako_sale',
                        data: {
                          tenant,
                          invoice: inv,
                          customer: profileData,
                          items: inv.sembako_sale_items || [],
                          payments: inv.sembako_payments || []
                        }
                      })}
                    />
                  ) : (
                    <SupplierBatchList
                      batches={supplierInvoicesWithDebt}
                      supplier={profileData}
                      tenant={tenant}
                      onPayBatch={(batch) => { setSelectedInvoice(batch); setOpenModal('bayar') }}
                      onViewInvoice={(batch) => {
                        const poNo = `PO-${(batch.purchase_date || new Date().toISOString()).slice(0,10).replace(/-/g,'')}-${String(batch.id || '0000').slice(0,4).toUpperCase()}`
                        setInvoiceModalData({
                          open: true,
                          type: 'sembako_purchase',
                          data: {
                            tenant: { business_name: tenant?.business_name || 'Gudang Juragans', phone: tenant?.phone || '-' },
                            isPurchase: true,
                            invoice: {
                              invoice_number: poNo,
                              transaction_date: batch.purchase_date || batch.created_at || new Date().toISOString(),
                              total_amount: Number(batch.total_cost) || 0,
                              paid_amount: Number(batch.total_cost) || 0,
                              remaining_amount: 0,
                              payment_status: 'lunas',
                              notes: batch.notes || 'Bukti Pembelian & Restok Stok dari Supplier Mitra',
                            },
                            customer: {
                              customer_name: profileData?.supplier_name || 'Vendor Supplier',
                              phone: profileData?.phone || '-',
                              address: profileData?.address || '',
                              customer_type: 'Vendor Supplier'
                            },
                            items: [
                              {
                                product_name: batch.product_name || 'Item Bahan Baku / Kemasan',
                                quantity: Number(batch.qty_masuk) || 1,
                                unit: batch.unit || 'pcs',
                                price_per_unit: Number(batch.buy_price) || 0,
                                subtotal: Number(batch.total_cost) || 0,
                              }
                            ]
                          }
                        })
                      }}
                    />
                  )}
                </TabsContent>

                <TabsContent value="pembayaran" className="mt-0 space-y-4">
                  <div className="mb-4">
                    <Button
                      onClick={() => { setSelectedInvoice(null); setOpenModal('bayar') }}
                      className="w-full h-12 rounded-2xl bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 font-black text-xs uppercase tracking-widest gap-2 shadow-tko-brand border-none active:scale-[0.98] transition-all"
                    >
                      <Plus size={16} /> {isCustomer ? 'Terima Pembayaran Piutang' : 'Catat Bayar Hutang Supplier'}
                    </Button>
                  </div>
                  <PaymentHistory payments={isCustomer ? customerPayments : supplierPayments} isCustomer={isCustomer} parentId={id} />
                </TabsContent>
              </Tabs>
            </Card>

          </div>

        </div>
      </main>

      {/* Sheets / Modals */}
      <Sheet open={openModal === 'bayar'} onOpenChange={(v) => { if (!v) { setOpenModal(null); setSelectedInvoice(null); } }}>
        <SheetContent side="right" className="bg-card border-border/60 text-foreground text-left p-6 sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-display font-black text-foreground uppercase text-xl text-left flex items-center gap-2">
              <Wallet size={22} className="text-muted-foreground" />
              {isCustomer ? 'Terima Pembayaran Piutang' : 'Catat Bayar Hutang Supplier'}
            </SheetTitle>
            <SheetDescription className="sr-only">Form untuk mencatat pembayaran sembako.</SheetDescription>
          </SheetHeader>
          <PaymentForm
            key={selectedInvoice?.id || (openModal === 'bayar' ? 'open' : 'closed')}
            initialInvoice={selectedInvoice}
            invoices={isCustomer ? customerInvoices : supplierInvoicesWithDebt}
            isCustomer={isCustomer}
            parentId={id}
            totalHutang={isCustomer ? outstanding : supplierTotalHutang}
            onClose={() => { setOpenModal(null); setSelectedInvoice(null); queryClient.invalidateQueries() }}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={openModal === 'edit'} onOpenChange={(v) => !v && setOpenModal(null)}>
        <SheetContent side="right" className="bg-card border-border/60 text-foreground text-left p-6 sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle className="font-display font-black text-foreground uppercase text-xl text-left flex items-center gap-2">
              <Edit size={20} className="text-muted-foreground" />
              Edit Profil {isCustomer ? 'Toko' : 'Supplier'}
            </SheetTitle>
            <SheetDescription className="sr-only">Form untuk memperbarui profil customer atau supplier sembako.</SheetDescription>
          </SheetHeader>
          <EditProfileForm
            key={profileData?.id || 'edit'}
            profile={profileData}
            isCustomer={isCustomer}
            onClose={() => { setOpenModal(null); queryClient.invalidateQueries() }}
            onRequestDelete={() => {
              setOpenModal(null)
              setOpenDeleteDialog(true)
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Alert Dialog Delete Confirmation */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent className="bg-card border border-border/60 rounded-3xl max-w-md p-6 shadow-2xl text-left">
          <AlertDialogHeader className="space-y-3 text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <Trash2 size={24} />
            </div>
            <div>
              <AlertDialogTitle className="text-foreground font-black text-lg tracking-tight font-display">
                Hapus {isCustomer ? 'Toko / Pelanggan' : 'Supplier'}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-xs leading-relaxed mt-1.5">
                Apakah Anda yakin ingin menghapus <strong className="text-foreground font-bold">{profileData?.customer_name || profileData?.supplier_name}</strong>?
                Data riwayat transaksi lama akan tetap tersimpan secara aman dalam arsip sistem.
              </AlertDialogDescription>
            </div>

            {((isCustomer && outstanding > 0) || (!isCustomer && supplierTotalHutang > 0)) && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                <div className="leading-relaxed">
                  <strong className="block font-bold">Peringatan Tagihan:</strong>
                  Masih terdapat {isCustomer ? 'saldo piutang' : 'sisa hutang belanja'} sebesar <strong className="text-foreground">{formatIDR(isCustomer ? outstanding : supplierTotalHutang)}</strong>.
                </div>
              </div>
            )}

            <div className="p-3.5 bg-muted/60 border border-border/60 rounded-2xl space-y-1.5 mt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deleteTransactions}
                  onChange={(e) => setDeleteTransactions(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-border text-[#0F172A] focus:ring-0 cursor-pointer accent-[#0F172A] dark:accent-tko-brand-500"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground block">
                    Hapus juga semua riwayat transaksi & nota terkait
                  </span>
                  <span className="text-[11px] text-muted-foreground block leading-tight">
                    {isCustomer
                      ? 'Nota penjualan & riwayat pembayaran toko ini akan disembunyikan dari laporan aktif.'
                      : 'Batch stok masuk & riwayat pembayaran ke supplier ini akan disembunyikan dari laporan aktif.'}
                  </span>
                </div>
              </label>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2.5 mt-4">
            <AlertDialogCancel className="flex-1 h-11 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border-border/60 cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs border-none shadow-md shadow-rose-500/20 cursor-pointer"
            >
              {deleteCustomer.isPending || deleteSupplier.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice & Bukti Pembelian Preview Modal */}
      {invoiceModalData.open && (
        <InvoicePreviewModal
          isOpen={invoiceModalData.open}
          onClose={() => setInvoiceModalData({ open: false, data: null, type: 'sembako_sale' })}
          type={invoiceModalData.type}
          data={invoiceModalData.data}
        />
      )}

    </motion.div>
  )
}

function CustomerInvoiceList({ invoices, onPay, onViewInvoice }) {
  if (!invoices?.length) {
    return (
      <EmptyState
        icon={Receipt}
        title="Belum ada transaksi"
        description="Transaksi penjualan dengan toko ini akan tercatat otomatis di sini."
      />
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
      {invoices.map(inv => {
        const telahDibayar = (Number(inv.total_amount) || 0) - (Number(inv.remaining_amount) || 0)
        return (
          <motion.div key={inv.id} variants={fadeUp}>
            <Card className="bg-muted/30 border-border/60 hover:border-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Header: Date, Invoice number & Status Badge */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="text-sm font-black text-foreground uppercase tracking-tight">{inv.invoice_number}</p>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-3.5">
                    {formatDate(inv.transaction_date)}
                  </p>
                </div>
                <Badge className={cn(
                  "border rounded-lg text-[10px] font-black uppercase px-2.5 py-1 tracking-wider shadow-none",
                  inv.payment_status === 'lunas' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                    inv.payment_status === 'sebagian' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                )}>
                  {inv.payment_status?.replace('_', ' ')}
                </Badge>
              </div>

              {/* Financial Details Box */}
              <div className="bg-card border border-border/40 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-muted-foreground">Total Tagihan</span>
                  <span className="font-black text-foreground tabular-nums">{formatIDR(inv.total_amount)}</span>
                </div>

                {telahDibayar > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-muted-foreground">Telah Dibayar</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatIDR(telahDibayar)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-border/40 flex justify-between items-center text-xs">
                  <span className="font-black text-muted-foreground">Sisa Piutang</span>
                  <span className={cn("font-black text-sm tabular-nums", inv.remaining_amount > 0 ? "text-rose-500" : "text-emerald-500")}>
                    {formatIDR(inv.remaining_amount)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {onViewInvoice && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onViewInvoice(inv)}
                    className="flex-1 h-10 rounded-xl border-border/70 hover:bg-muted font-bold text-xs gap-1.5 transition-all active:scale-[0.98]"
                  >
                    <FileText size={14} className="text-muted-foreground" />
                    Lihat Faktur
                  </Button>
                )}
                {inv.payment_status !== 'lunas' && (
                  <Button
                    onClick={() => onPay(inv)}
                    className="flex-1 bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 text-xs font-black h-10 rounded-xl shadow-tko-brand border-none transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <CreditCard size={14} />
                    BAYAR PIUTANG
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function SupplierBatchList({ batches, supplier, tenant, onViewInvoice, onPayBatch }) {
  if (!batches?.length) {
    return (
      <EmptyState
        icon={History}
        title="Belum ada stok masuk"
        description="Riwayat pembelian bahan, kemasan, atau produk dari supplier akan muncul di sini."
      />
    )
  }

  const handleSendWA = (batch) => {
    if (!supplier?.phone) {
      toast.error('Nomor WhatsApp supplier belum dicatat')
      return
    }
    const msg = `Halo ${supplier?.supplier_name || 'Mitra Supplier'}, berikut konfirmasi catatan transaksi pembelian / restok stok gudang dari *${tenant?.business_name || 'Juragans'}*:

📄 *No. Referensi*: PO-${(batch.purchase_date || new Date().toISOString()).slice(0,10).replace(/-/g,'')}-${String(batch.id || '0000').slice(0,4).toUpperCase()}
📅 *Tanggal*: ${formatDate(batch.purchase_date)}
📦 *Barang*: ${batch.product_name || 'Bahan Baku / Kemasan'}
📊 *Jumlah Masuk*: ${batch.qty_masuk} ${batch.unit || 'pcs'}
💵 *Harga Satuan*: ${formatIDR(batch.buy_price || 0)} / ${batch.unit || 'pcs'}
💰 *Total Nilai Nota*: ${formatIDR(batch.total_cost || 0)}
${batch.notes ? `\n📝 *Catatan*: ${batch.notes}` : ''}

Terima kasih atas kerja samanya! 🙏`

    window.open(toWaLink(supplier.phone, msg), '_blank')
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3.5">
      {batches.map(batch => {
        const title = batch.product_name || batch.sembako_products?.product_name || 'Bahan Baku / Produk'
        const unit = batch.unit || batch.sembako_products?.unit || 'Unit'
        const categoryLabel = batch.category_label || (batch.sembako_products ? 'Produk Jadi' : 'Bahan Baku')
        const isBahan = batch.item_category === 'bahan_baku' || categoryLabel.includes('Bahan')
        const isKemasan = batch.item_category === 'kemasan' || categoryLabel.includes('Kemasan')
        const isStiker = String(title).toLowerCase().includes('stiker') || String(title).toLowerCase().includes('label') || String(title).toLowerCase().includes('cutting')
        const isPouch = String(title).toLowerCase().includes('pouch') || String(title).toLowerCase().includes('toples')
        const isCurah = String(title).toLowerCase().includes('murni') || String(title).toLowerCase().includes('kripsy') || String(title).toLowerCase().includes('bawang')

        const poCode = `PO-${(batch.purchase_date || new Date().toISOString()).slice(0,10).replace(/-/g,'')}-${String(batch.id || '0000').slice(0,4).toUpperCase()}`
        const remainingDebt = batch.remaining_debt !== undefined ? Number(batch.remaining_debt) : Number(batch.total_cost)
        const isLunas = remainingDebt === 0
        const isSebagian = remainingDebt > 0 && Number(batch.paid_amount) > 0

        return (
          <motion.div key={batch.id} variants={fadeUp}>
            <Card className="bg-muted/30 border border-border/60 hover:border-border rounded-[22px] p-5 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Header: Date, PO Code, Category Badge & Qty Tag */}
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 font-bold text-slate-900 dark:text-white text-xs">
                      <Calendar size={12} className="text-slate-400" />
                      {formatDate(batch.purchase_date)}
                    </span>
                    <Badge className={cn(
                      "text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md border shadow-none",
                      isCurah ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" :
                      isStiker ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30" :
                      isPouch || isKemasan ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30" :
                      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    )}>
                      {categoryLabel}
                    </Badge>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/50">
                      {poCode}
                    </span>
                  </div>
                  <p className="text-base font-black text-foreground uppercase tracking-tight leading-snug pt-0.5">
                    {title}
                  </p>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                  <Badge className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black px-3 py-1 rounded-xl shadow-none">
                    +{batch.qty_masuk} {unit}
                  </Badge>
                  <Badge className={cn(
                    "text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md border shadow-none",
                    isLunas ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" :
                    isSebagian ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" :
                    "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  )}>
                    {isLunas ? 'Lunas' : isSebagian ? `Sisa ${formatIDR(remainingDebt)}` : 'Hutang Belum Bayar'}
                  </Badge>
                </div>
              </div>

              {/* Pricing & Stock Card */}
              <div className="bg-card border border-border/50 rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Nilai Pembelian / Nota</p>
                  <p className="font-black text-lg text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                    {formatIDR(batch.total_cost)}
                  </p>
                  {Number(batch.buy_price) > 0 && (
                    <p className="text-[11px] font-bold text-muted-foreground pt-0.5">
                      @ {formatIDR(batch.buy_price)} / {unit}
                    </p>
                  )}
                </div>

                <div className="sm:text-right space-y-1 sm:border-l sm:border-border/40 sm:pl-3">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Sisa Stok Fisik</p>
                  <div className="flex sm:justify-end items-center gap-1.5">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      Number(batch.qty_sisa) > 0 || batch.qty_sisa === '-' ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    )} />
                    <p className={cn(
                      "font-black text-base tabular-nums leading-none",
                      (Number(batch.qty_sisa) > 0 || batch.qty_sisa === '-') ? "text-slate-900 dark:text-white" : "text-muted-foreground"
                    )}>
                      {batch.qty_sisa !== undefined ? `${batch.qty_sisa} ${unit}` : '-'}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {Number(batch.qty_sisa) > 0 ? 'Batch Aktif di Gudang' : 'Batch Terpakai Habis'}
                  </p>
                </div>
              </div>

              {/* Notes if available */}
              {batch.notes && (
                <div className="p-2.5 rounded-xl bg-muted/60 border border-border/40 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
                  <Info size={13} className="shrink-0 mt-0.5 text-muted-foreground" />
                  <span className="italic">{batch.notes}</span>
                </div>
              )}

              {/* Action Buttons: Bayar Hutang, Lihat/Cetak Nota & Share WA */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-1 border-t border-border/40">
                {!isLunas && onPayBatch && (
                  <Button
                    type="button"
                    onClick={() => onPayBatch(batch)}
                    className="flex-1 sm:flex-none h-10 px-4 bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 font-black text-xs rounded-xl shadow-tko-brand border-none gap-1.5 transition-all active:scale-[0.98] uppercase tracking-wider"
                  >
                    <CreditCard size={14} />
                    Bayar Hutang
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onViewInvoice && onViewInvoice(batch)}
                  className="flex-1 h-10 rounded-xl border-border/70 hover:bg-muted font-bold text-xs gap-1.5 transition-all active:scale-[0.98]"
                >
                  <FileText size={14} className="text-amber-600 dark:text-amber-400" />
                  Lihat / Cetak Nota
                </Button>

                {supplier?.phone && supplier.phone !== '-' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSendWA(batch)}
                    className="h-10 px-3 rounded-xl border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs gap-1.5 transition-all active:scale-[0.98]"
                    title="Kirim Konfirmasi ke WhatsApp Supplier"
                  >
                    <MessageCircle size={14} />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function PaymentHistory({ payments, isCustomer, parentId }) {
  const deleteSupplierPayment = useDeleteSembakoSupplierPayment()
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeletePayment, setConfirmDeletePayment] = useState(null)

  if (!payments?.length) {
    return (
      <EmptyState
        icon={Wallet}
        title="Belum ada riwayat bayar"
        description="Semua cicilan dan pelunasan akan tercatat di sini."
      />
    )
  }

  const handleDelete = async (p) => {
    if (!isCustomer && p?.id) {
      setDeletingId(p.id)
      try {
        await deleteSupplierPayment.mutateAsync({ id: p.id, supplier_id: parentId })
        setConfirmDeletePayment(null)
      } catch (_e) {
        // Handled by hook
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <div className="space-y-3">
      {payments.map(p => (
        <Card key={p.id} className="bg-muted/30 border border-border/60 rounded-2xl p-4 flex justify-between items-center shadow-sm">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{formatDate(p.payment_date)}</p>
            {isCustomer && <p className="text-xs font-bold text-foreground uppercase">Nota: {p.sembako_sales?.invoice_number || '-'}</p>}
            {p.notes && <p className="text-[11px] text-muted-foreground italic truncate max-w-xs">{p.notes}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-black text-muted-foreground uppercase mb-0.5">{p.payment_method || 'Cash'}</p>
              <p className={cn("font-black text-base tabular-nums leading-none", isCustomer ? "text-emerald-500" : "text-rose-500")}>
                {isCustomer ? '+' : '-'}{formatIDR(p.amount)}
              </p>
            </div>
            {!isCustomer && (
              <button
                type="button"
                onClick={() => setConfirmDeletePayment(p)}
                disabled={deletingId === p.id}
                title="Hapus Catatan Pembayaran"
                className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-all cursor-pointer shrink-0 border border-rose-500/20 active:scale-95 disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </Card>
      ))}

      {/* Confirm Delete Dialog */}
      <AlertDialog open={!!confirmDeletePayment} onOpenChange={(v) => !v && setConfirmDeletePayment(null)}>
        <AlertDialogContent className="bg-card border-border/60 text-foreground rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-black text-foreground uppercase text-base">
              Hapus Catatan Pembayaran?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs">
              Pembayaran sebesar <strong>{formatIDR(confirmDeletePayment?.amount || 0)}</strong> pada tanggal {formatDate(confirmDeletePayment?.payment_date)} akan dihapus dari riwayat dan sisa hutang akan dihitung ulang secara otomatis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(confirmDeletePayment)}
              disabled={!!deletingId}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs border-none"
            >
              {deletingId ? 'Menghapus...' : 'Hapus Pembayaran'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PaymentForm({ initialInvoice, invoices = [], isCustomer, parentId, totalHutang = 0, onClose }) {
  const recordCustomerPayment = useRecordSembakoPayment()
  const recordSupplierPayment = useRecordSembakoSupplierPayment()

  // Filter only unpaid or partially paid transactions
  const unpaidTransactions = useMemo(() => {
    if (!invoices?.length) return []
    if (isCustomer) {
      return invoices.filter(inv => Number(inv.remaining_amount) > 0)
    }
    return invoices.filter(b => (b.remaining_debt !== undefined ? Number(b.remaining_debt) > 0 : Number(b.total_cost) > 0))
  }, [invoices, isCustomer])

  const [targetMode, setTargetMode] = useState(() => initialInvoice ? 'single' : (unpaidTransactions.length === 1 ? 'single' : 'all'))
  const [selectedTxId, setSelectedTxId] = useState(() => initialInvoice?.id || unpaidTransactions[0]?.id || '')

  const selectedTx = useMemo(() => {
    if (targetMode === 'all') return null
    return unpaidTransactions.find(t => String(t.id) === String(selectedTxId)) || initialInvoice || unpaidTransactions[0] || null
  }, [targetMode, selectedTxId, unpaidTransactions, initialInvoice])

  // Max payable amount for current selection
  const activeMaxAmount = useMemo(() => {
    if (targetMode === 'all') {
      return totalHutang || 0
    }
    if (!selectedTx) return 0
    if (isCustomer) {
      return Number(selectedTx.remaining_amount) || 0
    }
    return Number(selectedTx.remaining_debt ?? selectedTx.total_cost ?? 0)
  }, [targetMode, totalHutang, selectedTx, isCustomer])

  const [amount, setAmount] = useState(() => activeMaxAmount > 0 ? activeMaxAmount : 0)
  const [method, setMethod] = useState('transfer')
  const [refNo, setRefNo] = useState('')
  const [loading, setLoading] = useState(false)

  // Sync amount when target selection or activeMaxAmount changes
  useEffect(() => {
    if (activeMaxAmount > 0) {
      setAmount(activeMaxAmount)
    }
  }, [activeMaxAmount, selectedTxId, targetMode])

  const isOverpay = activeMaxAmount > 0 && amount > activeMaxAmount
  const isZeroDebt = activeMaxAmount <= 0

  const handlePay = async () => {
    if (amount <= 0) {
      toast.error('Nominal tidak valid (harus > Rp 0)')
      return
    }
    if (isZeroDebt) {
      toast.error(isCustomer ? 'Tidak ada piutang yang perlu dibayar' : 'Tidak ada sisa hutang ke supplier ini')
      return
    }
    if (isOverpay) {
      toast.error(`Nominal melebihi sisa ${isCustomer ? 'piutang' : 'hutang'} (${formatIDR(activeMaxAmount)})`)
      return
    }
    setLoading(true)
    try {
      if (isCustomer) {
        // Customer payment
        const targetSaleId = selectedTx?.id || unpaidTransactions[0]?.id
        if (!targetSaleId) {
          toast.error('Pilih faktur penjualan terlebih dahulu')
          return
        }
        await recordCustomerPayment.mutateAsync({
          sale_id: targetSaleId,
          customer_id: parentId,
          amount,
          payment_method: method,
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: refNo || null,
        })
      } else {
        // Supplier payment
        const txLabel = selectedTx 
          ? `PO-${(selectedTx.purchase_date || '').slice(0,10).replace(/-/g,'')}-${String(selectedTx.id || '').slice(0,4).toUpperCase()} (${selectedTx.product_name || 'Bahan'})`
          : 'Alokasi FIFO Otomatis'
        
        await recordSupplierPayment.mutateAsync({
          supplier_id: parentId,
          amount,
          payment_method: method,
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: refNo || (selectedTx ? `REF-${String(selectedTx.id).slice(0,6).toUpperCase()}` : null),
          notes: targetMode === 'single' ? `Bayar hutang ${txLabel}` : `Bayar hutang supplier (${txLabel})`
        })
      }
      onClose()
    } catch (_err) {
      // Handled by hook toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 pt-1">
      {/* Target Mode Selector (Semua vs Spesifik) */}
      <div className="space-y-2">
        <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">
          Fokus Target Pembayaran
        </Label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-2xl border border-border/50">
          <button
            type="button"
            onClick={() => setTargetMode('all')}
            className={cn(
              "h-10 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
              targetMode === 'all'
                ? "bg-[#0F172A] text-white dark:bg-tko-brand-500 dark:text-tko-forest-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>🌐 Semua Hutang (FIFO)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTargetMode('single')
              if (!selectedTxId && unpaidTransactions.length > 0) {
                setSelectedTxId(unpaidTransactions[0].id)
              }
            }}
            className={cn(
              "h-10 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
              targetMode === 'single'
                ? "bg-[#0F172A] text-white dark:bg-tko-brand-500 dark:text-tko-forest-950 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>🎯 Transaksi Spesifik ({unpaidTransactions.length})</span>
          </button>
        </div>
      </div>

      {/* Specific Transaction Picker Dropdown / List if targetMode === 'single' */}
      {targetMode === 'single' && (
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">
            Pilih Transaksi / PO yang Ingin Dibayarkan
          </Label>
          {unpaidTransactions.length > 0 ? (
            <Select
              value={String(selectedTxId || '')}
              onValueChange={(val) => {
                setSelectedTxId(val)
              }}
            >
              <SelectTrigger className="w-full h-14 bg-muted border-border/60 text-foreground font-bold text-xs rounded-2xl">
                <SelectValue placeholder="Pilih transaksi..." />
              </SelectTrigger>
              <SelectContent className="max-h-72 bg-popover border-border/60">
                {unpaidTransactions.map(tx => {
                  const title = tx.product_name || tx.sembako_products?.product_name || (isCustomer ? tx.invoice_number : 'Bahan / Kemasan')
                  const code = isCustomer 
                    ? tx.invoice_number 
                    : `PO-${(tx.purchase_date || '').slice(0,10).replace(/-/g,'')}-${String(tx.id || '').slice(0,4).toUpperCase()}`
                  const sisa = isCustomer ? tx.remaining_amount : (tx.remaining_debt ?? tx.total_cost)

                  return (
                    <SelectItem key={tx.id} value={String(tx.id)} className="py-2.5 cursor-pointer">
                      <div className="flex flex-col text-left gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[11px] text-muted-foreground">{code}</span>
                          <span className="font-black text-xs text-foreground uppercase truncate max-w-[180px]">{title}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{formatDate(tx.purchase_date || tx.transaction_date)}</span>
                          <span className="font-bold text-rose-500">Sisa: {formatIDR(sisa)}</span>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-3 bg-muted rounded-xl text-center text-xs text-muted-foreground">
              Semua transaksi telah lunas tercatat.
            </div>
          )}
        </div>
      )}

      {/* Sisa Hutang/Piutang Focus Card */}
      <div className={cn(
        "text-center space-y-1 p-5 rounded-2xl border transition-all",
        isCustomer ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
      )}>
        <p className="text-[10px] font-black uppercase tracking-widest">
          {targetMode === 'single' 
            ? (isCustomer ? `Sisa Piutang Nota (${selectedTx?.invoice_number || '-'})` : `Sisa Hutang Batch (${selectedTx?.product_name || 'Item'})`)
            : (isCustomer ? 'Total Sisa Piutang Toko' : 'Total Sisa Hutang Supplier')}
        </p>
        <p className="font-display text-3xl font-black tracking-tight tabular-nums">
          {formatIDR(activeMaxAmount || 0)}
        </p>
        {targetMode === 'single' && selectedTx && (
          <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
            {formatDate(selectedTx.purchase_date || selectedTx.transaction_date)} • Total Nota: {formatIDR(selectedTx.total_amount || selectedTx.total_cost || 0)}
          </p>
        )}
        {isZeroDebt && (
          <p className="text-xs font-black text-emerald-500 mt-1">✅ Tidak ada sisa tagihan</p>
        )}
      </div>

      <div className="space-y-4">
        {/* Jumlah Pembayaran */}
        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">
              Jumlah Pembayaran (Rp)
            </Label>
            {activeMaxAmount > 0 && (
              <button
                type="button"
                onClick={() => setAmount(activeMaxAmount)}
                className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Bayar Pas Lunas
              </button>
            )}
          </div>
          <InputRupiah
            value={amount}
            onChange={setAmount}
            className={cn(
              "bg-muted h-14 text-xl font-black text-foreground rounded-2xl border-border/60 focus:border-border transition-all",
              isOverpay
                ? "border-rose-500/50 focus:ring-rose-500/20"
                : "border-border/60 focus:ring-slate-250"
            )}
          />

          {/* Quick Preset Buttons */}
          {activeMaxAmount > 0 && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAmount(activeMaxAmount)}
                className="flex-1 py-1.5 px-2 rounded-lg bg-muted hover:bg-muted/80 text-[10px] font-bold text-foreground border border-border/50 transition-all active:scale-95 cursor-pointer"
              >
                100% (Lunas)
              </button>
              <button
                type="button"
                onClick={() => setAmount(Math.round(activeMaxAmount / 2))}
                className="flex-1 py-1.5 px-2 rounded-lg bg-muted hover:bg-muted/80 text-[10px] font-bold text-foreground border border-border/50 transition-all active:scale-95 cursor-pointer"
              >
                50% (Sebagian)
              </button>
              {activeMaxAmount > 500000 && (
                <button
                  type="button"
                  onClick={() => setAmount(500000)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-muted hover:bg-muted/80 text-[10px] font-bold text-foreground border border-border/50 transition-all active:scale-95 cursor-pointer"
                >
                  Rp 500rb
                </button>
              )}
            </div>
          )}

          {isOverpay && (
            <p className="text-xs font-bold text-rose-600 ml-1 flex items-center gap-1.5 pt-1">
              🚨 Melebihi sisa {isCustomer ? 'piutang' : 'hutang'} sebesar {formatIDR(amount - activeMaxAmount)}
            </p>
          )}
          {!isOverpay && amount > 0 && activeMaxAmount > 0 && amount === activeMaxAmount && (
            <p className="text-xs font-bold text-emerald-600 ml-1 flex items-center gap-1.5 pt-1">
              ✅ Pas — {targetMode === 'single' ? 'transaksi ini' : 'seluruh hutang'} akan lunas setelah pembayaran ini
            </p>
          )}
          {!isOverpay && amount > 0 && activeMaxAmount > 0 && amount < activeMaxAmount && (
            <p className="text-xs font-bold text-blue-600 ml-1 flex items-center gap-1.5 pt-1">
              ℹ️ Sisa {isCustomer ? 'piutang' : 'hutang'} setelah bayar: {formatIDR(activeMaxAmount - amount)}
            </p>
          )}
        </div>

        {/* Metode Pembayaran */}
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Metode Pembayaran</Label>
          <div className="flex gap-2">
            {['cash', 'transfer'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  "flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95",
                  method === m
                    ? "bg-[#0F172A] text-white dark:bg-tko-brand-500 dark:text-tko-forest-950 shadow-md"
                    : "bg-muted text-muted-foreground border border-border/60 hover:text-foreground"
                )}
              >
                {m === 'cash' ? 'Cash (Tunai)' : 'Transfer Bank'}
              </button>
            ))}
          </div>
        </div>

        {/* No Referensi / Catatan */}
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">No. Referensi (Opsional)</Label>
          <input
            value={refNo}
            onChange={e => setRefNo(e.target.value)}
            placeholder="Contoh: REF123 / No. Bukti Transfer..."
            className="w-full bg-muted border-border/60 h-12 px-4 text-sm font-bold text-foreground rounded-2xl focus:ring-border border focus:border-border outline-none transition-all"
          />
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <Button
            onClick={handlePay}
            disabled={loading || isOverpay || isZeroDebt || amount <= 0}
            className={cn(
              "w-full h-14 rounded-2xl text-xs font-black border-none shadow-tko-brand uppercase tracking-widest transition-all active:scale-95 text-white",
              (isOverpay || isZeroDebt || amount <= 0)
                ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                : "bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950"
            )}
          >
            {loading ? 'Memproses...' : isOverpay ? 'Nominal Terlalu Besar' : isZeroDebt ? 'Tagihan Sudah Lunas' : 'Konfirmasi Pembayaran'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function EditProfileForm({ profile: targetProfile, isCustomer, onClose, onRequestDelete }) {
  const { profile: userProfile, tenant } = useAuth()
  const updateCustomer = useUpdateSembakoCustomer()
  const updateSupplier = useUpdateSembakoSupplier()

  const [form, setForm] = useState({
    customer_name: targetProfile?.customer_name || '',
    supplier_name: targetProfile?.supplier_name || '',
    customer_type: targetProfile?.customer_type || 'perseorangan',
    phone: targetProfile?.phone || '',
    area: targetProfile?.area || '',
    address: targetProfile?.address || '',
    payment_terms: targetProfile?.payment_terms || 'cash',
    credit_limit: targetProfile?.credit_limit || 0,
    reliability_score: targetProfile?.reliability_score || 5,
    notes: targetProfile?.notes || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const entityName = isCustomer ? form.customer_name : form.supplier_name
      if (isCustomer) {
        await updateCustomer.mutateAsync({
          id: targetProfile.id,
          customer_name: form.customer_name,
          customer_type: form.customer_type,
          phone: form.phone,
          area: form.area,
          address: form.address,
          payment_terms: form.payment_terms,
          credit_limit: Number(form.credit_limit || 0),
          reliability_score: Number(form.reliability_score || 5),
        })
      } else {
        await updateSupplier.mutateAsync({
          id: targetProfile.id,
          supplier_name: form.supplier_name,
          phone: form.phone,
          area: form.area,
          address: form.address,
          notes: form.notes,
        })
      }

      await recordAuditLog({
        action_type: isCustomer ? 'EDIT_CUSTOMER' : 'EDIT_SUPPLIER',
        product_name: entityName,
        old_value: isCustomer ? targetProfile?.customer_name : targetProfile?.supplier_name,
        new_value: entityName,
        notes: `Update profil ${isCustomer ? 'Toko' : 'Supplier'} '${entityName}'`,
        profile: userProfile,
        tenant_id: tenant?.id,
      })

      onClose()
    } catch (_err) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      <div className="space-y-1.5">
        <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">
          {isCustomer ? 'Nama Toko / Pelanggan' : 'Nama Supplier / Pemasok'}
        </Label>
        <Input
          value={isCustomer ? form.customer_name : form.supplier_name}
          onChange={e => setForm(f => ({ ...f, [isCustomer ? 'customer_name' : 'supplier_name']: e.target.value }))}
          required
          className="bg-muted border-border/60 h-12 text-sm font-bold text-foreground rounded-xl focus:border-border"
        />
      </div>

      {isCustomer && (
        <div className="space-y-1.5">
          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Jenis Toko</Label>
          <Select
            value={form.customer_type}
            onValueChange={v => setForm(f => ({ ...f, customer_type: v }))}
          >
            <SelectTrigger className="bg-muted border-border/60 h-12 text-sm font-bold text-foreground rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/60 text-popover-foreground">
              {CUSTOMER_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="hover:bg-muted focus:bg-muted font-bold text-xs uppercase">
                  {type.replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">No. Handphone / WA</Label>
          <Input
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="0812..."
            className="bg-muted border-border/60 h-12 text-sm font-bold text-foreground rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Area / Wilayah</Label>
          <Input
            value={form.area}
            onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
            placeholder="Contoh: Utamakan"
            className="bg-muted border-border/60 h-12 text-sm font-bold text-foreground rounded-xl"
          />
        </div>
      </div>

      {isCustomer && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Termin Bayar</Label>
            <Select
              value={form.payment_terms}
              onValueChange={v => setForm(f => ({ ...f, payment_terms: v }))}
            >
              <SelectTrigger className="bg-muted border-border/60 h-12 text-sm font-bold text-foreground rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/60 text-popover-foreground">
                <SelectItem value="cash" className="hover:bg-muted focus:bg-muted">CASH / TUNAI</SelectItem>
                <SelectItem value="tempo_7" className="hover:bg-muted focus:bg-muted">Tempo 7 Hari</SelectItem>
                <SelectItem value="tempo_14" className="hover:bg-muted focus:bg-muted">Tempo 14 Hari</SelectItem>
                <SelectItem value="tempo_30" className="hover:bg-muted focus:bg-muted">Tempo 30 Hari</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Limit Kredit (Rp)</Label>
            <InputRupiah
              value={form.credit_limit}
              onChange={v => setForm(f => ({ ...f, credit_limit: v }))}
              className="bg-muted border-border/60 h-12 text-sm font-bold text-foreground rounded-xl"
            />
          </div>
        </div>
      )}

      {isCustomer && (
        <div className="space-y-1.5">
          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Rating Keandalan (1-5)</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setForm(f => ({ ...f, reliability_score: star }))}
                className={cn(
                  "flex-1 h-10 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95",
                  form.reliability_score === star
                    ? "bg-[#0F172A] text-white dark:bg-tko-brand-500 dark:text-tko-forest-950 font-extrabold shadow-sm"
                    : "bg-muted text-muted-foreground border border-border/60 hover:text-foreground"
                )}
              >
                <Star size={12} className={form.reliability_score === star ? "fill-white text-white" : ""} />
                {star}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isCustomer && (
        <div className="space-y-1.5">
          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Catatan Supplier</Label>
          <Input
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Contoh: Supplier gudang pusat barat..."
            className="bg-muted border-border/60 h-12 text-sm font-bold text-foreground rounded-xl"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Alamat Lengkap</Label>
        <Textarea
          value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          rows={3}
          placeholder="Jl. Merdeka No. 45..."
          className="bg-muted border-border/60 text-foreground text-sm font-bold rounded-xl resize-none"
        />
      </div>

      <div className="pt-3">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 h-13 rounded-2xl font-black text-xs uppercase tracking-widest shadow-tko-brand transition-all active:scale-95 border-none cursor-pointer"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
        </Button>
      </div>

      {onRequestDelete && (
        <div className="mt-8 pt-5 border-t border-border/60 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
              Zona Bahaya
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Menghapus {isCustomer ? 'toko' : 'supplier'} ini akan menyembunyikannya dari daftar aktif. Seluruh catatan riwayat transaksi dan audit tetap tersimpan aman.
          </p>
          <button
            type="button"
            onClick={onRequestDelete}
            className="w-full h-11 rounded-xl text-rose-500 hover:text-white hover:bg-rose-600 active:scale-[0.99] text-xs font-bold transition-all flex items-center justify-center gap-2 border border-rose-500/30 hover:border-rose-600 cursor-pointer"
          >
            <Trash2 size={14} />
            Hapus {isCustomer ? 'Toko / Pelanggan' : 'Supplier'} Ini
          </button>
        </div>
      )}
    </form>
  )
}
