import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ChevronUp, ChevronDown, Info, History, Warehouse, Store, Building2, Truck, Undo2, FileX2 } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { formatIDR, formatDate } from '@/lib/format'
import { SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import { normalizeSupabaseError } from '@/lib/supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

const MotionDiv = motion.div

export default function SembakoRecycleBin({ tenantId }) {
    // Sembako specific tabs for recycle bin
    const tabs = [
        { id: 'sembako_sales', label: 'Penjualan' },
        { id: 'sembako_products', label: 'Produk' },
        { id: 'sembako_customers', label: 'Toko' },
        { id: 'sembako_suppliers', label: 'Supplier' },
        { id: 'sembako_deliveries', label: 'Pengiriman' }
    ]

    const [isOpen, setIsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState(tabs[0].id)
    const queryClient = useQueryClient()

    const { data: deletedData, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['recycle-bin-sembako', tenantId, activeTab],
        queryFn: async () => {
            const { data, error } = await supabase.from(activeTab).select('*').eq('tenant_id', tenantId).eq('is_deleted', true).order('updated_at', { ascending: false })
            if (error) throw normalizeSupabaseError(error, `Memuat Data ${activeTab}`)
            return data || []
        },
        enabled: !!tenantId && isOpen
    })

    const handleRestore = async (type, item) => {
        try {
            await supabase.from(type).update({ is_deleted: false }).eq('id', item.id)
            if (type === 'sembako_sales') {
               await supabase.from('sembako_sale_items').update({ is_deleted: false }).eq('sale_id', item.id)
               await supabase.from('sembako_payments').update({ is_deleted: false }).eq('sale_id', item.id)
            } else if (type === 'sembako_customers') {
               await supabase.from('sembako_sales').update({ is_deleted: false }).eq('customer_id', item.id)
               await supabase.from('sembako_payments').update({ is_deleted: false }).eq('customer_id', item.id)
            } else if (type === 'sembako_suppliers') {
               await supabase.from('sembako_stock_batches').update({ is_deleted: false }).eq('supplier_id', item.id)
               await supabase.from('sembako_supplier_payments').update({ is_deleted: false }).eq('supplier_id', item.id)
            } else if (type === 'sembako_products') {
               await supabase.from('sembako_stock_batches').update({ is_deleted: false }).eq('product_id', item.id)
            }
            
            toast.success('✅ Berhasil dipulihkan')
            refetch()
            queryClient.invalidateQueries()
        } catch (err) {
            logSupabaseError(err, { table: type, operation: 'update', component: 'SembakoRecycleBin', actionName: 'handleRestore' })
            toast.error('❌ Gagal memulihkan data')
        }
    }

    const handleDeletePermanent = async (type, item) => {
        try {
            if (type === 'sembako_sales') {
                await supabase.from('sembako_payments').delete().eq('sale_id', item.id)
                await supabase.from('sembako_deliveries').delete().eq('sale_id', item.id)
                await supabase.from('sembako_sale_items').delete().eq('sale_id', item.id)
                await supabase.from(type).delete().eq('id', item.id)
            } else if (type === 'sembako_customers') {
                await supabase.from('sembako_payments').delete().eq('customer_id', item.id)
                await supabase.from('sembako_sales').delete().eq('customer_id', item.id)
                await supabase.from(type).delete().eq('id', item.id)
            } else if (type === 'sembako_suppliers') {
                await supabase.from('sembako_supplier_payments').delete().eq('supplier_id', item.id)
                await supabase.from('sembako_stock_batches').delete().eq('supplier_id', item.id)
                await supabase.from(type).delete().eq('id', item.id)
            } else {
                await supabase.from(type).delete().eq('id', item.id)
            }

            toast.success('🗑️ Data dihapus permanen')
            refetch()
            queryClient.invalidateQueries()
        } catch (err) {
            logSupabaseError(err, { table: type, operation: 'delete', component: 'SembakoRecycleBin', actionName: 'handleDeletePermanent' })
            toast.error('❌ Gagal menghapus permanen')
        }
    }

    return (
        <Card className="bg-white border border-slate-200/80 rounded-[28px] shadow-sm overflow-hidden">
            <div 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <Trash2 size={20} className="text-slate-550" />
                    <h3 className="font-display font-black text-slate-900 text-lg tracking-tight uppercase">Recycle Bin</h3>
                </div>
                {isOpen ? <ChevronUp size={20} className="text-slate-550" /> : <ChevronDown size={20} className="text-slate-550" />}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <MotionDiv
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-8 space-y-6 border-t border-slate-200 pt-6">
                            <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-2xl flex items-start gap-3">
                                <Info size={18} className="text-[#0F172A] shrink-0 mt-0.5" />
                                <p className="text-[11px] font-bold text-amber-700 leading-relaxed uppercase tracking-wider">
                                    Data yang dihapus akan otomatis terhapus permanen setelah 30 hari.
                                </p>
                            </div>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="bg-slate-100 border border-slate-200/60 p-1 h-12 rounded-xl grid grid-cols-5 gap-1 mb-6">
                                    {tabs.map(tab => (
                                        <TabsTrigger 
                                            key={tab.id}
                                            value={tab.id} 
                                            className="rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 data-[state=active]:bg-[#0F172A] data-[state=active]:text-white data-[state=active]:shadow-sm"
                                        >
                                            {tab.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                <div className="min-h-[200px]">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center h-40">
                                            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                                        </div>
                                    ) : isError ? (
                                        <div className="py-4">
                                            <SembakoErrorState error={error} onRetry={refetch} />
                                        </div>
                                    ) : deletedData?.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4 border border-slate-200/60 opacity-40">
                                                <Trash2 size={24} className="text-slate-400" />
                                            </div>
                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Recycle Bin Kosong</p>
                                            <p className="text-[10px] text-slate-550 font-black uppercase tracking-widest mt-1.5">Data yang dihapus akan muncul di sini</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {deletedData?.map((item) => (
                                                <RecycleItem 
                                                    key={item.id} 
                                                    item={item} 
                                                    type={activeTab} 
                                                    onRestore={() => handleRestore(activeTab, item)}
                                                    onDelete={() => handleDeletePermanent(activeTab, item)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Tabs>
                        </div>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </Card>
    )
}

const RECYCLE_ICONS = {
    sembako_sales: History,
    sembako_products: Warehouse,
    sembako_customers: Store,
    sembako_suppliers: Building2,
    sembako_deliveries: Truck,
}

function RecycleItem({ item, type, onRestore, onDelete }) {
    const getTitle = () => {
        if (type === 'sembako_sales') return item.invoice_number || 'Sale'
        if (type === 'sembako_products') return item.product_name
        if (type === 'sembako_customers') return item.customer_name
        if (type === 'sembako_suppliers') return item.supplier_name || 'Supplier'
        if (type === 'sembako_deliveries') return `Trip ${item.id.slice(0,8)}`
        return 'Item'
    }

    const getSub = () => {
        if (type === 'sembako_sales') return `${formatDate(item.transaction_date)} • ${formatIDR(item.total_amount)}`
        if (type === 'sembako_products') return `${item.sku || '-'} • ${item.unit}`
        if (type === 'sembako_customers') return item.address || '-'
        if (type === 'sembako_suppliers') return `${item.contact_phone || item.phone || '-'} • ${item.address || '-'}`
        if (type === 'sembako_deliveries') return `${formatDate(item.delivery_date)} • ${item.status}`
        return ''
    }

    const Icon = RECYCLE_ICONS[type] ?? Trash2

    return (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-200 text-rose-600">
                    <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-[13px] font-black text-slate-900 truncate uppercase tracking-tight">{getTitle()}</p>
                        <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[8px] px-1.5 h-4.5 uppercase font-black shadow-none">TERHAPUS</Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">{getSub()}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onRestore}
                    className="h-10 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[9px] font-black uppercase tracking-widest gap-2 shadow-none"
                >
                    <Undo2 size={12} /> Pulihkan
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="h-10 rounded-xl border-rose-300 text-rose-700 hover:bg-rose-50 text-[9px] font-black uppercase tracking-widest gap-2 shadow-none"
                        >
                            <FileX2 size={12} /> Hapus Permanen
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white border-slate-200 rounded-[32px] p-8 text-left">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-slate-900 font-display font-black tracking-tight uppercase text-2xl">Hapus Permanen?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-600 font-bold mt-2">
                                Data akan dihapus selamanya dan tidak bisa dipulihkan. Seluruh relasi data terkait juga akan hilang.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3 mt-8">
                            <AlertDialogCancel className="bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200/60 shadow-sm rounded-2xl h-14 font-black uppercase tracking-widest text-[11px]">Batal</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={onDelete}
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] border-none shadow-sm"
                            >
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}
