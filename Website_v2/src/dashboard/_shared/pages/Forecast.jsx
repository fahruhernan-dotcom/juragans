import { motion } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, AlertTriangle, ChevronRight, Package, ClipboardList } from 'lucide-react';
import { useForecast } from '@/lib/hooks/useForecast';
import { formatEkor } from '@/lib/format';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Forecast() {
  const { data: forecast, isLoading } = useForecast();

  if (isLoading) return <LoadingSpinner fullPage />;

  const isOversupply = forecast?.netBalance > 0;

  return (
    <div style={{ background: '#06090F', minHeight: '100vh', paddingBottom: '20px' }}>
      <TopBar title="Forecast" subtitle="Analisis gap supply & demand" />

      {/* Scorecard */}
      <div style={{ padding: '20px' }}>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            background: isOversupply ? 'linear-gradient(135deg, #064e3b 0%, #111C24 100%)' : 'linear-gradient(135deg, #450a0a 0%, #111C24 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={24} color={isOversupply ? '#10B981' : '#FCA5A5'} fill={isOversupply ? '#10B981' : '#FCA5A5'} />
            </div>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
            Status 7 Hari ke Depan
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#F1F5F9', marginBottom: '8px', fontFamily: 'Sora' }}>
            {isOversupply ? 'Oversupply' : 'Shortage (Kurang)'}
          </div>
          <div style={{ fontSize: '13px', color: '#94A3B8' }}>
            Gap: <b style={{ color: isOversupply ? '#10B981' : '#F87171' }}>{formatEkor(Math.abs(forecast?.netBalance || 0))}</b>
          </div>
        </motion.div>
      </div>

      <main style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Section title="Detail Estimasi (7 Hari)">
          <DataRow label="Potensi Supply (Panen)" value={formatEkor(forecast?.totalSupply || 0)} icon={<TrendingUp size={16} color="#10B981" />} />
          <DataRow label="Target Demand (Orders)" value={formatEkor(forecast?.totalDemand || 0)} icon={<ClipboardList size={16} color="#F87171" />} />
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#F1F5F9' }}>Net Balance</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: isOversupply ? '#10B981' : '#F87171' }}>
              {isOversupply ? '+' : '-'}{formatEkor(Math.abs(forecast?.netBalance || 0))}
            </span>
          </div>
        </Section>

        {!isOversupply && (
          <div style={{ padding: '20px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <AlertTriangle size={20} color="#F59E0B" />
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#F87171' }}>Rekomendasi Aksi</span>
            </div>
            <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.6 }}>
              Anda memiliki kekurangan stok sekitar <b style={{ color: '#F1F5F9' }}>{formatEkor(Math.abs(forecast?.netBalance || 0))}</b> untuk memenuhi semua order buyer. 
              Segera cari <b style={{ color: '#F1F5F9' }}>farm mitra baru</b> atau nego ulang tanggal pengiriman.
            </p>
            <button style={{ 
              marginTop: '16px', width: '100%', padding: '12px', background: '#F59E0B', border: 'none', borderRadius: '12px', color: '#06090F', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              Cari Farm Baru <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, padding: '16px', background: '#111C24', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 800, marginBottom: '4px' }}>REAKSI PASAR</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#F1F5F9' }}>Harga Cenderung Naik</div>
          </div>
          <div style={{ flex: 1, padding: '16px', background: '#111C24', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 800, marginBottom: '4px' }}>POWER BUYER</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#F1F5F9' }}>Moderat</div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', fontWeight: 800, color: '#F1F5F9', fontFamily: 'Sora' }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function DataRow({ label, value, icon }) {
  return (
    <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon}
        <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{ fontSize: '14px', fontWeight: 800, color: '#F1F5F9' }}>{value}</span>
    </div>
  );
}
