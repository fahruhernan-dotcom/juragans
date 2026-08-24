import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowUpRight, ArrowDownRight, Calendar, Filter, Download, Info } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useCashFlow } from '@/lib/hooks/useCashFlow';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatIDR } from '@/lib/format';
import TopBar from '../components/TopBar';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CashFlow() {
  const { tenant } = useAuth();
  const [period, setPeriod] = useState('week');

  const { startStr, endStr } = (() => {
    const today = new Date();
    if (period === 'week') {
      return { 
        startStr: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        endStr: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      };
    }
    return {
      startStr: format(startOfMonth(today), 'yyyy-MM-dd'),
      endStr: format(endOfMonth(today), 'yyyy-MM-dd')
    };
  })();

  const { data } = useCashFlow(startStr, endStr, tenant?.id);
  const cashflow = data?.summary || {};

  return (
    <div style={{ background: '#06090F', minHeight: '100vh', paddingBottom: '20px' }}>
      <TopBar title="Cash Flow" subtitle="Analisis uang masuk & keluar" />

      {/* Hero Chart Placeholder */}
      <div style={{ padding: '20px' }}>
        <div style={{
          background: '#0C1319',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '24px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            Estimasi Laba Bersih ({period})
          </div>
          <div style={{ fontFamily: 'Sora', fontSize: '28px', fontWeight: 800, color: '#10B981' }}>
            {formatIDR(cashflow?.netCashFlow || 0)}
          </div>
          
          <div style={{ height: '120px', marginTop: '20px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                style={{ flex: 1, background: 'linear-gradient(180deg, #10B981 0%, rgba(16, 185, 129, 0.1) 100%)', borderRadius: '4px 4px 0 0' }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Period Select */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: '8px' }}>
        {['week', 'month'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              flex: 1, padding: '12px', borderRadius: '14px', fontSize: '13px', fontWeight: 700,
              background: period === p ? '#10B981' : '#111C24',
              color: period === p ? 'white' : '#94A3B8',
              border: period === p ? 'none' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {p === 'week' ? '7 Hari Terakhir' : 'Bulan Ini'}
          </button>
        ))}
      </div>

      <main style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Section title="Rincian Keuangan">
          <FinanceRow label="Penjualan (Sales)" value={formatIDR(cashflow?.totalPemasukan || 0)} icon={<ArrowUpRight size={16} color="#10B981" />} />
          <FinanceRow label="Pembelian (COGS)" value={formatIDR(cashflow?.totalModal || 0)} icon={<ArrowDownRight size={16} color="#F87171" />} isExpense />
          <FinanceRow label="Logistik & Ops" value={formatIDR(cashflow?.totalTransport || 0)} icon={<ArrowDownRight size={16} color="#F87171" />} isExpense />
          <FinanceRow label="Loss Lapangan" value={formatIDR(cashflow?.totalKerugian || 0)} icon={<ArrowDownRight size={16} color="#F87171" />} isExpense />
        </Section>

        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <Info size={18} color="#10B981" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F1F5F9', marginBottom: '4px' }}>Tips Cash Flow</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5 }}>
              Margin rata-rata Anda adalah <b style={{ color: '#10B981' }}>Rp 1.250/kg</b>. Pertahankan loss di bawah 1% untuk menjaga profitabilitas.
            </div>
          </div>
        </div>

        <button style={{
          width: '100%', padding: '16px', background: '#111C24', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', color: '#F1F5F9', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
        }}>
          <Download size={18} /> Download Laporan (PDF/Excel)
        </button>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', fontWeight: 800, color: '#F1F5F9', fontFamily: 'Sora' }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function FinanceRow({ label, value, icon, isExpense }) {
  return (
    <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isExpense ? 'rgba(248,113,113,0.1)' : 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8' }}>{label}</span>
      </div>
      <span style={{ fontSize: '14px', fontWeight: 800, color: isExpense ? '#FCA5A5' : '#F1F5F9', fontFamily: 'monospace' }}>
        {isExpense ? `-${value}` : value}
      </span>
    </div>
  );
}
