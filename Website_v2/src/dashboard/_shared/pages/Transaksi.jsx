import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePurchases } from '@/lib/hooks/usePurchases';
import { useSales } from '@/lib/hooks/useSales';
import { formatIDRShort, formatDate, formatRelative, formatWeight } from '@/lib/format';
import TopBar from '../components/TopBar';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Transaksi() {
  const [activeTab, setActiveTab] = useState('jual'); // 'jual' or 'beli'
  const { data: purchases, isLoading: loadingPurchases } = usePurchases();
  const { data: sales, isLoading: loadingSales } = useSales();

  const isLoading = activeTab === 'jual' ? loadingSales : loadingPurchases;
  const data = activeTab === 'jual' ? sales : purchases;

  return (
    <div style={{ background: '#06090F', minHeight: '100vh' }}>
      <TopBar title="Riwayat Transaksi" subtitle="Data jual & beli stok" />

      {/* Tab Switcher */}
      <div style={{ padding: '4px', margin: '16px 20px', background: '#111C24', borderRadius: '12px', display: 'flex', position: 'relative' }}>
        {['jual', 'beli'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'capitalize',
              color: activeTab === tab ? '#F1F5F9' : '#4B6478',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              zIndex: 1,
              transition: 'color 0.2s'
            }}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="active-tab-pill"
                style={{
                  position: 'absolute',
                  inset: '4px',
                  width: 'calc(50% - 4px)',
                  left: tab === 'jual' ? '4px' : 'calc(50%)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  zIndex: -1
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            {tab}
          </button>
        ))}
      </div>

      <main style={{ padding: '0 20px 20px' }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : !data || data.length === 0 ? (
          <EmptyState 
            icon={activeTab === 'jual' ? '📈' : '📦'} 
            title={`Belum ada ${activeTab}`} 
            desc={`Mulai catat transaksi ${activeTab} ayam kamu.`}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.map((txn) => (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: '#111C24',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                  padding: '16px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Header: Name & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#F1F5F9', fontFamily: 'Sora' }}>
                      {activeTab === 'jual' ? txn.rpa_clients?.rpa_name : txn.farms?.farm_name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#4B6478', marginTop: '2px' }}>
                      {formatDate(txn.transaction_date)} · {formatRelative(txn.transaction_date)}
                    </div>
                  </div>
                  
                  {activeTab === 'jual' && (
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: txn.payment_status === 'lunas' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(248,113,113,0.12)',
                      color: txn.payment_status === 'lunas' ? '#10B981' : '#F87171',
                      textTransform: 'uppercase'
                    }}>
                      {txn.payment_status === 'sebagian' ? 'Sebagian' : txn.payment_status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                    </div>
                  )}
                </div>

                {/* Details Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', gap: '8px 16px', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#94A3B8' }}>{txn.total_birds} ekor · {formatWeight(txn.total_weight)}</div>
                  <div style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'right' }}>{formatIDRShort(txn.avg_weight * txn.price_per_kg)}/ekor</div>
                  
                  <div style={{ fontSize: '13px', color: '#4B6478' }}>
                    Harga: {formatIDRShort(txn.price_per_kg)}/kg
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#4B6478', fontWeight: 600, textTransform: 'uppercase' }}>
                      {activeTab === 'jual' ? 'Total Pendapatan' : 'Total Modal'}
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 800, 
                      color: activeTab === 'jual' ? '#10B981' : '#F1F5F9',
                      fontFamily: 'Sora'
                    }}>
                      {formatIDRShort(activeTab === 'jual' ? txn.net_revenue : txn.total_modal)}
                    </div>
                  </div>
                </div>

                {/* Profit bar for sales */}
                {activeTab === 'jual' && txn.purchases && (
                  <div style={{ 
                    marginTop: '12px', 
                    paddingTop: '12px', 
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '12px', color: '#4B6478' }}>Estimasi Profit:</span>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 700, 
                      color: (txn.net_revenue - (txn.total_weight * (txn.purchases.total_modal / txn.purchases.total_weight))) >= 0 ? '#10B981' : '#F87171' 
                    }}>
                      {formatIDRShort(txn.net_revenue - (txn.total_weight * (txn.purchases.total_modal / txn.purchases.total_weight)))}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
