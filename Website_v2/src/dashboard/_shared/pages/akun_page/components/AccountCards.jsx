import React, { useState } from 'react'
import {
  Edit3, Shuffle, Sparkles, HelpCircle, Building2, Shield,
  Check, X, Package, Receipt, Sun, Globe, Bell, Settings, Phone,
  FileText, LogOut, ChevronRight, ArrowUpRight, Info, LayoutGrid,
  ClipboardList, BarChart2, Users, ShoppingCart, Truck, Warehouse,
  AlertTriangle, CreditCard, BellOff, RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useTheme, THEME_PRESETS } from '@/lib/hooks/useTheme'
import { useLanguage } from '@/lib/i18n/useLanguage'
import { useBrowserNotifications } from '@/lib/hooks/useBrowserNotifications'
import { useNotificationPreferences } from '@/lib/hooks/useNotifications'
import { useAppUpdate } from '@/lib/hooks/useAppUpdate'
import { AppUpdateModal } from '@/components/ui/AppUpdateModal'
import { T, PLAN_INFO, PERMISSION_MATRIX, APP_VERSION, APP_VERSION_LABEL, cardStyle } from '../constants'
import { Section, SectionLabel, InfoRow } from './Primitives'

// ─── Section 1: Profile Hero ──────────────────────────────────

