import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Clock, AlertTriangle, CheckCircle2, Plus, Phone, Weight } from 'lucide-react';
import { useDeliveries } from '@/lib/hooks/useDeliveries';
import { formatEkor, formatKg } from '@/lib/format';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SlideModal from '../components/SlideModal';

export default function Pengiriman() {
  const [filter, setFilter] = useState('on_route');
  const { data: deliveries, isLoading } = useDeliveries(filter);
  const [showAddDelivery, setShowAddDelivery] = useState(false);

  const stats = {
    active: deliveries?.filter(d => d.status === 'on_route').length || 0,
    today: deliveries?.filter(d => d.status === 'completed').length || 0,
    mortality: deliveries?.reduce((s, d) => s + (d.mortality_count || 0), 0) || 0,
  };

  return (
    <div style={{ background: '#06090F', minHeight: '100vh', paddingBottom: '20px' }}>
      <TopBar title="Pengiriman" subtitle="Tracking logistik ayam hidup" />

      {/* Summary Chips */}
      <div style={{ padding: '0 20px', margin: '16px 0', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <SummaryChip label="Aktif di Jalan" value={stats.active} color="#F59E0B" />
        <SummaryChip label="Selesai Hari Ini" value={stats.today} color="#10B981" />
        <SummaryChip label="Mortalitas (Ekor)" value={stats.mortality} color="#F87171" />
      </div>

      {/* Filters */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['on_route', 'completed', 'pending', 'all'].map(f => (
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
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <main style={{ padding: '0 20px' }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : !deliveries || deliveries.length === 0 ? (
          <EmptyState title="Belum ada pengiriman" desc="Catat logistik ayam dari farm ke buyer." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {deliveries.map(delivery => (
              <DeliveryCard key={delivery.id} delivery={delivery} />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAddDelivery(true)}
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

      <SlideModal isOpen={showAddDelivery} onClose={() => setShowAddDelivery(false)} title="Catat Pengiriman">
        <div style={{ padding: '20px' }}>
          <p style={{ color: '#94A3B8', fontSize: '14px', textAlign: 'center' }}>Form logistik pengiriman akan diimplementasikan di sini.</p>
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

function DeliveryCard({ delivery }) {
  const isArrived = delivery.status === 'completed' || delivery.status === 'arrived';

  const statusMap = {
    preparing: { label: 'Persiapan', color: '#94A3B8', bg: 'rgba(255,255,255,0.06)' },
    loading: { label: 'Daftar Muat', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
    on_route: { label: 'Di Jalan', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    arrived: { label: 'Tiba', color: '#93C5FD', bg: 'rgba(96,165,250,0.15)' },
    completed: { label: 'Selesai', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  };

  const meta = statusMap[delivery.status] || statusMap.preparing;

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
            color: meta.color
          }}>
            <Truck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#F1F5F9' }}>{delivery.driver_name || 'Driver'}</div>
            <div style={{ fontSize: '12px', color: '#4B6478' }}>{delivery.vehicle_info || 'Tanpa Kendaraan'}</div>
          </div>
        </div>
        <div style={{
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '10px',
          fontWeight: 800,
          background: meta.bg,
          color: meta.color,
          textTransform: 'uppercase'
        }}>
          {meta.label}
        </div>
      </div>

      {/* Timeline Visual */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 0' }}>
        <TimelinePoint label="Muat" active={delivery.status !== 'preparing' && !!delivery.load_time} />
        <div style={{ flex: 1, height: '2px', background: (delivery.status !== 'preparing' && !!delivery.load_time) ? '#10B981' : 'rgba(255,255,255,0.05)' }} />
        <TimelinePoint label="Jalan" active={delivery.status === 'on_route' || isArrived} pulse={delivery.status === 'on_route'} />
        <div style={{ flex: 1, height: '2px', background: isArrived ? '#10B981' : 'rgba(255,255,255,0.05)' }} />
        <TimelinePoint label="Sampai" active={isArrived} />
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <MapPin size={14} color="#4B6478" />
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#4B6478', textTransform: 'uppercase', tracking: '0.05em' }}>Rute: </span>
          <span style={{ fontSize: '12px', color: '#F1F5F9', fontWeight: 600 }}>
            {delivery.sales?.purchases?.farms?.farm_name} → {delivery.sales?.rpa_clients?.rpa_name}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ color: '#FBBF24' }}><Clock size={14} /></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#4B6478', textTransform: 'uppercase' }}>Muat</span>
                <span style={{ fontSize: '12px', color: '#F1F5F9', fontWeight: 700 }}>
                 {delivery.load_time ? new Date(delivery.load_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ color: '#3B82F6' }}><Truck size={14} /></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#4B6478', textTransform: 'uppercase' }}>Berangkat</span>
                <span style={{ fontSize: '12px', color: '#F1F5F9', fontWeight: 700 }}>
                  {delivery.departure_time ? new Date(delivery.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={14} color="#4B6478" />
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>{delivery.driver_phone || '-'}</span>
          </div>
        </div>
      </div>

      {isArrived && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 800 }}>MORTALITAS</div>
            <div style={{ fontSize: '14px', color: delivery.mortality_count > 0 ? '#F87171' : '#10B981', fontWeight: 800 }}>{formatEkor(delivery.mortality_count || 0)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 800 }}>SUSUT BERAT</div>
            <div style={{ fontSize: '14px', color: '#F59E0B', fontWeight: 800 }}>{formatKg(delivery.shrinkage_kg || 0)}</div>
          </div>
        </div>
      )}

      {delivery.status === 'on_route' && (
        <button style={{
          width: '100%',
          padding: '12px',
          background: '#F59E0B',
          border: 'none',
          borderRadius: '12px',
          color: '#06090F',
          fontSize: '13px',
          fontWeight: 800,
          cursor: 'pointer'
        }}>
          Konfirmasi Tiba di Lokasi
        </button>
      )}
    </motion.div>
  );
}

function TimelinePoint({ label, active, pulse }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '40px' }}>
      <div style={{
        width: '10px', height: '10px',
        borderRadius: '50%',
        background: active ? '#10B981' : 'rgba(255,255,255,0.05)',
        boxShadow: active ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
        position: 'relative'
      }}>
        {pulse && (
          <div style={{
            position: 'absolute', inset: -4, border: '2px solid #10B981', borderRadius: '50%',
            animation: 'pulse-dot 1.5s infinite'
          }} />
        )}
      </div>
      <span style={{ fontSize: '9px', fontWeight: 800, color: active ? '#F1F5F9' : '#4B6478', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}
