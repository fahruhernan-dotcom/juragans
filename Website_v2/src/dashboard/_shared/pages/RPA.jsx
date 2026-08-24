import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Phone, MapPin, ChevronRight, Calculator, Star, Zap } from 'lucide-react';
import { formatIDRShort } from '@/lib/format';
import TopBar from '../components/TopBar';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import FormBayarModal from '../forms/FormBayarModal';

export default function RPA() {
  const rpas = [];
  const isLoading = false;
  const [search, setSearch] = useState('');
  const [selectedRPA, setSelectedRPA] = useState(null);

  const filtered = rpas?.filter(r => 
    r.rpa_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: '#06090F', minHeight: '100vh' }}>
      <TopBar 
        title="Daftar RPA" 
        subtitle="Kelola pembeli & tagihan" 
        rightAction={
          <button style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            padding: '8px 12px',
            color: '#10B981',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Plus size={14} /> Baru
          </button>
        }
      />

      <div style={{ padding: '16px 20px' }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          marginBottom: '20px'
        }}>
          <Search size={16} color="#4B6478" style={{ position: 'absolute', left: '14px', top: '14px' }} />
          <input
            type="text"
            placeholder="Cari nama RPA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px 12px 42px',
              background: '#111C24',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              color: '#F1F5F9',
              fontSize: '14px',
              fontFamily: 'DM Sans',
              outline: 'none'
            }}
          />
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : !filtered || filtered.length === 0 ? (
          <EmptyState title="RPA Tidak Ditemukan" desc="Coba cari dengan kata kunci lain." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((rpa) => (
              <motion.div
                key={rpa.id}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: '#111C24',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{
                        width: '36px', height: '36px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 800, color: '#10B981', fontFamily: 'Sora',
                        overflow: 'hidden'
                      }}>
                        {rpa.profile_img ? (
                          <img src={rpa.profile_img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : rpa.rpa_name.slice(0, 1)}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#F1F5F9', fontFamily: 'Sora' }}>{rpa.rpa_name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '11px', color: '#4B6478', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Star size={10} color="#F59E0B" fill="#F59E0B" /> {rpa.reliability_score || 4.5}
                          </span>
                          <span style={{ fontSize: '10px', opacity: 0.3, color: '#4B6478' }}>•</span>
                          <span style={{ fontSize: '11px', color: '#4B6478', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Zap size={10} color="#10B981" /> {rpa.distance_km || 0} km
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#4B6478' }}>
                        <MapPin size={12} /> {rpa.region || 'N/A'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#4B6478' }}>
                        <Phone size={12} /> {rpa.phone || '-'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#4B6478', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Kontak: <span style={{ color: '#94A3B8' }}>{rpa.contact_name || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>Piutang</div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 800, 
                      color: rpa.total_outstanding > 0 ? '#F87171' : '#10B981',
                      fontFamily: 'Sora'
                    }}>
                      {formatIDRShort(rpa.total_outstanding)}
                    </div>
                  </div>
                </div>

                {rpa.total_outstanding > 0 && (
                  <div style={{ 
                    marginTop: '16px', 
                    paddingTop: '12px', 
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <button 
                      onClick={() => setSelectedRPA(rpa)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#10B981',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <Calculator size={14} /> Bayar Tagihan
                    </button>
                    <button 
                      style={{
                        padding: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#94A3B8',
                        cursor: 'pointer'
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <FormBayarModal 
        isOpen={!!selectedRPA} 
        onClose={() => setSelectedRPA(null)} 
        rpa={selectedRPA} 
      />
    </div>
  );
}
