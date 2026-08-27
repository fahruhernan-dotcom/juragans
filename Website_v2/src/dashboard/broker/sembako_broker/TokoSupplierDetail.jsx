import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Phone, MapPin, Star, Building2, Store, Package,
  ChevronRight, Calculator, CheckCircle2,
  Calendar, Info, AlertCircle, Trash2, Edit,
  Wallet, Receipt, ChevronDown, Check, Plus, Filter,
  TrendingDown, TrendingUp, History, MessageCircle, ExternalLink, ShieldCheck, CreditCard, Sparkles,
  MoreVertical
} from 'lucide-react'
import { toWaLink, CUSTOMER_TYPES } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import {
  useSembakoCustomers, useSembakoSuppliers,
  useSembakoCustomerInvoices, useSembakoCustomerPayments,
  useSembakoSupplierInvoices, useRecordSembakoPayment,
  useSembakoSupplierPayments, useRecordSembakoSupplierPayment,
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

  const supplierTotalHutang = useMemo(() => {
    if (isCustomer) return 0;
    const totalCost = supplierInvoices?.reduce((s, b) => s + (b.total_cost || 0), 0) || 0;
    const totalPaid = supplierPayments?.reduce((s, p) => s + (p.amount || 0), 0) || 0;
    return Math.max(0, totalCost - totalPaid);
  }, [isCustomer, supplierInvoices, supplierPayments])

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
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest leading-none mb-2">Total Belanja Stok Supplier</p>
                <p className="font-display text-4xl sm:text-5xl font-black text-foreground tracking-tight tabular-nums">
                  {formatIDR(supplierInvoices?.reduce((acc, b) => acc + (b.total_cost || 0), 0) || 0)}
                </p>

                <div className="mt-6 pt-5 border-t border-border/40 grid grid-cols-2 gap-4">
                  <div className="space-y-1 bg-muted p-3 rounded-2xl border border-border/40">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Total Terbayar</p>
                    <p className="text-base font-black text-emerald-500 tabular-nums">
                      {formatIDR(supplierPayments?.reduce((s, p) => s + (p.amount || 0), 0) || 0)}
                    </p>
                  </div>
                  <div className="space-y-1 bg-muted p-3 rounded-2xl border border-border/40">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Sisa Hutang</p>
                    <p className="text-base font-black text-rose-500 tabular-nums">
                      {formatIDR(supplierTotalHutang)}
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
                    />
                  ) : (
                    <SupplierBatchList batches={supplierInvoices} />
                  )}
                </TabsContent>

                <TabsContent value="pembayaran" className="mt-0 space-y-4">
                  <div className="mb-4">
                    <Button
                      onClick={() => setOpenModal('bayar')}
                      className="w-full h-12 rounded-2xl bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 font-black text-xs uppercase tracking-widest gap-2 shadow-tko-brand border-none active:scale-[0.98] transition-all"
                    >
                      <Plus size={16} /> {isCustomer ? 'Terima Pembayaran Piutang' : 'Catat Bayar Hutang Supplier'}
                    </Button>
                  </div>
                  <PaymentHistory payments={isCustomer ? customerPayments : supplierPayments} isCustomer={isCustomer} />
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
              Catat Pembayaran
            </SheetTitle>
            <SheetDescription className="sr-only">Form untuk mencatat pembayaran sembako.</SheetDescription>
          </SheetHeader>
          {selectedInvoice || !isCustomer ? (
            <PaymentForm
              key={selectedInvoice?.id || 'supplier'}
              invoice={selectedInvoice}
              isCustomer={isCustomer}
              parentId={id}
              maxAmount={isCustomer ? selectedInvoice?.remaining_amount : supplierTotalHutang}
              onClose={() => { setOpenModal(null); setSelectedInvoice(null); queryClient.invalidateQueries() }}
            />
          ) : (
            <div className="text-center py-12 space-y-3">
              <Receipt size={40} className="mx-auto text-muted-foreground opacity-50" />
              <p className="text-muted-foreground font-bold text-xs uppercase">Pilih nota/invoice di tab Tagihan terlebih dahulu</p>
            </div>
          )}
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
    </motion.div>
  )
}