export function ProfileHero({ accent, roleBadge, displayName, email, initials, tenantName }) {
  const { t } = useLanguage()
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      padding: '64px 20px 28px',
      background: `linear-gradient(180deg, ${accent.soft} 0%, transparent 100%), linear-gradient(135deg, ${accent.base}1a 0%, transparent 60%)`,
      borderBottom: `1px solid ${T.hairline}`,
      animation: 'fadeIn 400ms ease',
    }}>
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: -60, right: -40,
        width: 200, height: 200, borderRadius: 999,
        background: accent.base, opacity: 0.18,
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Avatar */}
        <div style={{
          width: 64, height: 64, borderRadius: 18, flexShrink: 0, position: 'relative',
          background: `linear-gradient(135deg, ${accent.base}, oklch(0.65 0.18 280))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: -0.5,
          boxShadow: `0 14px 36px ${accent.base}66`,
        }}>
          {initials}
          <span style={{
            position: 'absolute', bottom: -3, right: -3,
            width: 18, height: 18, borderRadius: 999,
            background: T.ok, color: '#fff', border: `2.5px solid ${T.bg}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check size={9} strokeWidth={3} />
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: -0.3, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          <div style={{ fontSize: 12, color: T.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
            {email}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 9px', borderRadius: 6, background: roleBadge.bg, color: roleBadge.fg, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              {roleBadge.label}
            </span>
            <span style={{ padding: '3px 9px', borderRadius: 6, background: accent.soft, color: accent.base, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: accent.base }} />
              {accent.name}
            </span>
          </div>
        </div>
      </div>

      {/* Tenant strip */}
      <div style={{
        marginTop: 16, padding: '10px 14px',
        background: T.surface + 'cc', backdropFilter: 'blur(12px)',
        border: `1px solid ${T.hairline}`, borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: accent.base + '22', color: accent.base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={13} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: T.textMute }}>{t('hero_active_biz')}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tenantName}</div>
        </div>
        <span style={{ padding: '3px 8px', borderRadius: 6, background: T.ok + '22', color: T.ok, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: T.ok, animation: 'pulse2 2s infinite' }} />
          {t('hero_active_status')}
        </span>
      </div>
    </div>
  )
}

// ─── Section 2: Quick Actions ─────────────────────────────────

export function QuickActions({ accent, plan, showBilling, isMultiTenant, onSwitch, onUpgrade, onManage, onHelp, onEditProfile }) {
  const { t } = useLanguage()
  const planLabel = plan === 'none' ? t('qa_plan_start')
    : plan === 'starter' || plan === 'basic' ? t('qa_plan_upgrade')
    : t('qa_plan_view')
  const planSub = plan === 'none' ? t('qa_plan_start_sub')
    : plan === 'starter' || plan === 'basic' ? t('qa_plan_upgrade_sub')
    : t('qa_plan_view_sub')
  const planFg = plan === 'none' ? 'oklch(0.78 0.16 80)'
    : plan === 'starter' || plan === 'basic' ? 'oklch(0.65 0.20 290)'
    : T.textDim
  const isFeaturedPlan = plan === 'none' || plan === 'starter' || plan === 'basic'

  const items = [
    { icon: <Edit3 size={17} />, label: t('qa_edit_profile'), sub: t('qa_edit_profile_sub'), fg: accent.base, featured: false, disabled: false, onClick: onEditProfile },
    isMultiTenant && { icon: <Shuffle size={17} />, label: t('qa_switch_biz'), sub: t('qa_switch_biz_sub'), fg: 'oklch(0.7 0.15 230)', featured: false, disabled: false, onClick: onSwitch },
    showBilling && { icon: <Sparkles size={17} />, label: planLabel, sub: planSub, fg: planFg, featured: isFeaturedPlan, disabled: false, onClick: onUpgrade },
    { icon: <HelpCircle size={17} />, label: t('qa_help'), sub: t('qa_help_sub'), fg: T.textDim, featured: false, disabled: false, onClick: onHelp },
    showBilling && { icon: <CreditCard size={17} />, label: t('qa_manage_plan'), sub: t('qa_manage_plan_sub'), fg: 'oklch(0.7 0.15 230)', featured: false, disabled: false, onClick: onManage },
  ].filter(Boolean)

  return (
    <div style={{ marginTop: 16, marginBottom: 18, animation: 'fadeInUp 300ms ease 0.05s both' }}>
      <SectionLabel label={t('qa_section')} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {items.map(it => (
          <button
            key={it.label}
            onClick={it.disabled ? undefined : it.onClick}
            disabled={it.disabled}
            style={{
              padding: 14, textAlign: 'left', cursor: it.disabled ? 'default' : 'pointer',
              background: it.featured ? `linear-gradient(135deg, ${it.fg}22, ${it.fg}05)` : T.surface,
              border: `1px solid ${it.featured ? it.fg + '40' : T.hairline}`,
              borderRadius: 14, position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', gap: 8,
              opacity: it.disabled ? 0.55 : 1,
            }}
          >
            {it.featured && (
              <span style={{
                position: 'absolute', top: 8, right: 8,
                width: 6, height: 6, borderRadius: 999, background: it.fg,
                boxShadow: `0 0 8px ${it.fg}`,
                animation: 'pulse2 1.8s ease-in-out infinite',
              }} />
            )}
            <span style={{ width: 36, height: 36, borderRadius: 11, background: it.fg + '22', color: it.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {it.icon}
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>{it.label}</div>
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>{it.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Section 3: Bisnis Aktif ──────────────────────────────────

export function getEditBizPath(rawVertical, basePath) {
  const bp = basePath || ''
  if (!bp) return null
  if (rawVertical === 'admin' || rawVertical === 'superadmin') return '/admin/settings'
  return bp + '/tim'
}

export function ActiveBusinessCard({ accent, roleBadge, tenantName, tenantCity, tenantProvince, canEditBisnis, onEditBiz }) {
  const { t } = useLanguage()
  return (
    <Section title={t('biz_section', 'Bisnis Aktif')} icon={<Building2 size={13} />} iconColor={accent.base} delay={0.1}>
      <div style={cardStyle()}>
        <InfoRow label={t('biz_name', 'Nama Bisnis')} value={tenantName} />
        <InfoRow label={t('biz_model', 'Model Bisnis')}>
          <span style={{ padding: '2px 8px', borderRadius: 6, background: accent.soft, color: accent.base, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            {accent.name}
          </span>
        </InfoRow>
        <InfoRow label={t('biz_location', 'Lokasi Bisnis')} value={tenantCity} />
        <InfoRow label={t('biz_province', 'Provinsi')}>
          {tenantProvince ? (
            <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{tenantProvince}</span>
          ) : (
            <span
              onClick={canEditBisnis ? onEditBiz : undefined}
              style={{
                fontSize: 11, fontWeight: 700, color: T.warn,
                background: 'oklch(0.78 0.14 70 / 0.12)',
                border: '1px solid oklch(0.78 0.14 70 / 0.3)',
                borderRadius: 6, padding: '2px 8px', letterSpacing: 0.3,
                textTransform: 'uppercase', cursor: canEditBisnis ? 'pointer' : 'default',
              }}
            >
              {canEditBisnis ? t('biz_province_missing_owner', 'Atur Provinsi') : t('biz_province_missing', 'Belum Diatur')}
            </span>
          )}
        </InfoRow>
        <InfoRow label={t('biz_role', 'Peran Akun')} noBorder>
          <span style={{ padding: '2px 8px', borderRadius: 6, background: roleBadge.bg, color: roleBadge.fg, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            {roleBadge.label}
          </span>
        </InfoRow>

        {onEditBiz && (
          <button
            onClick={onEditBiz}
            style={{
              width: '100%', marginTop: 12, padding: '11px',
              background: accent.soft, border: `1px solid ${accent.base}44`,
              color: accent.base, borderRadius: 12, cursor: 'pointer',
              fontSize: 13, fontWeight: 700, letterSpacing: -0.1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Edit3 size={14} strokeWidth={2.5} /> {t('biz_edit_btn', 'Ubah Data Bisnis')}
          </button>
        )}
      </div>
    </Section>
  )
}

// ─── Section 4: Akses Saya ────────────────────────────────────

function getAccessLabelsByVertical(rawVertical, t) {
  return [
    { key: 'input',   label: t('access_sembako_input_label', 'Input Transaksi & POS'),   desc: t('access_sembako_input_desc', 'POS kasir, buat invoice, dan pelanggan') },
    { key: 'edit',    label: t('access_sembako_edit_label', 'Kelola Produk & Stok'),    desc: t('access_sembako_edit_desc', 'Katalog harga, stok gudang, dan supplier') },
    { key: 'reports', label: t('access_sembako_reports_label', 'Laporan Bisnis & Keuangan'), desc: t('access_sembako_reports_desc', 'Omzet, laba rugi, HPP, dan piutang') },
    { key: 'team',    label: t('access_sembako_team_label', 'Kelola Tim & Karyawan'),    desc: t('access_sembako_team_desc', 'Manajemen staf dan hak akses akun') },
    { key: 'billing', label: t('access_sembako_billing_label', 'Kelola Server & Langganan'), desc: t('access_sembako_billing_desc', 'Masa aktif server dan upgrade plan') },
  ]
}

export function AccessSummaryCard({ role, accent, rawVertical }) {
  const { t } = useLanguage()
  const perms = PERMISSION_MATRIX[role] || PERMISSION_MATRIX.view_only
  const rows = getAccessLabelsByVertical(rawVertical, t)
  const grantedCount = rows.filter(r => perms[r.key]).length
  const pct = Math.round((grantedCount / rows.length) * 100)

  return (
    <Section
      title={t('access_section')}
      icon={<Shield size={13} />}
      iconColor="oklch(0.78 0.16 80)"
      rightAction={<span style={{ fontSize: 11, fontWeight: 700, color: T.textDim }}>{grantedCount}/{rows.length} {t('access_perms_label')}</span>}
      delay={0.12}
    >
      <div style={cardStyle()}>
        {/* Progress bar */}
        <div style={{ padding: '10px 12px', marginBottom: 10, background: T.surfaceAlt, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 999, background: T.hairline, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct + '%', background: accent.base, borderRadius: 999, transition: 'width 500ms' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{pct}%</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(r => {
            const granted = perms[r.key]
            return (
              <div key={r.key} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 10px', borderRadius: 10,
                background: granted ? accent.soft + '40' : 'transparent',
                opacity: granted ? 1 : 0.65,
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                  background: granted ? accent.base : T.surfaceAlt,
                  color: granted ? '#0A0E0C' : T.textMute,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {granted ? <Check size={13} strokeWidth={3} /> : <X size={12} strokeWidth={2.5} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>{r.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

// ─── Section 5: Billing ───────────────────────────────────────

export function BillingCard({ accent, plan, onUpgrade }) {
  const { t, tPlan } = useLanguage()
  const info = PLAN_INFO[plan] || PLAN_INFO.none
  const planLabel = tPlan(plan)
  const planHistory = t(`plan_${plan}_history`, info.history)
  const canUpgrade = plan === 'none' || plan === 'starter' || plan === 'basic'
  const upgradeLabel = plan === 'none' ? t('billing_start_btn') : t('billing_upgrade_btn')
  const accentColor = plan === 'none' ? 'oklch(0.78 0.16 80)'
    : plan === 'starter' || plan === 'basic' ? 'oklch(0.65 0.20 290)'
    : accent.base

  if (plan === 'none') {
    return (
      <Section title={t('billing_section')} icon={<Package size={13} />} iconColor="oklch(0.78 0.16 80)" delay={0.15}>
        <div style={{
          padding: 18, borderRadius: 16, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, oklch(0.78 0.16 80 / 0.16), oklch(0.78 0.16 80 / 0.04))',
          border: '1px solid oklch(0.78 0.16 80 / 0.38)',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 999, background: 'oklch(0.78 0.16 80)', opacity: 0.15, filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'oklch(0.78 0.16 80)', color: '#0A0E0C', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 28px oklch(0.78 0.16 80 / 0.55)' }}>
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: T.textDim }}>{t('billing_no_sub')}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: -0.2, marginTop: 2 }}>{t('billing_no_sub_title')}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.5, marginBottom: 14, position: 'relative' }}>
            {t('billing_no_sub_desc')}
          </div>
          <button onClick={onUpgrade} style={{
            width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'oklch(0.78 0.16 80)', color: '#0A0E0C',
            fontSize: 14, fontWeight: 700, letterSpacing: -0.1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 22px oklch(0.78 0.16 80 / 0.45)',
          }}>
            <Sparkles size={16} strokeWidth={2.5} /> {t('billing_start_btn')}
          </button>
        </div>
      </Section>
    )
  }

  return (
    <Section title={t('billing_section')} icon={<Package size={13} />} iconColor={accentColor} delay={0.15}>
      <div style={{
        ...cardStyle(),
        background: `linear-gradient(135deg, ${accentColor}14, ${accentColor}04)`,
        border: `1px solid ${accentColor}30`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: T.textDim }}>{t('billing_active')}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: -0.4 }}>{planLabel}</span>
              {info.price && <span style={{ fontSize: 11, color: T.textDim }}>· {info.price}{t('billing_per_month', '/bulan')}</span>}
            </div>
          </div>
          <span style={{ padding: '4px 10px', borderRadius: 6, background: T.ok + '22', color: T.ok, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{t('billing_status_active')}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.textMute, marginBottom: 2 }}>{t('billing_usage_title')}</div>
          <LimitRow label={t('billing_usage_users')}   used={plan === 'starter' ? 1 : 3} cap={info.users === 999 ? null : info.users}   subtitle={info.users === 999 ? 'Unlimited' : null}   accent={accentColor} />
          <LimitRow label={t('billing_usage_batch')}   used={plan === 'starter' ? 2 : 3} cap={info.batches === 999 ? null : info.batches} subtitle={info.batches === 999 ? 'Unlimited' : null} accent={accentColor} />
          <LimitRow label={t('billing_usage_history')} used={null} cap={null} subtitle={planHistory} accent={accentColor} />
        </div>

        {info.next && (
          <div style={{ fontSize: 11, color: T.textDim, marginBottom: 12 }}>
            {t('billing_next_payment')} <span style={{ color: T.text, fontWeight: 600 }}>{info.next}</span>
          </div>
        )}

        {canUpgrade && (
          <button onClick={onUpgrade} style={{
            width: '100%', padding: '11px', border: 'none', borderRadius: 11, cursor: 'pointer',
            background: accentColor, color: '#0A0E0C',
            fontSize: 13, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            boxShadow: `0 6px 18px ${accentColor}55`,
          }}>
            <ArrowUpRight size={14} strokeWidth={2.5} /> {upgradeLabel}
          </button>
        )}
      </div>
    </Section>
  )
}

export function BillingHandledByOwnerCard() {
  const { t } = useLanguage()
  return (
    <Section title={t('billing_section')} icon={<Package size={13} />} iconColor={T.textMute} delay={0.15}>
      <div style={{ ...cardStyle(), display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: T.surfaceAlt, color: T.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Info size={16} />
        </span>
        <div style={{ flex: 1, fontSize: 13, color: T.textDim, lineHeight: 1.5 }}>
          {t('billing_managed_by')} <span style={{ color: T.text, fontWeight: 600 }}>{t('billing_managed_owner')}</span>.
        </div>
      </div>
    </Section>
  )
}

function LimitRow({ label, used, cap, subtitle, accent: accentColor }) {
  const pct = used != null && cap ? Math.min(100, (used / cap) * 100) : 100
  const isMaxed = used === cap && cap > 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: T.textDim }}>{label}</span>
        <span style={{ color: isMaxed ? T.warn : T.text, fontWeight: 600 }}>
          {used != null ? used + '/' + cap : subtitle}
        </span>
      </div>
      {used != null && (
        <div style={{ height: 4, background: T.hairline, borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: pct + '%', background: isMaxed ? T.warn : accentColor, borderRadius: 999 }} />
        </div>
      )}
    </div>
  )
}

// ─── Section 5.5: Vertical Shortcuts ─────────────────────────

function getVerticalShortcuts(rawVertical, basePath, t) {
  const bp = basePath || '/broker/distributor_sembako'
  if (rawVertical === 'admin' || rawVertical === 'superadmin') {
    return [
      { icon: 'users',    label: t('shortcut_users', 'Pengguna'),      path: '/admin/users' },
      { icon: 'package',  label: t('shortcut_langganan', 'Langganan'),  path: '/admin/subscriptions' },
      { icon: 'barchart', label: t('shortcut_aktivitas', 'Aktivitas'),  path: '/admin/activity' },
      { icon: 'settings', label: t('shortcut_pengaturan', 'Pengaturan'), path: '/admin/settings' },
    ]
  }
  return [
    { icon: 'shopping',  label: t('shortcut_penjualan', 'Penjualan'), path: bp + '/penjualan' },
    { icon: 'warehouse', label: t('shortcut_gudang', 'Gudang'),    path: bp + '/gudang' },
    { icon: 'barchart',  label: t('shortcut_laporan', 'Laporan'),   path: bp + '/laporan' },
    { icon: 'users',     label: t('shortcut_tim', 'Tim & Akses'),   path: bp + '/tim' },
  ]
}

const SHORTCUT_ICONS = {
  clipboard: <ClipboardList size={16} />,
  package:   <Package size={16} />,
  barchart:  <BarChart2 size={16} />,
  users:     <Users size={16} />,
  shopping:  <ShoppingCart size={16} />,
  truck:     <Truck size={16} />,
  receipt:   <Receipt size={16} />,
  warehouse: <Warehouse size={16} />,
  settings:  <Settings size={16} />,
}

export function VerticalShortcutsCard({ rawVertical, basePath, accent, navigate, isStarter = false }) {
  const { t } = useLanguage()
  const shortcuts = getVerticalShortcuts(rawVertical, basePath, t, isStarter)
  if (!shortcuts.length) return null
  return (
    <Section title={t('shortcuts_section')} icon={<LayoutGrid size={13} />} iconColor={accent.base} delay={0.17}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {shortcuts.map(s => (
          <button
            key={s.label}
            onClick={() => navigate(s.path)}
            style={{
              padding: '12px 4px 10px',
              background: T.surface, border: `1px solid ${T.hairline}`,
              borderRadius: 12, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{
              width: 32, height: 32, borderRadius: 10,
              background: accent.soft, color: accent.base,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {SHORTCUT_ICONS[s.icon]}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: T.textDim,
              textAlign: 'center', letterSpacing: -0.1, lineHeight: 1.2,
            }}>
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </Section>
  )
}

// ─── Section 6: Preferensi ────────────────────────────────────

// ── Shared sub-component: collapsible preference row ──────────
function PrefRow({ icon, label, desc, open, onToggle, noBorder, children }) {
  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 4px',
          borderBottom: open || noBorder ? 'none' : `1px solid ${T.hairline}`,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          background: 'transparent', cursor: 'pointer', textAlign: 'left',
          borderRadius: 0,
        }}
      >
        <span style={{
          width: 30, height: 30, borderRadius: 9,
          background: T.surfaceAlt, color: T.textDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>{label}</div>
          {desc && <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>{desc}</div>}
        </div>
        <ChevronRight
          size={14} color={T.textMute}
          style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 150ms', flexShrink: 0 }}
        />
      </button>
      {open && (
        <div style={{
          padding: '12px 14px 16px',
          borderBottom: noBorder ? 'none' : `1px solid ${T.hairline}`,
          background: T.surfaceAlt, borderRadius: 10, marginBottom: 4,
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Toggle switch sub-component ────────────────────────────────
function Toggle({ on, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', padding: 2,
        background: on ? 'oklch(0.72 0.15 155)' : T.hairlineStrong,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 200ms',
        flexShrink: 0, position: 'relative',
        display: 'flex', alignItems: 'center',
      }}
    >
      <span style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        transform: on ? 'translateX(18px)' : 'translateX(0)',
        transition: 'transform 200ms',
        display: 'block',
      }} />
    </button>
  )
}

export function PreferencesCard() {
  // ── Tema ──
  const { accentColor, setTheme } = useTheme()
  const [themeOpen, setThemeOpen] = useState(false)
  const activePreset = THEME_PRESETS.find(p => p.hex === accentColor)

  // ── Bahasa ──
  const { lang, setLang, t, languages } = useLanguage()
  const [langOpen, setLangOpen] = useState(false)
  const activeLang = languages.find(l => l.code === lang) || languages[0]

  // ── Notifikasi ──
  const notif = useBrowserNotifications()
  const { preferences, updatePreferences } = useNotificationPreferences()
  const [notifOpen, setNotifOpen] = useState(false)

  const permStatusColor = notif.permission === 'granted'
    ? 'oklch(0.72 0.15 155)'
    : notif.permission === 'denied'
      ? T.warn
      : T.textDim

  const permStatusLabel = !notif.supported
    ? t('notif_unsupported')
    : notif.permission === 'granted'
      ? t('notif_status_granted')
      : notif.permission === 'denied'
        ? t('notif_status_denied')
        : t('notif_status_default')

  const handleNotifMainToggle = () => {
    if (!notif.supported) return
    if (notif.permission === 'denied') return
    if (notif.enabled) {
      notif.setEnabled(false)
    } else {
      notif.requestEnable()
    }
  }

  return (
    <Section title={t('pref_section')} icon={<Settings size={13} />} iconColor="oklch(0.72 0.13 200)" delay={0.18}>
      <div style={cardStyle()}>

        {/* ─── Warna Tema ─── */}
        <PrefRow
          icon={<Sun size={14} />}
          label={t('theme_label')}
          desc={`${t('theme_active_prefix')} ${activePreset ? activePreset.name : 'Default'} · ${t('theme_mode_label')}`}
          open={themeOpen}
          onToggle={() => setThemeOpen(o => !o)}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMute, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>
            {t('theme_panel_heading')}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {THEME_PRESETS.map(preset => {
              const isActive = accentColor === preset.hex
              return (
                <button
                  key={preset.hex}
                  title={preset.label}
                  onClick={() => setTheme(isActive ? null : preset.hex)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: preset.hex,
                    border: isActive ? `3px solid ${preset.hex}` : '3px solid transparent',
                    outline: isActive ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.15s, outline 0.15s',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    flexShrink: 0,
                  }}
                >
                  {isActive && <Check size={14} color="white" strokeWidth={3} />}
                </button>
              )
            })}
          </div>
          {accentColor && (
            <button
              onClick={() => setTheme(null)}
              style={{ marginTop: 10, fontSize: 11, color: T.textDim, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {t('theme_reset')}
            </button>
          )}
        </PrefRow>

        {/* ─── Bahasa ─── */}
        <PrefRow
          icon={<Globe size={14} />}
          label={t('lang_label')}
          desc={`${activeLang.flag} ${activeLang.native}`}
          open={langOpen}
          onToggle={() => setLangOpen(o => !o)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {languages.map(l => {
              const isActive = lang === l.code
              return (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setLangOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: isActive ? 'oklch(0.72 0.15 155 / 0.15)' : 'transparent',
                    border: `1px solid ${isActive ? 'oklch(0.72 0.15 155 / 0.4)' : T.hairline}`,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background 150ms, border-color 150ms',
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{l.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{l.native}</div>
                    <div style={{ fontSize: 10, color: T.textDim, marginTop: 1 }}>{l.label}</div>
                  </div>
                  {isActive && <Check size={14} color="oklch(0.72 0.15 155)" strokeWidth={3} />}
                </button>
              )
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: 10, color: T.textMute, letterSpacing: 0.2 }}>
            {t('lang_scope_note')}
          </div>
        </PrefRow>

        {/* ─── Notifikasi ─── */}
        <PrefRow
          icon={notif.enabled ? <Bell size={14} /> : <BellOff size={14} />}
          label={t('notif_label')}
          desc={`${permStatusLabel}${notif.enabled ? ' · 3 kategori aktif' : ''}`}
          open={notifOpen}
          onToggle={() => setNotifOpen(o => !o)}
          noBorder
        >
          {/* Browser support check */}
          {!notif.supported ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 10,
              background: T.surfaceAlt, border: `1px solid ${T.hairline}`,
            }}>
              <BellOff size={14} color={T.textMute} />
              <div style={{ fontSize: 12, color: T.textDim }}>{t('notif_unsupported')}</div>
            </div>
          ) : (
            <>
              {/* Main toggle row */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 10,
                background: notif.enabled ? 'oklch(0.72 0.15 155 / 0.1)' : T.bg,
                border: `1px solid ${notif.enabled ? 'oklch(0.72 0.15 155 / 0.3)' : T.hairline}`,
                marginBottom: 10,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{t('notif_toggle_label')}</div>
                  <div style={{ fontSize: 11, marginTop: 2, color: permStatusColor, fontWeight: 500 }}>
                    {permStatusLabel}
                  </div>
                </div>
                <Toggle
                  on={notif.enabled}
                  onChange={handleNotifMainToggle}
                  disabled={notif.permission === 'denied' || !notif.supported}
                />
              </div>

              {/* Denied state help text */}
              {notif.permission === 'denied' && (
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  padding: '10px 12px', borderRadius: 10,
                  background: `${T.warn}10`, border: `1px solid ${T.warn}30`,
                  marginBottom: 10,
                }}>
                  <AlertTriangle size={13} color={T.warn} style={{ marginTop: 1, flexShrink: 0 }} />
                  <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>
                    {t('notif_denied_help')}
                  </div>
                </div>
              )}

              {/* Category toggles — only shown when enabled */}
              {notif.enabled && notif.permission === 'granted' && (
                <>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
                    textTransform: 'uppercase', color: T.textMute, marginBottom: 8,
                  }}>
                    Kanal Notifikasi Bisnis
                  </div>
                  {[
                    { key: 'notify_new_sale', label: 'Pesanan Baru Masuk', desc: 'Notifikasi saat ada nota/pesanan baru dibuat' },
                    { key: 'notify_payment_received', label: 'Pembayaran Diterima', desc: 'Notifikasi saat ada pembayaran nota lunas/parsial' },
                    { key: 'notify_low_stock', label: 'Peringatan Stok Menipis', desc: 'Notifikasi saat stok produk mencapai batas minimum' },
                    { key: 'notify_sale_status_changed', label: 'Perubahan Status Nota', desc: 'Notifikasi saat status pesanan berubah' },
                    { key: 'notify_delivery', label: 'Pengiriman & Surat Jalan', desc: 'Notifikasi jadwal dan penyelesaian pengiriman barang' },
                    { key: 'notify_system_alert', label: 'Pemberitahuan Sistem', desc: 'Notifikasi jatuh tempo piutang & masa aktif' },
                  ].map((cat, i, arr) => (
                    <div
                      key={cat.key}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                        padding: '8px 0',
                        borderBottom: i < arr.length - 1 ? `1px solid ${T.hairline}` : 'none',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{cat.label}</div>
                        <div style={{ fontSize: 10, color: T.textDim, marginTop: 1 }}>{cat.desc}</div>
                      </div>
                      <Toggle
                        on={preferences?.[cat.key] ?? true}
                        onChange={v => updatePreferences({ [cat.key]: v })}
                      />
                    </div>
                  ))}
                  <div style={{ marginTop: 10, fontSize: 10, color: T.textMute, lineHeight: 1.5 }}>
                    {t('notif_browser_note')}
                  </div>
                </>
              )}
            </>
          )}
        </PrefRow>

      </div>
    </Section>
  )
}

// ─── Section 7: Bantuan & Tentang ─────────────────────────────

export function HelpAboutCard({ navigate, canDeleteBusiness, onDeleteClick }) {
  const { t } = useLanguage()
  const {
    checkForUpdate,
    hasUpdate,
    isModalOpen,
    setIsModalOpen,
    latestRelease,
    isMandatory,
    startDownload,
    currentVersion,
    currentVersionLabel,
  } = useAppUpdate()

  const items = [
    {
      icon: <RefreshCw size={14} className={hasUpdate ? "text-emerald-500 animate-spin" : ""} style={{ color: hasUpdate ? '#10B981' : T.textDim }} />,
      label: 'Periksa Pembaruan Aplikasi',
      sub: hasUpdate ? `Versi baru ${latestRelease?.version || ''} tersedia!` : `Versi ${currentVersion} (Terkini)`,
      badge: hasUpdate ? (
        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          Ada Update!
        </span>
      ) : null,
      onClick: () => checkForUpdate(true)
    },
    { icon: <HelpCircle size={14} />, label: t('help_center'),   sub: t('help_center_sub'),  onClick: () => navigate('/faq') },
    { icon: <Phone size={14} />,      label: t('help_contact'),  sub: t('help_contact_sub'), onClick: () => navigate('/hubungi-kami') },
    { icon: <FileText size={14} />,   label: t('help_terms'),    sub: null,                  onClick: () => navigate('/terms') },
    { icon: <Shield size={14} />,     label: t('help_privacy'),  sub: null,                  onClick: () => navigate('/privacy') },
    ...(canDeleteBusiness ? [
      { icon: <AlertTriangle size={14} color={T.danger} />, label: t('help_delete_biz'), sub: t('help_delete_biz_sub'), onClick: onDeleteClick }
    ] : [])
  ]
  return (
    <Section title={t('help_section')} icon={<Info size={13} />} iconColor={T.textMute} delay={0.2}>
      <div style={cardStyle()}>
        {items.map((it, i) => (
          <button
            key={it.label}
            onClick={it.onClick}
            style={{
              width: '100%', textAlign: 'left',
              borderBottom: i < items.length - 1 ? `1px solid ${T.hairline}` : 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              background: 'transparent', cursor: 'pointer',
              padding: '10px 4px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <span style={{ width: 30, height: 30, borderRadius: 9, background: T.surfaceAlt, color: T.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {it.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                {it.label}
                {it.badge}
              </div>
              {it.sub && <div style={{ fontSize: 11, color: it.badge ? '#10B981' : T.textDim, marginTop: 1, fontWeight: it.badge ? 600 : 400 }}>{it.sub}</div>}
            </div>
            <ChevronRight size={14} color={T.textMute} />
          </button>
        ))}
      </div>
      <div style={{ marginTop: 8, padding: '10px 14px', textAlign: 'center', fontSize: 11, color: T.textMute }}>
        Sembako OS · {currentVersionLabel || APP_VERSION_LABEL || APP_VERSION}
      </div>

      <AppUpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentVersion={currentVersion}
        latestRelease={latestRelease}
        isMandatory={isMandatory}
        onDownload={startDownload}
      />
    </Section>
  )
}

// ─── Section 8: Logout ────────────────────────────────────────

export function LogoutBtn({ onLogout }) {
  const { t } = useLanguage()
  return (
    <div style={{ animation: 'fadeIn 300ms ease 0.22s both' }}>
      <button
        onClick={onLogout}
        style={{
          width: '100%', marginTop: 6, marginBottom: 8, padding: '14px',
          background: 'transparent', border: `1px solid ${T.hairlineStrong}`,
          color: T.danger, borderRadius: 14, cursor: 'pointer',
          fontSize: 14, fontWeight: 600, letterSpacing: -0.1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <LogOut size={16} strokeWidth={2} /> {t('logout_btn')}
      </button>
    </div>
  )
}

export function DevUserAccountProvisioningCard({ accent, tenant }) {
  const [openModal, setOpenModal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('admin')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    if (!email || !password || !fullName) {
      return toast.error('Email, Password, dan Nama Wajib diisi!')
    }
    if (password.length < 6) {
      return toast.error('Password minimal 6 karakter!')
    }

    setIsSubmitting(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            tenant_id: tenant?.id,
          }
        }
      })

      if (authError) throw authError

      if (authData?.user) {
        await supabase.from('profiles').insert([{
          auth_user_id: authData.user.id,
          tenant_id: tenant?.id,
          email,
          full_name: fullName,
          role,
        }])
      }

      toast.success(`Akun login (${role.toUpperCase()}) berhasil dibuat!`)
      setEmail('')
      setPassword('')
      setFullName('')
      setOpenModal(false)
    } catch (err) {
      toast.error(err.message || 'Gagal membuat akun login')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Section title="MODE DEVELOPER — KELOLA AKUN" icon={<Shield size={13} />} iconColor="oklch(0.65 0.20 290)" delay={0.14}>
      <div style={{ ...cardStyle(), background: 'linear-gradient(135deg, oklch(0.65 0.20 290 / 0.15), transparent)', border: '1px solid oklch(0.65 0.20 290 / 0.3)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>
          🔐 Pembuat Akses Login (Khusus Role Dev)
        </div>
        <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5, marginBottom: 12 }}>
          Sebagai Developer, Anda adalah satu-satunya role yang berhak menambahkan akun login untuk Admin & Owner.
        </div>
        <button
          onClick={() => setOpenModal(true)}
          style={{
            width: '100%', padding: '11px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'oklch(0.65 0.20 290)', color: '#fff', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 6px 18px oklch(0.65 0.20 290 / 0.4)',
          }}
        >
          + Buat Login Akun Baru (Admin / Owner / Dev)
        </button>

        {openModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: T.surface, border: '1px solid ' + T.hairline, borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: 0 }}>Buat Akun Login Baru</h3>
                <button onClick={() => setOpenModal(false)} style={{ background: 'none', border: 'none', color: T.textMute, cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textDim, display: 'block', marginBottom: 4 }}>NAMA LENGKAP</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Contoh: Budi Santoso" style={{ width: '100%', height: 40, background: T.surfaceAlt, border: '1px solid ' + T.hairline, borderRadius: 8, padding: '0 12px', color: T.text, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textDim, display: 'block', marginBottom: 4 }}>EMAIL LOGIN</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="budi@kasir.com" style={{ width: '100%', height: 40, background: T.surfaceAlt, border: '1px solid ' + T.hairline, borderRadius: 8, padding: '0 12px', color: T.text, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textDim, display: 'block', marginBottom: 4 }}>PASSWORD</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Minimal 6 karakter" style={{ width: '100%', height: 40, background: T.surfaceAlt, border: '1px solid ' + T.hairline, borderRadius: 8, padding: '0 12px', color: T.text, fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textDim, display: 'block', marginBottom: 4 }}>ROLE HAK AKSES</label>
                  <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', height: 40, background: T.surfaceAlt, border: '1px solid ' + T.hairline, borderRadius: 8, padding: '0 12px', color: T.text, fontSize: 13, outline: 'none' }}>
                    <option value="admin">Admin (Kasir - Tanpa Akses Profit)</option>
                    <option value="owner">Owner (Pemilik - Akses Laporan & Profit)</option>
                    <option value="dev">Dev (Developer - Full Akses System)</option>
                  </select>
                </div>
                <button type="submit" disabled={isSubmitting} style={{ width: '100%', height: 42, background: 'oklch(0.65 0.20 290)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
                  {isSubmitting ? 'Memproses...' : 'Simpan Akun Login Baru'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}
