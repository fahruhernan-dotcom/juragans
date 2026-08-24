import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  ChevronRight, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight,
  Warehouse,
  PackagePlus,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  BarChart2,
  ShoppingCart
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { 
  formatIDRShort, 
  formatDateFull, 
  formatEkor,
  safeNumber
} from '@/lib/format'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import LoadingSpinner from '../components/LoadingSpinner'
import SlideModal from '../components/SlideModal'
import FormBeliModal from '../components/FormBeliModal'
import FormJualModal from '../components/FormJualModal'

export default function Beranda() {
  const { profile, tenant } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  const _handleMarkLunas = async (rpaId, rpaName, amount) => {
    try {
      // Update all sales that are unpaid for this client
      const { error } = await supabase
        .from('sales')
        .update({ 
          payment_status: 'lunas',
          paid_amount: amount, // Assuming current outstanding is paid
          updated_at: new Date().toISOString()
        })
        .eq('rpa_id', rpaId)
        .eq('payment_status', 'belum_lunas')
        .eq('tenant_id', tenant.id)

      if (error) throw error

      toast.success(`✅ ${rpaName} ditandai lunas!`)
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['today-stats'] })
      queryClient.invalidateQueries({ queryKey: ['recent-tx'] })
    } catch (err) {
      toast.error('Gagal menandai lunas')
      console.error(err)
    }
  }
  
  // Modal States
  const [modalType, setModalType] = useState(null) // 'beli' or 'jual'

  // Query 1: Stats Hari Ini
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['today-stats', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return { sales: 0, purchases: 0, profit: 0, weight: 0 }
      
      const [{ data: sales }, { data: purchases }] = await Promise.all([
        supabase
          .from('sales')
          .select('total_revenue, total_weight_kg')
          .eq('tenant_id', tenant.id)
          .eq('transaction_date', today)
          .eq('is_deleted', false),
        supabase
          .from('purchases')
          .select('total_modal, total_weight_kg')
          .eq('tenant_id', tenant.id)
          .eq('transaction_date', today)
          .eq('is_deleted', false)
      ])

      const totalSales = (sales ?? []).reduce((acc, s) => acc + (safeNumber(s?.total_revenue)), 0)
      const totalPurchases = (purchases ?? []).reduce((acc, p) => acc + (safeNumber(p?.total_modal)), 0)
      const totalWeightSold = (sales ?? []).reduce((acc, s) => acc + (safeNumber(s?.total_weight_kg)), 0)
      
      return {
        sales: safeNumber(totalSales),
        purchases: safeNumber(totalPurchases),
        profit: safeNumber(totalSales) - safeNumber(totalPurchases),
        weight: safeNumber(totalWeightSold)
      }
    },
    enabled: !!tenant?.id
  })

  // Query 2: Piutang
  const { data: receivables } = useQuery({
    queryKey: ['receivables', tenant?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('rpa_clients')
        .select('id, rpa_name, total_outstanding')
        .eq('tenant_id', tenant.id)
        .gt('total_outstanding', 0)
        .eq('is_deleted', false)
        .order('total_outstanding', { ascending: false })
        .limit(3)
      return data || []
    },
    enabled: !!tenant?.id
  })

  // Query 3: Kandang Ready
  const { data: readyFarms } = useQuery({
    queryKey: ['ready-farms', tenant?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('farms')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'ready')
        .eq('is_deleted', false)
      return count || 0
    },
    enabled: !!tenant?.id
  })

  // Query 4: Transaksi Terakhir
  const { data: transactions } = useQuery({
    queryKey: ['recent-tx', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return []
      
      const [{ data: sales }, { data: purchases }] = await Promise.all([
        supabase
          .from('sales')
          .select('*, rpa_clients(rpa_name)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('purchases')
          .select('*, farms(farm_name)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      const combined = [
        ...((sales ?? []).map(s => ({ ...s, type: 'sale' }))),
        ...((purchases ?? []).map(p => ({ ...p, type: 'purchase' })))
      ].sort((a, b) => new Date(b?.created_at ?? 0) - new Date(a?.created_at ?? 0)).slice(0, 5)

      return combined
    },
    enabled: !!tenant?.id
  })

  if (statsLoading) return <LoadingSpinner fullPage />

  const firstName = profile?.full_name?.split(' ')[0] || 'User'
  const todayProfit = safeNumber(stats?.profit)

  return (
    <div style={{ color: '#F1F5F9' }}>
      {/* Header Section */}
      <header style={{
        padding: '24px 20px 20px',
        background: 'linear-gradient(180deg, #0C1319 0%, #06090F 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#4B6478', marginBottom: '2px' }} suppressHydrationWarning>
              Selamat {getGreeting()},
            </p>
            <h1 style={{ 
              fontSize: '22px', 
              fontFamily: 'Sora, sans-serif', 
              fontWeight: 800,
              color: '#F1F5F9',
              marginBottom: '4px'
            }}>
              {firstName}! 👋
            </h1>
            <p style={{ fontSize: '12px', color: '#4B6478', fontFamily: 'DM Sans' }} suppressHydrationWarning>
              {formatDateFull(new Date())}
            </p>
          </div>
          
          <div 
            onClick={() => navigate('/akun')}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Sora, sans-serif',
              fontSize: '14px',
              fontWeight: 800,
              color: '#10B981'
            }}>
              {(profile?.full_name ?? 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            {/* Pulse Dot */}
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '12px',
              height: '12px',
              background: '#10B981',
              borderRadius: '50%',
              border: '2px solid #06090F',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
              animation: 'pulse-dot 2s infinite'
            }} />
            <style>
              {`
                @keyframes pulse-dot {
                  0% { transform: scale(0.95); opacity: 1; }
                  50% { transform: scale(1.2); opacity: 0.8; }
                  100% { transform: scale(0.95); opacity: 1; }
                }
              `}
            </style>
          </div>
        </div>
      </header>

      <main style={{ padding: '0 20px 20px' }}>
        {/* Quick Actions */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px', 
          marginTop: '-10px',
          marginBottom: '20px'
        }}>
          <ActionButton 
            label="Catat Beli" 
            sub="Dari Kandang" 
            icon={PackagePlus} 
            color="#10B981" 
            onClick={() => setModalType('beli')}
          />
          <ActionButton 
            label="Catat Jual" 
            sub="Ke Buyer/RPA" 
            icon={ArrowUpCircle} 
            color="#3B82F6" 
            onClick={() => setModalType('jual')}
          />
        </div>

        {/* Alert Strip */}
        {receivables?.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.20)',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(248,113,113,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F87171'
            }}>
              <AlertCircle size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', color: '#94A3B8' }}>Peringatan Piutang</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>
                {receivables.length} buyer butuh penagihan
              </p>
            </div>
            <ChevronRight size={18} color="#4B6478" />
          </motion.div>
        )}

        {/* Stat Cards Grid */}
        <section style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '12px'
        }}>
          <StatCard 
            label="Profit Hari Ini"
            value={formatIDRShort(safeNumber(todayProfit))}
            subtext={todayProfit >= 0 ? "Untung bersih" : "Defisit"}
            variant={todayProfit >= 0 ? "emerald" : "red"}
            icon={todayProfit >= 0 ? TrendingUp : TrendingDown}
          />
          <StatCard 
            label="Total Jual"
            value={formatIDRShort(safeNumber(stats?.sales))}
            subtext={`${safeNumber(stats?.weight)} kg terjual`}
            variant="blue"
            icon={ArrowUpRight}
          />
          <StatCard 
            label="Total Beli"
            value={formatIDRShort(safeNumber(stats?.purchases))}
            subtext="Stok baru masuk"
            variant="gold"
            icon={ArrowDownRight}
          />
          <StatCard 
            label="Kandang Ready"
            value={`${safeNumber(readyFarms)} Kandang`}
            subtext="Siap dipanen"
            variant="purple"
            icon={Warehouse}
          />
        </section>

        {/* Recents Section */}
        <section style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontFamily: 'Sora, sans-serif', fontWeight: 700 }}> Transaksi Hari Ini</h2>
            <button style={{ color: '#10B981', fontSize: '12px', fontWeight: 600, background: 'none', border: 'none' }}>
              Lihat Semua
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(transactions ?? []).length === 0 ? (
              <div style={{ 
                padding: '40px 0', 
                textAlign: 'center', 
                background: '#0C1319', 
                borderRadius: '16px',
                border: '1px dashed rgba(255,255,255,0.05)'
              }}>
                <p style={{ color: '#4B6478', fontSize: '13px' }}>Belum ada transaksi hari ini</p>
              </div>
            ) : (
              (transactions ?? []).map((tx) => (
                <div key={tx.id} style={{
                  background: '#0C1319',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: tx.type === 'sale' ? 'rgba(59,130,246,0.08)' : 'rgba(16, 185, 129, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tx.type === 'sale' ? '#3B82F6' : '#10B981'
                  }}>
                    {tx.type === 'sale' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600 }}>
                      {tx.type === 'sale' ? (tx.rpa_clients?.rpa_name ?? 'Buyer Umum') : (tx.farms?.farm_name ?? 'Kandang Umum')}
                    </p>
                    <p style={{ fontSize: '11px', color: '#4B6478', marginTop: '2px' }}>
                      {formatEkor(tx.quantity ?? 0)} • {tx.type === 'sale' ? 'Penjualan' : 'Pembelian'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: tx.type === 'sale' ? '#3B82F6' : '#10B981' }}>
                      {tx.type === 'sale' ? '+' : '-'}{formatIDRShort(safeNumber(tx.type === 'sale' ? tx.total_revenue : tx.total_modal))}
                    </p>
                    <p style={{ fontSize: '10px', color: '#4B6478', marginTop: '2px' }}>
                      {tx?.created_at ? new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </p>

                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Slide Modals */}
      <SlideModal 
        isOpen={modalType === 'beli'} 
        onClose={() => setModalType(null)}
        title="Catat Pembelian"
      >
        <FormBeliModal onClose={() => setModalType(null)} />
      </SlideModal>

      <SlideModal 
        isOpen={modalType === 'jual'} 
        onClose={() => setModalType(null)}
        title="Catat Penjualan"
      >
        <FormJualModal onClose={() => setModalType(null)} />
      </SlideModal>
    </div>
  )
}

