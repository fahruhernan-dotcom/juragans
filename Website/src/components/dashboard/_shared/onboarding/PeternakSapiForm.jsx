import React, { useState } from 'react'
import { PawPrint, Scale, Hash, Calendar, Info, Calculator, BadgePercent, Warehouse, Sparkles, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/DatePicker'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const TEMPLATE_PACKAGES = [
  { key: '150', label: '150 Hari — Intensif', desc: 'Konsentrat penuh, target ADG ~1 kg/hari' },
  { key: '180', label: '180 Hari — Semi-Intensif', desc: 'Hijauan + konsentrat, target ADG ~0.8 kg/hari' },
]

export default function PeternakSapiForm({ data, onChange, t }) {
  const set = (key, val) => onChange({ ...data, [key]: val })
  const [templateEnabled, setTemplateEnabled] = useState(false)
 
  const packages = [
    { key: '150', label: t('setup_sapi_temp_150_title', '150 Hari — Intensif'), desc: t('setup_sapi_temp_150_desc', 'Konsentrat penuh, target ADG ~1 kg/hari') },
    { key: '180', label: t('setup_sapi_temp_180_title', '180 Hari — Semi-Intensif'), desc: t('setup_sapi_temp_180_desc', 'Hijauan + konsentrat, target ADG ~0.8 kg/hari') },
  ]

  const fieldLabelStyle = "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-amber-500/80 mb-1.5 ml-1"
  const inputContainerStyle = "relative transition-all duration-300"

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <div className="grid grid-cols-2 gap-3">
        {/* Nama Kandang */}
        <div className={inputContainerStyle}>
          <Label className={fieldLabelStyle}>
            <Warehouse size={12} className="text-amber-500" />
            {t('setup_kandang_label', 'Nama Kandang')} <span className="text-amber-500/50 ml-0.5">*</span>
          </Label>
          <Input
            type="text"
            value={data.kandang_name || ''}
            onChange={e => set('kandang_name', e.target.value)}
            placeholder="Kandang A"
            className="h-11 rounded-xl bg-[#111C24] border-white/5 px-4 font-bold text-sm focus:bg-[#15232d] transition-all"
          />
        </div>

        {/* Nama Batch */}
        <div className={inputContainerStyle}>
          <Label className={fieldLabelStyle}>
            <Hash size={12} className="text-amber-500" />
            {t('setup_batch_name_label', 'Nama Batch')} <span className="text-amber-500/50 ml-0.5">*</span>
          </Label>
          <Input
            type="text"
            value={data.batch_name || ''}
            onChange={e => set('batch_name', e.target.value)}
            placeholder="Batch April 2024"
            className="h-11 rounded-xl bg-[#111C24] border-white/5 px-4 font-bold text-sm focus:bg-[#15232d] transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Tanggal Mulai */}
        <div className={inputContainerStyle}>
          <Label className={fieldLabelStyle}>
            <Calendar size={12} className="text-amber-500" />
            {t('setup_tanggal_mulai_label', 'Tanggal Mulai')} <span className="text-amber-500/50 ml-0.5">*</span>
          </Label>
          <DatePicker
            value={data.start_date || new Date().toISOString().split('T')[0]}
            onChange={val => set('start_date', val)}
            allowClear={false}
            className="h-11 rounded-xl bg-[#111C24] border-white/5"
          />
        </div>

        {/* Jumlah Ekor */}
        <div className={inputContainerStyle}>
          <Label className={fieldLabelStyle}>
            <PawPrint size={12} className="text-amber-500" />
            {t('setup_populasi_label', 'Populasi (Ekor)')} <span className="text-amber-500/50 ml-0.5">*</span>
          </Label>
          <Input
            type="number"
            min="1"
            value={data.initial_count || ''}
            onChange={e => set('initial_count', e.target.value)}
            placeholder="0"
            className="h-11 rounded-xl bg-[#111C24] border-white/5 px-4 font-bold text-sm focus:bg-[#15232d]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Berat Rata-rata */}
        <div className={inputContainerStyle}>
          <Label className={fieldLabelStyle}>
            <Scale size={12} className="text-amber-500" />
            {t('setup_berat_avg_label', 'Berat Avg (kg)')}
          </Label>
          <div className="relative">
            <Input
              type="number"
              min="50"
              step="0.1"
              value={data.initial_avg_weight || ''}
              onChange={e => set('initial_avg_weight', e.target.value)}
              placeholder="350"
              className="h-11 rounded-xl bg-[#111C24] border-white/5 pl-4 pr-10 font-bold text-sm focus:bg-[#15232d]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-white/20 uppercase tracking-widest pointer-events-none">kg</span>
          </div>
        </div>

        {/* Harga Beli */}
        <div className={inputContainerStyle}>
          <Label className={fieldLabelStyle}>
            <BadgePercent size={12} className="text-amber-500" />
            {t('setup_harga_beli_label', 'Harga Beli (Rp/kg)')}
          </Label>
          <Input
            type="number"
            min="0"
            step="500"
            value={data.purchase_price_per_kg || ''}
            onChange={e => set('purchase_price_per_kg', e.target.value)}
            placeholder="52000"
            className="h-11 rounded-xl bg-[#111C24] border-white/5 px-4 font-bold text-sm focus:bg-[#15232d]"
          />
        </div>
      </div>

      {/* Notice Box */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 rounded-xl blur-sm opacity-50 transition duration-1000"></div>
        <div className="relative flex items-center gap-3 bg-[#0F171F] border border-white/5 rounded-xl p-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-500 shadow-inner">
            <Calculator size={16} />
          </div>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
            {t('setup_sapi_info_text', 'Untuk menghitung ADG & profit secara otomatis.')}
          </p>
        </div>
      </div>

      {/* Template TernakOS — Opsional */}
      <div className="border border-[#7C3AED]/20 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-[#7C3AED]/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center">
              <Sparkles size={15} className="text-[#A78BFA]" />
            </div>
            <div>
              <p className="text-sm font-black text-white">{t('setup_sapi_template_title', 'Mulai dengan Template TernakOS')}</p>
              <p className="text-[10px] text-[#4B6478] font-medium mt-0.5">{t('setup_sapi_template_desc', 'Jadwal tugas otomatis sesuai SNI feedlot')}</p>
            </div>
          </div>
          <Switch
            checked={templateEnabled}
            onCheckedChange={v => {
              setTemplateEnabled(v)
              if (!v) set('templateType', null)
            }}
          />
        </div>

        {templateEnabled && (
          <div className="p-4 space-y-2 border-t border-[#7C3AED]/10 bg-[#7C3AED]/[0.03]">
            {packages.map(pkg => {
              const active = data.templateType === pkg.key
              return (
                <button
                  key={pkg.key}
                  type="button"
                  onClick={() => set('templateType', pkg.key)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border transition-all duration-150',
                    active
                      ? 'bg-[#7C3AED]/15 border-[#7C3AED]/50'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className={cn('text-xs font-black', active ? 'text-white' : 'text-slate-300')}>
                        {pkg.label}
                      </p>
                      <p className="text-[10px] text-[#4B6478] font-medium mt-0.5">{pkg.desc}</p>
                    </div>
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                      active ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-white/20'
                    )}>
                      {active && <Check size={10} className="text-white" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
