import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight, TrendingUp, Info } from 'lucide-react';
import { formatIDR } from '@/lib/format';
import TopBar from '../components/TopBar';

export default function Simulator() {
  const [beli, setBeli] = useState(21000);
  const [jual, setJual] = useState(23500);
  const [berat, setBerat] = useState(1.8);
  const [jumlah, setJumlah] = useState(1000);
  const [biaya, setBiaya] = useState(500000);

  const totalBerat = jumlah * berat;
  const modal = (totalBerat * beli) + biaya;
  const pendapatan = totalBerat * jual;
  const profit = pendapatan - modal;
  const roi = (profit / modal) * 100;
  const profitPerKg = profit / totalBerat;

  return (
    <div style={{ background: '#06090F', minHeight: '100vh' }}>
      <TopBar title="Simulator Margin" showBack={true} />

      <main style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Calculator size={18} color="#10B981" />
              <span style={{ fontFamily: 'Sora', fontWeight: 800, color: '#F1F5F9' }}>Input Parameter</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SliderInput label="Harga Beli (Rp/kg)" value={beli} min={15000} max={30000} step={100} onChange={setBeli} />
              <SliderInput label="Harga Jual (Rp/kg)" value={jual} min={15000} max={30000} step={100} onChange={setJual} />
              <SliderInput label="Rata-rata Berat (kg)" value={berat} min={0.8} max={3.0} step={0.1} onChange={setBerat} />
              <SliderInput label="Jumlah (Ekor)" value={jumlah} min={500} max={5000} step={100} onChange={setJumlah} />
              <SliderInput label="Biaya Ops (Rp)" value={biaya} min={0} max={2000000} step={50000} onChange={setBiaya} />
            </div>
          </div>

          {/* Results */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ 
              background: profit >= 0 ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #EF4444, #DC2626)',
              borderRadius: '24px',
              padding: '24px',
              color: 'white',
              boxShadow: profit >= 0 ? '0 10px 30px rgba(16, 185, 129, 0.2)' : '0 10px 30px rgba(239,68,68,0.3)'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '1px', marginBottom: '4px' }}>
              Estimasi Total Profit
            </div>
            <div style={{ fontFamily: 'Sora', fontSize: '32px', fontWeight: 800, marginBottom: '20px' }}>
              {profit >= 0 ? '+' : ''}{formatIDR(profit)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid hsl(var(--border))', paddingTop: '20px' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, marginBottom: '2px' }}>PROFIT / KG</div>
                <div style={{ fontSize: '16px', fontWeight: 800 }}>{formatIDR(profitPerKg)}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8, marginBottom: '2px' }}>ROI %</div>
                <div style={{ fontSize: '16px', fontWeight: 800 }}>{roi.toFixed(1)}%</div>
              </div>
            </div>
          </motion.div>

          {/* Breakdown */}
          <div style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#94A3B8' }}>
              <span>Total Berat (kg)</span>
              <span style={{ color: '#F1F5F9', fontWeight: 700 }}>{totalBerat.toFixed(0)} kg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#94A3B8' }}>
              <span>Modal Keseluruhan</span>
              <span style={{ color: '#F1F5F9', fontWeight: 700 }}>{formatIDR(modal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#94A3B8' }}>
              <span>Omzet Penjualan</span>
              <span style={{ color: '#F1F5F9', fontWeight: 700 }}>{formatIDR(pendapatan)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.1)' }}>
            <Info size={14} color="#60A5FA" />
            <span style={{ fontSize: '11px', color: '#93C5FD', lineHeight: 1.4 }}>
              Simulator ini menggunakan perhitangan estimasi kasar. Hasil lapangan dapat berbeda karena penyusutan berat.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

function SliderInput({ label, value, min, max, step, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#4B6478', textTransform: 'uppercase' }}>{label}</label>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>{label.includes('kg') && !label.includes('/kg') ? value : formatIDR(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: '6px',
          background: '#0C1319',
          borderRadius: '99px',
          appearance: 'none',
          outline: 'none',
          cursor: 'pointer'
        }}
      />
    </div>
  );
}