function ActionButton({ label, sub, icon: Icon, color, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        background: '#0C1319',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '12px',
        cursor: 'pointer',
        textAlign: 'left'
      }}
    >
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '12px',
        background: `${color}15`,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Icon size={20} />
      </div>
      <div>
        <p style={{ fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>{label}</p>
        <p style={{ fontSize: '10px', color: '#4B6478' }}>{sub}</p>
      </div>
    </motion.button>
  )
}

function StatCard({ label, value, subtext, variant, icon: Icon }) {
  const themes = {
    emerald: { bg: 'rgba(16, 185, 129,0.05)', color: '#10B981', border: 'rgba(16, 185, 129,0.08)' },
    red: { bg: 'rgba(248,113,113,0.05)', color: '#F87171', border: 'rgba(248,113,113,0.08)' },
    blue: { bg: 'rgba(59,130,246,0.05)', color: '#3B82F6', border: 'rgba(59,130,246,0.08)' },
    gold: { bg: 'rgba(245,158,11,0.05)', color: '#F59E0B', border: 'rgba(245,158,11,0.08)' },
    purple: { bg: 'rgba(139,92,246,0.05)', color: '#8B5CF6', border: 'rgba(139,92,246,0.08)' }
  }

  const t = themes[variant] || themes.emerald

  return (
    <div style={{
      background: '#0C1319',
      border: `1px solid ${t.border}`,
      borderRadius: '20px',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '10px',
        background: t.bg,
        color: t.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px'
      }}>
        <Icon size={18} />
      </div>
      
      <p style={{ fontSize: '11px', color: '#4B6478', fontWeight: 500, marginBottom: '2px' }}>{label}</p>
      <p style={{ fontSize: '18px', fontWeight: 800, color: '#F1F5F9', fontFamily: 'Sora, sans-serif' }}>{value}</p>
      <p style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>{subtext}</p>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'pagi'
  if (hour < 15) return 'siang'
  if (hour < 19) return 'sore'
  return 'malam'
}
