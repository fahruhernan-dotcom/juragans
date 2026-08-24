import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ClipboardList, TrendingUp, ChevronRight, Target, Calendar } from 'lucide-react';
import { useForecast } from '@/lib/hooks/useForecast';
import { formatEkor, formatDate, formatIDR } from '@/lib/format';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SlideModal from '../components/SlideModal';

export default function Orders() {
  const [filter, setFilter] = useState('open');
  const { data: forecast, isLoading } = useForecast();
  const [showAddOrder, setShowAddOrder] = useState(false);

  const filteredOrders = forecast?.orders?.filter(o => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  return (
    <div style={{ background: '#06090F', minHeight: '100vh', paddingBottom: '20px' }}>
      <TopBar title="Orders Buyer" subtitle="Manajemen permintaan supply" />

      {/* Summary Chips */}
      <div style={{ padding: '0 20px', margin: '16px 0', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <SummaryChip label="Open Orders" value={forecast?.orders?.filter(o => o.status === 'open').length || 0} color="#F87171" />
        <SummaryChip label="Matched" value={forecast?.orders?.filter(o => o.status === 'matched').length || 0} color="#F59E0B" />
        <SummaryChip label="Total Permintaan" value={formatEkor(forecast?.totalDemand || 0)} color="#10B981" />
      </div>

      {/* Filters */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['open', 'matched', 'completed', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '99px',
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
              background: filter === f ? '#10B981' : '#111C24',
              color: filter === f ? 'white' : '#94A3B8',
              border: filter === f ? 'none' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <main style={{ padding: '0 20px' }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : !filteredOrders || filteredOrders.length === 0 ? (
          <EmptyState title="Tidak ada order" desc="Belum ada permintaan buyer untuk kategori ini." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAddOrder(true)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '56px', height: '56px',
          borderRadius: '28px',
          background: '#10B981',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 90
        }}
      >
        <Plus size={24} />
      </motion.button>

      <SlideModal isOpen={showAddOrder} onClose={() => setShowAddOrder(false)} title="Tambah Order Baru">
        <div style={{ padding: '20px' }}>
          <p style={{ color: '#94A3B8', fontSize: '14px', textAlign: 'center' }}>Form tambah order buyer akan diimplementasikan di sini.</p>
        </div>
      </SlideModal>
    </div>
  );
}

function SummaryChip({ label, value, color }) {
  return (
    <div style={{ 
      padding: '10px 16px', 
      background: '#111C24', 
      border: '1px solid rgba(255,255,255,0.06)', 
      borderRadius: '16px',
      minWidth: '120px'
    }}>
      <div style={{ fontSize: '10px', fontWeight: 800, color: '#4B6478', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 800, color: color }}>{value}</div>
    </div>
  );
}

function OrderCard({ order }) {
  const _isTargetPriceMet = order.target_price_per_kg >= 21000; // Mock logic

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      style={{
        background: '#111C24',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '44px', height: '44px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.03)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#F87171'
          }}>
            <ClipboardList size={22} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#F1F5F9', fontFamily: 'Sora' }}>{order.rpa_clients?.rpa_name}</div>
            <div style={{ fontSize: '12px', color: '#4B6478', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ textTransform: 'capitalize' }}>{order.chicken_type}</span>
              <span>·</span>
              <span>Prop: {order.preferred_size || 'Standar'}</span>
            </div>
          </div>
        </div>
        <div style={{
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '10px',
          fontWeight: 800,
          background: order.status === 'open' ? 'rgba(248,113,113,0.15)' : 'rgba(16, 185, 129, 0.15)',
          color: order.status === 'open' ? '#F87171' : '#10B981',
          textTransform: 'uppercase'
        }}>
          {order.status === 'open' ? 'PENDING' : order.status}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={14} color="#4B6478" />
          <div>
            <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 800 }}>JUMLAH</div>
            <div style={{ fontSize: '14px', color: '#F1F5F9', fontWeight: 700 }}>{formatEkor(order.requested_count)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={14} color="#4B6478" />
          <div>
            <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 800 }}>TARGET HARGA</div>
            <div style={{ fontSize: '14px', color: '#10B981', fontWeight: 700 }}>{formatIDR(order.target_price_per_kg || 0)}/kg</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={14} color="#4B6478" />
        <span style={{ fontSize: '12px', color: '#94A3B8' }}>Dibutuhkan: <b style={{ color: '#F1F5F9' }}>{formatDate(order.requested_date)}</b></span>
      </div>

      {order.status === 'open' && (
        <button 
          style={{
            width: '100%',
            padding: '12px',
            background: '#10B981',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            cursor: 'pointer',
            marginTop: '4px'
          }}
        >
          Cari Farm yang Cocok <ChevronRight size={16} />
        </button>
      )}
    </motion.div>
  );
}
