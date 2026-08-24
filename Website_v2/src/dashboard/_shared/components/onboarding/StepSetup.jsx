import React from 'react'
import { PawPrint, Scale, Calendar, Info, Warehouse } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/DatePicker'
import PeternakSapiForm from './PeternakSapiForm'

/**
 * VERTICAL_SETUP_CONFIG
 * Single source of truth: yang masuk sini wajib setup step.
 * Breeding tidak perlu setup saat onboarding — masuk dashboard empty state.
 */
const VERTICAL_SETUP_CONFIG = {
  peternak_sapi_penggemukan: {
    component: 'sapi',   // handled by dedicated PeternakSapiForm (has template feature)
    accent:   '#D97706',
    label:    'Sapi Penggemukan',
    emoji:    '🐄',
    infoText: 'Untuk menghitung ADG & profit secara otomatis.',
  },
  peternak_domba_penggemukan: {
    component: 'fattening',
    accent:   '#16A34A',
    label:    'Domba Penggemukan',
    emoji:    '🐑',
    infoText: 'Untuk menghitung ADG & estimasi profit per ekor.',
    weightPlaceholder: '25',
    weightMin: 1,
    countPlaceholder: '20',
    batchPlaceholder: 'Batch Domba April 2025',
    kandangPlaceholder: 'Kandang Domba A',
  },
  peternak_kambing_penggemukan: {
    component: 'fattening',
    accent:   '#16A34A',
    label:    'Kambing Penggemukan',
    emoji:    '🐐',
    infoText: 'Untuk menghitung ADG & estimasi profit per ekor.',
    weightPlaceholder: '20',
    weightMin: 1,
    countPlaceholder: '20',
    batchPlaceholder: 'Batch Kambing April 2025',
    kandangPlaceholder: 'Kandang Kambing A',
  },
  peternak_kambing_domba_penggemukan: {
    component: 'fattening',
    accent:   '#16A34A',
    label:    'Domba & Kambing Penggemukan',
    emoji:    '🐑',
    infoText: 'Untuk menghitung ADG & estimasi profit per ekor.',
    weightPlaceholder: '22',
    weightMin: 1,
    countPlaceholder: '30',
    batchPlaceholder: 'Batch April 2025',
    kandangPlaceholder: 'Kandang Utama A',
  },
}

// ─── Generic Fattening Form ─────────────────────────────────────────────────
function GenericFatteningSetup({ data, onChange, config, t }) {
  const set = (key, val) => onChange({ ...data, [key]: val })

  const { accent } = config
  const accentBg     = `${accent}18`
  const accentBorder = `${accent}30`

  const labelCls = 'flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 ml-1'
  const inputCls = 'h-11 rounded-xl bg-[#111C24] border-white/5 px-4 font-bold text-sm focus:bg-[#15232d] transition-all'

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* Nama Kandang — full width */}
      <div>
        <Label className={labelCls} style={{ color: accent }}>
          <Warehouse size={12} style={{ color: accent }} />
          {t('setup_kandang_label', 'Nama Kandang')} <span className="ml-0.5 opacity-50">*</span>
        </Label>
        <Input
          type="text"
          value={data.kandang_name || ''}
          onChange={e => set('kandang_name', e.target.value)}
          placeholder={config.kandangPlaceholder || 'Kandang Utama A'}
          className={inputCls}
        />
      </div>
 
      <div className="grid grid-cols-2 gap-3">
        {/* Jumlah Ekor */}
        <div>
          <Label className={labelCls} style={{ color: accent }}>
            <PawPrint size={12} style={{ color: accent }} />
            {t('setup_populasi_label', 'Populasi (Ekor)')} <span className="ml-0.5 opacity-50">*</span>
          </Label>
          <Input
            type="number"
            min="1"
            value={data.initial_count || ''}
            onChange={e => set('initial_count', e.target.value)}
            placeholder={config.countPlaceholder || '0'}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Tanggal Masuk */}
        <div>
          <Label className={labelCls} style={{ color: accent }}>
            <Calendar size={12} style={{ color: accent }} />
            {t('setup_tanggal_masuk_label', 'Tanggal Masuk')} <span className="ml-0.5 opacity-50">*</span>
          </Label>
          <DatePicker
            value={data.start_date || new Date().toISOString().split('T')[0]}
            onChange={val => set('start_date', val)}
            allowClear={false}
            className="h-11 rounded-xl bg-[#111C24] border-white/5"
          />
        </div>

        {/* Berat Rata-rata */}
        <div>
          <Label className={labelCls} style={{ color: accent }}>
            <Scale size={12} style={{ color: accent }} />
            {t('setup_berat_avg_label', 'Berat Avg (kg)')}
          </Label>
          <div className="relative">
            <Input
              type="number"
              min={config.weightMin ?? 1}
              step="0.1"
              value={data.initial_avg_weight || ''}
              onChange={e => set('initial_avg_weight', e.target.value)}
              placeholder={config.weightPlaceholder || '25'}
              className={`${inputCls} pr-10`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/20 uppercase tracking-widest pointer-events-none">
              kg
            </span>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div
        className="flex items-center gap-3 rounded-xl p-3 border"
        style={{ background: accentBg, borderColor: accentBorder }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border"
          style={{ background: accentBg, borderColor: accentBorder, color: accent }}
        >
          <Info size={14} />
        </div>
        <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
          {t('setup_info_text', 'Data ini digunakan untuk menghitung performa batch secara otomatis.')}
        </p>
      </div>
    </div>
  )
}

// ─── StepSetup export ───────────────────────────────────────────────────────
export default function StepSetup({ selectedModel, setupData, setSetupData, t }) {
  const config = VERTICAL_SETUP_CONFIG[selectedModel]

  // Sapi uses dedicated form (has template feature)
  if (selectedModel === 'peternak_sapi_penggemukan') {
    return <PeternakSapiForm data={setupData} onChange={setSetupData} t={t} />
  }

  // Generic fattening form for other penggemukan verticals
  if (config?.component === 'fattening') {
    return <GenericFatteningSetup data={setupData} onChange={setSetupData} config={config} t={t} />
  }

  // Fallback (should not happen — only verticals in SETUP_REQUIRED_VERTICALS hit this component)
  return (
    <div className="p-6 text-center rounded-xl border border-white/5 bg-white/[0.02]">
      <p className="text-[13px] text-slate-500 italic">
        {t('setup_no_config', 'Tidak ada konfigurasi tambahan untuk tipe bisnis ini.')}
      </p>
    </div>
  )
}

// Export the config so BusinessModelOverlay can read it
export { VERTICAL_SETUP_CONFIG }
