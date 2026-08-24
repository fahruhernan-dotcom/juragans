import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, Package, FileText, CheckCircle, Plus, Info, ChevronRight } from 'lucide-react';
import { useLossReports } from '@/lib/hooks/useLossReports';
import { formatIDR, formatEkor, formatDate } from '@/lib/format';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function LossReport() {
  const { data: reports, isLoading } = useLossReports();
  const [_showAdd, setShowAdd] = useState(false);

  const totalLoss = reports?.reduce((s, r) => s + (r.financial_loss || 0), 0) || 0;
  const mortality = reports?.filter(r => r.loss_type === 'mortality').reduce((s, r) => s + (r.chicken_count || 0), 0) || 0;

  return (
    <div style={{ background: '#06090F', minHeight: '100vh', paddingBottom: '20px' }}>
      <TopBar title="Kerugian Lapangan" subtitle="Rekapitulasi loss & komplain" />

      {/* Hero Stats */}
      <div style={{ padding: '20px' }}>
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #111C24 100%)',
            border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: '24px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#F87171', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
            Total Kerugian Bulan Ini
          </div>
          <div style={{ fontFamily: 'Sora', fontSize: '32px', fontWeight: 800, color: '#F1F5F9', marginBottom: '8px' }}>
            {formatIDR(totalLoss)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 700 }}>MORTALITAS</div>
              <div style={{ fontSize: '14px', color: '#F1F5F9', fontWeight: 800 }}>{formatEkor(mortality)}</div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)' }} />
            <div>
              <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 700 }}>KOMPLAIN</div>
              <div style={{ fontSize: '14px', color: '#F1F5F9', fontWeight: 800 }}>{reports?.filter(r => r.loss_type === 'buyer_complaint').length || 0} Kasus</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Insights */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(59,130,246,0.05)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)' }}>
          <Info size={14} color="#60A5FA" />
          <span style={{ fontSize: '11px', color: '#93C5FD', lineHeight: 1.4 }}>
            Loss rate Anda periode ini adalah <b style={{ color: '#F1F5F9' }}>1.4%</b> dari omzet. Target ideal di bawah <b style={{ color: '#F1F5F9' }}>1.0%</b>.
          </span>
        </div>
      </div>

      <main style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'Sora', fontSize: '16px', fontWeight: 800, color: '#F1F5F9' }}>Daftar Kerugian</h3>
          <button onClick={() => setShowAdd(true)} style={{ background: 'transparent', border: 'none', color: '#10B981', fontSize: '13px', fontWeight: 700 }}>+ Catat Baru</button>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : !reports || reports.length === 0 ? (
          <EmptyState title="Sihil" desc="Bagus! Belum ada laporan kerugian yang tercatat." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reports.map(report => (
              <LossCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function LossCard({ report }) {
  const getIcon = (type) => {
    switch(type) {
      case 'mortality': return <AlertTriangle size={18} />;
      case 'buyer_complaint': return <FileText size={18} />;
      case 'shrinkage': return <TrendingDown size={18} />;
      default: return <Package size={18} />;
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'mortality': return '#F87171';
      case 'buyer_complaint': return '#F59E0B';
      default: return '#94A3B8';
    }
  };

  return (
    <div style={{
      background: '#111C24',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: `${getColor(report.loss_type)}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: getColor(report.loss_type)
          }}>
            {getIcon(report.loss_type)}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 750, color: '#F1F5F9', textTransform: 'capitalize' }}>
              {report.loss_type.replace('_', ' ')}
            </div>
            <div style={{ fontSize: '11px', color: '#4B6478' }}>
              {formatDate(report.report_date)}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#F87171' }}>-{formatIDR(report.financial_loss)}</div>
          {report.resolved ? (
            <div style={{ fontSize: '10px', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
              <CheckCircle size={10} /> TERATASI
            </div>
          ) : (
            <div style={{ fontSize: '10px', color: '#F87171', fontWeight: 700 }}>BELUM TERATASI</div>
          )}
        </div>
      </div>

      <div style={{ fontSize: '13px', color: '#94A3B8', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', lineHeight: 1.5 }}>
        {report.description || 'Tidak ada uraian.'}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
        <div style={{ fontSize: '12px', color: '#4B6478' }}>
          {report.sales?.rpa_clients?.rpa_name || 'RPA Umum'}
        </div>
        {!report.resolved && (
          <button style={{ background: 'transparent', border: 'none', color: '#10B981', fontSize: '12px', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Tangani Loss <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