function CustomerInvoiceList({ invoices, onPay }) {
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
        const telahDibayar = inv.total_amount - inv.remaining_amount
        return (
          <motion.div key={inv.id} variants={fadeUp}>
            <Card className="bg-muted/30 border-border/60 hover:border-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Header: Date, Invoice number & Status Badge */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    <p className="text-sm font-black text-foreground uppercase tracking-tight">{inv.invoice_number}</p>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-3.5">
                    {formatDate(inv.transaction_date)}
                  </p>
                </div>
                <Badge className={cn(
                  "border rounded-lg text-[10px] font-black uppercase px-2.5 py-1 tracking-wider shadow-none",
                  inv.payment_status === 'lunas' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                    inv.payment_status === 'sebagian' ? "bg-[#0F172A]/10 text-[#0F172A] border-[#0F172A]/20" :
                      "bg-rose-500/10 text-rose-500 border-rose-500/20"
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
                    <span className="font-bold text-emerald-500 tabular-nums">{formatIDR(telahDibayar)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-border/40 flex justify-between items-center text-xs">
                  <span className="font-black text-muted-foreground">Sisa Piutang</span>
                  <span className={cn("font-black text-sm tabular-nums", inv.remaining_amount > 0 ? "text-rose-500" : "text-emerald-500")}>
                    {formatIDR(inv.remaining_amount)}
                  </span>
                </div>
              </div>

              {/* Pay Action Button */}
              {inv.payment_status !== 'lunas' && (
                <Button
                  onClick={() => onPay(inv)}
                  className="w-full bg-[#0F172A] hover:bg-slate-900 text-white dark:bg-tko-brand-500 dark:hover:bg-tko-brand-600 dark:text-tko-forest-950 text-xs font-black h-10 rounded-xl shadow-tko-brand border-none transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <CreditCard size={14} />
                  BAYAR PIUTANG
                </Button>
              )}
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function SupplierBatchList({ batches }) {
  if (!batches?.length) {
    return (
      <EmptyState
        icon={History}
        title="Belum ada stok masuk"
        description="Riwayat pembelian bahan, kemasan, atau produk dari supplier akan muncul di sini."
      />
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
      {batches.map(batch => {
        const title = batch.product_name || batch.sembako_products?.product_name || 'Bahan Baku / Produk'
        const unit = batch.unit || batch.sembako_products?.unit || 'Unit'
        const categoryLabel = batch.category_label || (batch.sembako_products ? 'Produk Jadi' : 'Bahan Baku')
        const isBahan = batch.item_category === 'bahan_baku' || categoryLabel.includes('Bahan')
        const isKemasan = batch.item_category === 'kemasan' || categoryLabel.includes('Kemasan')

        return (
          <motion.div key={batch.id} variants={fadeUp}>
            <Card className="bg-muted/30 border border-border/60 hover:border-border rounded-2xl p-4.5 space-y-3 shadow-sm transition-all">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{formatDate(batch.purchase_date)}</p>
                    <Badge className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shadow-none",
                      isBahan ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                      isKemasan ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    )}>
                      {categoryLabel}
                    </Badge>
                  </div>
                  <p className="text-base font-black text-foreground uppercase tracking-tight">{title}</p>
                </div>
                <Badge className="bg-muted text-muted-foreground border border-border/60 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-none shrink-0">
                  {batch.qty_masuk} {unit}
                </Badge>
              </div>

              <div className="bg-card border border-border/40 rounded-xl p-3 flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Nilai Pembelian / Nota</p>
                  <p className="font-black text-base text-foreground tabular-nums leading-none">{formatIDR(batch.total_cost)}</p>
                  {Number(batch.buy_price) > 0 && (
                    <p className="text-[10px] font-semibold text-muted-foreground">
                      @{formatIDR(batch.buy_price)} / {unit}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Sisa Stok</p>
                  <p className={cn("font-black text-sm tabular-nums leading-none", (batch.qty_sisa > 0 || batch.qty_sisa === '-') ? "text-emerald-500" : "text-muted-foreground")}>
                    {batch.qty_sisa !== undefined ? `${batch.qty_sisa} ${unit}` : '-'}
                  </p>
                </div>
              </div>

              {batch.notes && (
                <p className="text-[11px] text-muted-foreground font-medium italic truncate">
                  Catatan: {batch.notes}
                </p>
              )}
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function PaymentHistory({ payments, isCustomer }) {
  if (!payments?.length) {
    return (
      <EmptyState
        icon={Wallet}
        title="Belum ada riwayat bayar"
        description="Semua cicilan dan pelunasan akan tercatat di sini."
      />
    )
  }

  return (
    <div className="space-y-3">
      {payments.map(p => (
        <Card key={p.id} className="bg-muted/30 border border-border/60 rounded-2xl p-4 flex justify-between items-center shadow-sm">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{formatDate(p.payment_date)}</p>
            {isCustomer && <p className="text-xs font-bold text-foreground uppercase">Nota: {p.sembako_sales?.invoice_number || '-'}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-muted-foreground uppercase mb-0.5">{p.payment_method || 'Cash'}</p>
            <p className={cn("font-black text-base tabular-nums leading-none", isCustomer ? "text-emerald-500" : "text-rose-500")}>
              {isCustomer ? '+' : '-'}{formatIDR(p.amount)}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}

function PaymentForm({ invoice, isCustomer, parentId, maxAmount, onClose }) {
  const recordCustomerPayment = useRecordSembakoPayment()
  const recordSupplierPayment = useRecordSembakoSupplierPayment()

  const safeMax = maxAmount ?? Infinity
  const [amount, setAmount] = useState(() => Math.min(maxAmount || 0, safeMax))
  const [method, setMethod] = useState('transfer')
  const [refNo, setRefNo] = useState('')
  const [loading, setLoading] = useState(false)

  const isOverpay = maxAmount !== undefined && maxAmount !== null && amount > maxAmount
  const isZeroDebt = !isCustomer && (maxAmount === 0 || maxAmount === null || maxAmount === undefined)

  const handlePay = async () => {
    if (amount <= 0) {
      toast.error('Nominal tidak valid (harus > Rp 0)')
      return
    }
    if (isZeroDebt) {
      toast.error('Tidak ada sisa hutang ke supplier ini')
      return
    }
    if (isOverpay) {
      toast.error(`Nominal melebihi sisa hutang (${formatIDR(maxAmount)})`)
      return
    }
    setLoading(true)
    try {
      if (isCustomer) {
        await recordCustomerPayment.mutateAsync({
          sale_id: invoice.id,
          customer_id: parentId,
          amount,
          payment_method: method,
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: refNo || null,
        })
      } else {
        await recordSupplierPayment.mutateAsync({
          supplier_id: parentId,
          amount,
          payment_method: method,
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: refNo || null,
          notes: `Bayar hutang supplier`
        })
      }
      onClose()
    } catch (_err) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pt-2">
      <div className={cn(
        "text-center space-y-1 p-5 rounded-2xl border",
        isCustomer ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400"
      )}>
        <p className="text-[10px] font-black uppercase tracking-widest">
          {isCustomer ? 'Sisa Tagihan Nota' : 'Total Sisa Hutang'}
        </p>
        <p className="font-display text-3xl font-black tracking-tight tabular-nums">
          {formatIDR(maxAmount || 0)}
        </p>
        {isZeroDebt && (
          <p className="text-xs font-black text-emerald-400 mt-1">✅ Tidak ada hutang ke supplier ini</p>
        )}
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">Jumlah Pembayaran (Rp)</Label>
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
          {isOverpay && (
            <p className="text-xs font-bold text-rose-600 ml-1 flex items-center gap-1.5">
              🚨 Melebihi sisa hutang sebesar {formatIDR(amount - maxAmount)}
            </p>
          )}
          {!isOverpay && amount > 0 && maxAmount !== undefined && amount === maxAmount && (
            <p className="text-xs font-bold text-emerald-600 ml-1 flex items-center gap-1.5">
              ✅ Pas — hutang akan lunas setelah pembayaran ini
            </p>
          )}
        </div>

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

        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground ml-1">No. Referensi (Opsional)</Label>
          <input
            value={refNo}
            onChange={e => setRefNo(e.target.value)}
            placeholder="Contoh: REF123..."
            className="w-full bg-muted border-border/60 h-12 px-4 text-sm font-bold text-foreground rounded-2xl focus:ring-border border focus:border-border outline-none transition-all"
          />
        </div>

        <div className="pt-3">
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
            {loading ? 'Memproses...' : isOverpay ? 'Nominal Terlalu Besar' : isZeroDebt ? 'Hutang Sudah Lunas' : 'Konfirmasi Pembayaran'}
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
    customer_type: targetProfile?.customer_type || 'warung',
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
