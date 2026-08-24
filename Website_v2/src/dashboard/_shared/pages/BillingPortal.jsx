import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, CreditCard, Building2, RefreshCw, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { formatIDR } from '@/lib/format'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale/id'
import { enUS as localeEn } from 'date-fns/locale/en-US'
import { useLanguage } from '@/lib/i18n/useLanguage'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useCancelPendingInvoice } from '@/lib/hooks/useAdminData'
import { toast } from 'sonner'
import { logError } from '@/lib/logger/errorLogger'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

// ─── Constants ────────────────────────────────────────────────────────────────

const BG = '#06090F'
const SURFACE = 'rgba(255,255,255,0.04)'
const HAIRLINE = 'rgba(255,255,255,0.07)'
const TEXT = '#F1F5F9'
const TEXT_DIM = '#CBD5E1'
const TEXT_MUTE = '#94A3B8'

const INVOICE_STATUS = {
  paid:      { label: 'Lunas',    color: '#34D399', bg: 'rgba(52, 211, 153, 0.12)',  icon: <CheckCircle2 size={13} /> },
  pending:   { label: 'Menunggu', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', icon: <Clock size={13} /> },
  expired:   { label: 'Kedaluwarsa', color: '#F87171', bg: 'rgba(248, 113, 113, 0.12)', icon: <XCircle size={13} /> },
  cancelled: { label: 'Dibatalkan',  color: '#F87171', bg: 'rgba(248, 113, 113, 0.12)', icon: <XCircle size={13} /> },
  failed:    { label: 'Gagal',       color: '#F87171', bg: 'rgba(248, 113, 113, 0.12)', icon: <XCircle size={13} /> },
}

// ─── Hook: fetch invoices for a list of tenant IDs ────────────────────────────

function useTenantInvoices(tenantIds) {
  return useQuery({
    queryKey: ['billing-invoices', tenantIds],
    enabled: tenantIds.length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_invoices')
        .select('id, invoice_number, tenant_id, plan, billing_months, amount, status, provider_status, paid_at, created_at')
        .in('tenant_id', tenantIds)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) {
        logSupabaseError(error, { table: 'subscription_invoices', operation: 'select', component: 'BillingPortal', actionName: 'user.invoices.fetch' })
        throw error
      }
      return data || []
    },
  })
}

// ─── Plan status chip ─────────────────────────────────────────────────────────

function PlanChip({ tenant }) {
  const { lang, tPlan, t } = useLanguage()
  const activeLocale = lang === 'en' ? localeEn : localeId
  const sub = getSubscriptionStatus(tenant)
  const colors = {
    active:  { color: '#34D399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.25)' },
    trial:   { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
    pending: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
    expired: { color: '#F87171', bg: 'rgba(248, 113, 113, 0.12)', border: 'rgba(248, 113, 113, 0.25)' },
    failed:  { color: '#F87171', bg: 'rgba(248, 113, 113, 0.12)', border: 'rgba(248, 113, 113, 0.25)' },
    unknown: { color: TEXT_DIM, bg: SURFACE, border: HAIRLINE },
  }
  const c = colors[sub.status] || colors.unknown
  const expiryStr = sub.expiresAt
    ? format(sub.expiresAt, 'd MMM yyyy', { locale: activeLocale })
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800,
        background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      }}>
        {tPlan(sub.label)}
      </span>
      {expiryStr && (
        <span style={{ fontSize: 10, color: TEXT_MUTE }}>
          {sub.status === 'expired' ? t('billing_expired', 'Expired') : t('billing_until', 'hingga')} {expiryStr}
        </span>
      )}
    </div>
  )
}

// ─── Tenant card ──────────────────────────────────────────────────────────────

