import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Package, Calendar, Weight, ChevronRight, Phone, MessageSquare } from 'lucide-react';
import { formatEkor, formatDate } from '@/lib/format';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SlideModal from '../components/SlideModal';


export default function StokVirtual() {
  const [filter, setFilter] = useState('all');
  const batches = [];
  const isLoading = false;
  const [showAddBatch, setShowAddBatch] = useState(false);

  const stats = {
    total: batches?.reduce((s, b) => s + b.current_count, 0) || 0,
    ready: batches?.filter(b => b.status === 'ready').reduce((s, b) => s + b.current_count, 0) || 0,
    booked: batches?.filter(b => b.status === 'booked').reduce((s, b) => s + b.current_count, 0) || 0,
  };

  return (
    <div style={{ background: '#06090F', minHeight: '100vh', paddingBottom: '20px' }}>
      <TopBar title="Stok Virtual" subtitle="Inventory di farm rekanan" />

      {/* Summary Chips */}
      <div style={{ padding: '0 20px', margin: '16px 0', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <SummaryChip label="Total Stok" value={formatEkor(stats.total)} color="#94A3B8" />
        <SummaryChip label="Siap Panen" value={formatEkor(stats.ready)} color="#10B981" />
        <SummaryChip label="Terpesan" value={formatEkor(stats.booked)} color="#F59E0B" />
      </div>

      {/* Filters */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['all', 'ready', 'growing', 'booked', 'sold'].map(f => (
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
            {f === 'all' ? 'Semua' : f}
          </button>
        ))}
      </div>

      <main style={{ padding: '0 20px' }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : !batches || batches.length === 0 ? (
          <EmptyState title="Belum ada stok" desc="Catat batch ayam yang sedang tumbuh di farm rekanan." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {batches.map(batch => (
              <BatchCard key={batch.id} batch={batch} />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAddBatch(true)}
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

      <SlideModal isOpen={showAddBatch} onClose={() => setShowAddBatch(false)} title="Tambah Batch Baru">
        <div style={{ padding: '20px' }}>
          {/* Form Placeholder */}
          <p style={{ color: '#94A3B8', fontSize: '14px', textAlign: 'center' }}>Form tambah batch virtual akan diimplementasikan di sini.</p>
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

function BatchCard({ batch }) {
  const progress = Math.min((batch.avg_weight_kg / 1.8) * 100, 100);
  const progressColor = progress < 80 ? '#F87171' : progress < 95 ? '#F59E0B' : '#10B981';

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
            color: '#10B981'
          }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#F1F5F9', fontFamily: 'Sora' }}>{batch.farms?.farm_name}</div>
            <div style={{ fontSize: '12px', color: '#4B6478', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ textTransform: 'capitalize' }}>{batch.chicken_type}</span>
              <span>·</span>
              <span>{batch.age_days} hari</span>
            </div>
          </div>
        </div>
        <div style={{
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '10px',
          fontWeight: 800,
          background: batch.status === 'ready' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245,158,11,0.15)',
          color: batch.status === 'ready' ? '#10B981' : '#F59E0B',
          textTransform: 'uppercase'
        }}>
          {batch.status}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Weight size={14} color="#4B6478" />
          <div>
            <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 800 }}>ESTIMASI</div>
            <div style={{ fontSize: '14px', color: '#F1F5F9', fontWeight: 700 }}>{batch.avg_weight_kg} kg/ekor</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={14} color="#4B6478" />
          <div>
            <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 800 }}>PANEN</div>
            <div style={{ fontSize: '14px', color: '#F1F5F9', fontWeight: 700 }}>{formatDate(batch.estimated_harvest_date)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4B6478', fontWeight: 800 }}>
          <span>PROGRES BOBOT (Target 1.8kg)</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            style={{ height: '100%', background: progressColor }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button style={btnActionStyle}><Phone size={14} /> Hubungi</button>
        <button style={btnActionStyle} onClick={() => window.location.href = `https://wa.me/${batch.farms?.phone}`}><MessageSquare size={14} /> WhatsApp</button>
      </div>
    </motion.div>
  );
}

const btnActionStyle = {
  flex: 1,
  padding: '10px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px',
  color: '#F1F5F9',
  fontSize: '12px',
  fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  cursor: 'pointer'
};