function TenantCard({ tenant, onUpgrade }) {
  const { t, tVertical } = useLanguage()
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 14,
      background: '#0C1319', border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: 'rgba(52, 211, 153, 0.12)', border: '1px solid rgba(52, 211, 153, 0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Building2 size={17} color="#34D399" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: 0, lineHeight: 1.3 }}>
          {tenant.business_name || t('index_fallback_biz', 'Bisnis Saya')}
        </p>
        <p style={{ fontSize: 11, color: TEXT_DIM, margin: 0, marginTop: 2 }}>
          {tVertical(tenant.business_vertical) || '—'}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <PlanChip tenant={tenant} />
        <button
          onClick={() => onUpgrade(tenant)}
          style={{
            fontSize: 11, fontWeight: 800, color: '#FFFFFF',
            background: 'linear-gradient(135deg, #059669, #047857)',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            padding: '10px 16px', minHeight: 44, display: 'flex',
            alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
          }}
        >
          {t('billing_manage_btn', 'Kelola')}
        </button>
      </div>
    </div>
  )
}

// ─── Desktop Table Component ─────────────────────────────────────────────────

function InvoicesTable({ invoices, tenantMap, isBillingCapable, onCancelClick }) {
  const { tStatus, tPlan, lang } = useLanguage()
  const activeLocale = lang === 'en' ? localeEn : localeId

  return (
    <div style={{
      background: '#0C1319', border: `1px solid ${HAIRLINE}`, borderRadius: 14, overflow: 'hidden'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${HAIRLINE}`, background: 'rgba(255,255,255,0.02)' }}>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bisnis</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tanggal</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jumlah</th>
            <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const s = INVOICE_STATUS[inv.status] || INVOICE_STATUS.pending
            const dateStr = inv.paid_at || inv.created_at
            const date = dateStr ? format(new Date(dateStr), 'd MMM yyyy', { locale: activeLocale }) : '—'
            const tenantName = tenantMap[inv.tenant_id] || '—'
            const statusLabel = tStatus(inv.status)

            return (
              <tr key={inv.id} style={{ borderBottom: `1px solid ${HAIRLINE}`, transition: 'background 0.2s' }}>
                <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: TEXT }}>{inv.invoice_number}</td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: TEXT_DIM }}>{tenantName}</td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: TEXT }}>
                  {tPlan(inv.plan)} <span style={{ fontSize: 11, color: TEXT_DIM }}>({inv.billing_months} bln)</span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: TEXT_DIM }}>{date}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 800, color: TEXT }}>{formatIDR(inv.amount)}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: s.color,
                      background: s.bg, padding: '4px 10px', borderRadius: 999,
                      border: `1px solid ${s.color}25`
                    }}>
                      {statusLabel}
                    </span>
                    {inv.status === 'pending' && isBillingCapable && (
                      <button
                        onClick={() => onCancelClick(inv)}
                        style={{
                          fontSize: 11, color: '#EF4444', background: 'none', border: 'none',
                          textDecoration: 'underline', cursor: 'pointer', padding: 0, fontWeight: 600
                        }}
                      >
                        Batalkan
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Mobile Card Component ───────────────────────────────────────────────────

function InvoiceCard({ invoice, tenantMap, isBillingCapable, onCancelClick }) {
  const { tStatus, tPlan, lang } = useLanguage()
  const activeLocale = lang === 'en' ? localeEn : localeId
  const s = INVOICE_STATUS[invoice.status] || INVOICE_STATUS.pending
  const dateStr = invoice.paid_at || invoice.created_at
  const date = dateStr ? format(new Date(dateStr), 'd MMM yyyy', { locale: activeLocale }) : '—'
  const tenantName = tenantMap[invoice.tenant_id] || '—'
  const statusLabel = tStatus(invoice.status)

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 14,
      background: SURFACE,
      border: `1px solid ${HAIRLINE}`,
      marginBottom: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{invoice.invoice_number}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: s.color,
          background: s.bg, padding: '2px 8px', borderRadius: 999,
        }}>
          {statusLabel}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
        <div>
          <p style={{ fontSize: 11, color: TEXT_DIM, margin: 0 }}>
            {tenantName}
          </p>
          <p style={{ fontSize: 11, color: TEXT, margin: 0, marginTop: 2, fontWeight: 600 }}>
            {tPlan(invoice.plan)} ({invoice.billing_months} bln)
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: TEXT, display: 'block' }}>
            {formatIDR(invoice.amount)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            {invoice.status === 'pending' && isBillingCapable && (
              <button
                onClick={() => onCancelClick(invoice)}
                style={{
                  fontSize: 11, color: '#EF4444', background: 'none', border: 'none',
                  textDecoration: 'underline', cursor: 'pointer', padding: 0, fontWeight: 600
                }}
              >
                Batalkan
              </button>
            )}
            <span style={{ fontSize: 10, color: TEXT_DIM }}>
              {date}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Loading Skeletons ────────────────────────────────────────────────────────

function SummarySkeleton() {
  return (
    <div style={{
      margin: '16px 0', padding: '14px 16px', borderRadius: 14,
      background: SURFACE, border: `1px solid ${HAIRLINE}`,
      display: 'flex', gap: 0,
    }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? `1px solid ${HAIRLINE}` : 'none' }}>
          <div style={{ width: '40%', height: 18, background: 'rgba(255,255,255,0.06)', borderRadius: 4, margin: '0 auto 6px' }} className="animate-pulse" />
          <div style={{ width: '60%', height: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 3, margin: '0 auto' }} className="animate-pulse" />
        </div>
      ))}
    </div>
  )
}

function TenantCardSkeleton() {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 14,
      background: SURFACE, border: `1px solid ${HAIRLINE}`,
      display: 'flex', alignItems: 'center', gap: 12,
    }} className="animate-pulse">
      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '60%', height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 6 }} />
        <div style={{ width: '40%', height: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 3 }} />
      </div>
      <div style={{ width: 80, height: 32, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }} />
    </div>
  )
}

function InvoiceRowSkeleton() {
  return (
    <tr style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ width: 80, height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="animate-pulse" />
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ width: 120, height: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 3 }} className="animate-pulse" />
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ width: 100, height: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 3 }} className="animate-pulse" />
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ width: 70, height: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 3 }} className="animate-pulse" />
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ width: 90, height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} className="animate-pulse" />
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
        <div style={{ width: 60, height: 18, background: 'rgba(255,255,255,0.06)', borderRadius: 999, marginLeft: 'auto' }} className="animate-pulse" />
      </td>
    </tr>
  )
}

function InvoiceCardSkeleton() {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 14,
      background: SURFACE, border: `1px solid ${HAIRLINE}`,
      marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 10
    }} className="animate-pulse">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 80, height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
        <div style={{ width: 60, height: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: '50%', height: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 3, marginBottom: 6 }} />
          <div style={{ width: '70%', height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
        </div>
        <div style={{ width: 80, textAlign: 'right' }}>
          <div style={{ width: 70, height: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginLeft: 'auto', marginBottom: 6 }} />
          <div style={{ width: 50, height: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 3, marginLeft: 'auto' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BillingPortal() {
  const navigate = useNavigate()
  const { profile, profiles, isSuperadmin, refetchProfile } = useAuth()
  const { t } = useLanguage()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [activeTab, setActiveTab] = useState('aktif')

  // Resolve active role using profile.role or profile.app_role as fallback.
  // Backend RPC remains source of truth for authorization.
  const activeRole = (profile?.role || profile?.app_role || '').toLowerCase()
  const isBillingCapable = isSuperadmin || ['owner', 'admin', 'manajer', 'manager'].includes(activeRole)

  const [cancelInvoiceData, setCancelInvoiceData] = useState(null)
  const cancelPendingInvoice = useCancelPendingInvoice()

  const handleCancelClick = (invoice) => {
    setCancelInvoiceData(invoice)
  }

  useEffect(() => {
    const htmlEl = document.documentElement
    const hasDark = htmlEl.classList.contains('dark')
    if (!hasDark) {
      htmlEl.classList.add('dark')
    }
    return () => {
      if (!hasDark) {
        htmlEl.classList.remove('dark')
      }
    }
  }, [])

  // Collect all owned tenants from profiles
  const ownedTenants = profiles
    .filter(p => p.role === 'owner' && p.tenants)
    .map(p => p.tenants)
    .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i) // dedupe

  const tenantIds = ownedTenants.map(t => t.id)
  const tenantMap = Object.fromEntries(ownedTenants.map(t => [t.id, t.business_name || t('index_fallback_biz', 'Bisnis Saya')]))

  const { data: invoices = [], isLoading, refetch } = useTenantInvoices(tenantIds)

  const confirmCancelPendingInvoice = async () => {
    if (!cancelInvoiceData || cancelPendingInvoice.isPending) return
    try {
      const res = await cancelPendingInvoice.mutateAsync({
        invoiceId: cancelInvoiceData.id,
        tenantId: cancelInvoiceData.tenant_id
      })

      if (res?.ok) {
        toast.success('Invoice pending berhasil dibatalkan.')
        refetch()
        if (refetchProfile) refetchProfile()
        setCancelInvoiceData(null)
      } else {
        const errType = res?.error
        let errorMsg = 'Invoice tidak dapat dibatalkan.'
        if (errType === 'UNAUTHORIZED') {
          errorMsg = 'Kamu tidak punya akses untuk membatalkan invoice ini.'
        } else if (errType === 'INVOICE_NOT_FOUND') {
          errorMsg = 'Invoice tidak ditemukan.'
        } else if (errType === 'INVOICE_NOT_PENDING') {
          errorMsg = 'Invoice sudah tidak pending.'
          refetch()
          if (refetchProfile) refetchProfile()
        } else if (errType === 'INVOICE_ALREADY_PAID_OR_PROCESSING') {
          errorMsg = 'Invoice sudah diproses pembayaran, tidak bisa dibatalkan.'
          refetch()
          if (refetchProfile) refetchProfile()
        }
        logError({
          level: 'error',
          source: 'frontend',
          component: 'BillingPortal',
          actionName: 'user.invoice.cancel.failed_response',
          error: new Error(`Cancel pending invoice failed with status: ${errType}`),
          metadata: {
            invoiceId: cancelInvoiceData?.id,
            tenantId: cancelInvoiceData?.tenant_id,
            response: res,
          }
        })
        toast.error(errorMsg)
        setCancelInvoiceData(null)
      }
    } catch (err) {
      logError({
        error: err,
        message: 'Exception in confirmCancelPendingInvoice',
        component: 'BillingPortal',
        actionName: 'user.invoice.cancel.catch',
        metadata: {
          invoiceId: cancelInvoiceData?.id,
          tenantId: cancelInvoiceData?.tenant_id,
        }
      })
      toast.error(err?.message || 'Gagal membatalkan invoice. Hubungi admin.')
      setCancelInvoiceData(null)
    }
  }

  // Separate invoices by status
  const paidInvoices    = invoices.filter(i => i.status === 'paid')
  const pendingInvoices = invoices.filter(i => i.status === 'pending')
  const otherInvoices   = invoices.filter(i => !['paid', 'pending'].includes(i.status))

  const orderedInvoices = [...pendingInvoices, ...paidInvoices, ...otherInvoices]

  const totalSpent = paidInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0)

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Sora, sans-serif' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 0 40px' }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px 20px', borderBottom: `1px solid ${HAIRLINE}`,
            background: BG,
          }}>
            <button style={{ background: 'none', border: 'none', color: TEXT_DIM, padding: 4, display: 'flex' }}>
              <ArrowLeft size={20} />
            </button>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: TEXT }}>{t('billing_portal_title', 'Billing & Langganan')}</h1>
              <p style={{ margin: 0, fontSize: 11, color: TEXT_DIM }}>{t('billing_portal_subtitle', 'Kelola paket dan riwayat pembayaran')}</p>
            </div>
          </div>

          <div style={{ padding: '0 16px' }}>
            <SummarySkeleton />
            <div style={{ display: 'flex', gap: 8, flexDirection: 'column', marginTop: 24 }}>
              <div style={{ width: 120, height: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 3, marginBottom: 8 }} className="animate-pulse" />
              <TenantCardSkeleton />
              <TenantCardSkeleton />
            </div>
            <div style={{ display: 'flex', gap: 8, flexDirection: 'column', marginTop: 28 }}>
              <div style={{ width: 150, height: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 3, marginBottom: 8 }} className="animate-pulse" />
              {isDesktop ? (
                <div style={{ background: '#0C1319', border: `1px solid ${HAIRLINE}`, borderRadius: 14, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <InvoiceRowSkeleton />
                      <InvoiceRowSkeleton />
                    </tbody>
                  </table>
                </div>
              ) : (
                <>
                  <InvoiceCardSkeleton />
                  <InvoiceCardSkeleton />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'Sora, sans-serif' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 0 40px' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px', borderBottom: `1px solid ${HAIRLINE}`,
          position: 'sticky', top: 0, zIndex: 10,
          background: BG,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: TEXT_DIM, cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: TEXT }}>{t('billing_portal_title', 'Billing & Langganan')}</h1>
            <p style={{ margin: 0, fontSize: 11, color: TEXT_DIM }}>{t('billing_portal_subtitle', 'Kelola paket dan riwayat pembayaran')}</p>
          </div>
          <button
            onClick={() => refetch()}
            style={{ background: 'none', border: 'none', color: TEXT_DIM, cursor: 'pointer', padding: 4, display: 'flex' }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div style={{ padding: '0 16px' }}>

          {/* Pending invoice warning — placed high above tabs & summary stats */}
          {pendingInvoices.length > 0 && (
            <div style={{
              margin: '16px 0 12px', padding: '12px 14px', borderRadius: 12,
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <AlertCircle size={14} color="#F59E0B" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#F59E0B', lineHeight: 1.5 }}>
                  <span dangerouslySetInnerHTML={{
                    __html: t('billing_pending_invoices_alert', 'Kamu punya <strong>{count} invoice pending</strong> yang belum dibayar.')
                      .replace('{count}', pendingInvoices.length)
                  }} />{' '}
                  <span
                    onClick={() => navigate('/upgrade')}
                    style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {t('billing_pay_now', 'Bayar sekarang →')}
                  </span>
                </p>
                {isBillingCapable && (
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {pendingInvoices.map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => handleCancelClick(inv)}
                        style={{
                          fontSize: 11, color: '#EF4444', background: 'none', border: 'none',
                          textDecoration: 'underline', cursor: 'pointer', padding: 0, fontWeight: 700
                        }}
                      >
                        Batalkan #{inv.invoice_number}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary strip */}
          {!isSuperadmin && (
            <div style={{
              margin: '16px 0', padding: '14px 16px', borderRadius: 14,
              background: 'linear-gradient(135deg, #0C1319, #111C24)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex', gap: 0,
            }}>
              <div style={{ flex: 1, textAlign: 'center', borderRight: `1px solid ${HAIRLINE}` }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#34D399' }}>{ownedTenants.length}</p>
                <p style={{ margin: 0, fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('billing_business', 'Bisnis')}</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center', borderRight: `1px solid ${HAIRLINE}` }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#F1F5F9' }}>
                  {invoices.length === 0 ? '—' : paidInvoices.length}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('billing_paid_invoices', 'Invoice Lunas')}</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#F1F5F9', marginTop: 3 }}>
                  {invoices.length === 0 ? '—' : formatIDR(totalSpent)}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('billing_total_paid', 'Total Dibayar')}</p>
              </div>
            </div>
          )}

          {/* Tab Selector */}
          <div style={{
            display: 'flex', borderBottom: `1px solid ${HAIRLINE}`,
            marginBottom: 16, background: '#0C1319', borderRadius: 12, padding: 4, gap: 4
          }}>
            <button
              onClick={() => setActiveTab('aktif')}
              style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: 9,
                background: activeTab === 'aktif' ? 'rgba(52, 211, 153, 0.1)' : 'transparent',
                color: activeTab === 'aktif' ? '#34D399' : TEXT_DIM,
                fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              {t('billing_tab_active_plan', 'Paket Aktif')}
            </button>
            <button
              onClick={() => setActiveTab('riwayat')}
              style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: 9,
                background: activeTab === 'riwayat' ? 'rgba(52, 211, 153, 0.1)' : 'transparent',
                color: activeTab === 'riwayat' ? '#34D399' : TEXT_DIM,
                fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              {t('billing_tab_history', 'Riwayat Transaksi')}
              {pendingInvoices.length > 0 && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#F59E0B'
                }} />
              )}
            </button>
          </div>

          {/* Tab 1: Paket Aktif */}
          {activeTab === 'aktif' && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: TEXT_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '16px 0 10px' }}>
                {t('billing_my_businesses', 'Bisnis Saya')}
              </p>
              {ownedTenants.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '40px 20px', color: TEXT_DIM,
                  background: SURFACE, border: `1px solid ${HAIRLINE}`, borderRadius: 14,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
                }}>
                  <Building2 size={32} color={TEXT_DIM} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>
                      {t('billing_no_business', 'Tidak ada bisnis yang ditemukan')}
                    </p>
                    <p style={{ fontSize: 11, color: TEXT_DIM, margin: 0 }}>
                      Silakan buat bisnis baru di dashboard terlebih dahulu.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all"
                  >
                    Kembali ke Dashboard
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ownedTenants.map(t => (
                    <TenantCard
                      key={t.id}
                      tenant={t}
                      onUpgrade={() => navigate('/upgrade')}
                    />
                  ))}
                </div>
              )}

              {/* CTA Upgrade / Perpanjang */}
              <button
                onClick={() => navigate('/upgrade')}
                className="w-full mt-4 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 border-0 cursor-pointer"
              >
                <CreditCard size={15} />
                {t('billing_upgrade_renew_btn', 'Upgrade / Perpanjang Paket')}
              </button>
            </div>
          )}

          {/* Tab 2: Riwayat Transaksi */}
          {activeTab === 'riwayat' && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: TEXT_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '16px 0 10px' }}>
                {t('billing_payment_history', 'Riwayat Pembayaran')}
              </p>

              {orderedInvoices.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '40px 20px', color: TEXT_MUTE,
                  background: SURFACE, border: `1px solid ${HAIRLINE}`, borderRadius: 14,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
                }}>
                  <AlertCircle size={28} color={TEXT_MUTE} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>
                      {t('billing_no_history', 'Belum ada riwayat pembayaran')}
                    </p>
                    <p style={{ fontSize: 11, color: TEXT_DIM, margin: 0 }}>
                      Transaksi yang sukses atau tertunda akan muncul di sini.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {isDesktop ? (
                    <InvoicesTable invoices={orderedInvoices} tenantMap={tenantMap} isBillingCapable={isBillingCapable} onCancelClick={handleCancelClick} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {orderedInvoices.map((inv) => (
                        <InvoiceCard key={inv.id} invoice={inv} tenantMap={tenantMap} isBillingCapable={isBillingCapable} onCancelClick={handleCancelClick} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Cancellation Confirmation Dialog */}
      {cancelInvoiceData && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            width: '100%',
            maxWidth: 440,
            background: '#0C1319',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AlertCircle size={20} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#F1F5F9', margin: 0, fontFamily: 'Sora, sans-serif' }}>
                Batalkan invoice pending?
              </h3>
            </div>
            
            <div style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'Sora, sans-serif' }}>
              <p style={{ margin: 0 }}>
                Invoice ini akan dibatalkan di TernakOS agar kamu bisa membuat invoice baru. Jika kamu masih memiliki link pembayaran Midtrans lama, jangan lanjutkan pembayaran dari link tersebut setelah invoice dibatalkan.
              </p>
              <div style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(245,158,11,0.07)',
                border: '1px solid rgba(245,158,11,0.2)',
                fontSize: 12,
                color: '#F59E0B',
                fontWeight: 600,
              }}>
                Invoice dibatalkan di TernakOS. Jika sudah melakukan pembayaran, jangan batalkan dan hubungi admin.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setCancelInvoiceData(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#CBD5E1',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'Sora, sans-serif',
                }}
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={confirmCancelPendingInvoice}
                disabled={cancelPendingInvoice.isPending}
                style={{
                  flex: 1.5,
                  padding: '12px',
                  background: '#EF4444',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontFamily: 'Sora, sans-serif',
                  boxShadow: '0 6px 18px rgba(239, 68, 68, 0.25)',
                }}
              >
                {cancelPendingInvoice.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  'Batalkan Invoice'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
