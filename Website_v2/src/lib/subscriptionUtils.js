import { calculateLicenseStatus } from '@/lib/license/licenseStatus'
import { GRACE_DAYS } from '@/lib/license/licenseConstants'

/**
 * Single source of truth untuk status subscription & lisensi tenant.
 * Terintegrasi 100% dengan calculateLicenseStatus dan Admin Pusat (Superadmin Hub).
 *
 * @param {object} tenant — object tenant dari Supabase
 * @returns {{ status, label, daysLeft, expiresAt, licenseActivatedAt, graceExpiresAt, isExpiringSoon, isLocked, isGrace, isWarning, plan }}
 */
export function getSubscriptionStatus(tenant) {
  if (!tenant) {
    return {
      status: 'unknown',
      label: 'Unknown',
      daysLeft: 0,
      expiresAt: null,
      licenseActivatedAt: null,
      graceExpiresAt: null,
      isExpiringSoon: false,
      isLocked: false,
      isGrace: false,
      isWarning: false,
      plan: 'starter',
    }
  }

  // Tanggal aktif awal
  const licenseActivatedAt = tenant.license_activated_at
    ? new Date(tenant.license_activated_at)
    : tenant.created_at
    ? new Date(tenant.created_at)
    : null

  // Hitung kalkulasi lisensi standar pusat
  const lic = calculateLicenseStatus(new Date(), tenant.plan_expires_at)

  const expiresAt = tenant.plan_expires_at ? new Date(tenant.plan_expires_at) : null
  const graceExpiresAt = expiresAt
    ? new Date(expiresAt.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000)
    : null

  let statusKey = 'active'
  let statusLabel = tenant.plan === 'business' ? 'Business' : tenant.plan === 'pro' ? 'Pro' : 'Starter'

  if (lic.status === 'PERMANENT') {
    statusKey = 'active'
    statusLabel = 'Permanen (Unlimited)'
  } else if (lic.isLocked) {
    statusKey = 'expired'
    statusLabel = 'Terkunci'
  } else if (lic.isGrace) {
    statusKey = 'grace'
    statusLabel = 'Masa Tenggang'
  } else if (lic.isWarning) {
    statusKey = 'warning'
    statusLabel = 'Hampir Habis'
  }

  return {
    status: statusKey,
    label: statusLabel,
    daysLeft: lic.status === 'PERMANENT' ? 99999 : lic.daysRemaining,
    expiresAt,
    licenseActivatedAt,
    graceExpiresAt,
    isExpiringSoon: lic.isWarning,
    isGrace: lic.isGrace,
    isLocked: lic.isLocked,
    plan: tenant.plan || 'starter',
    rawLicStatus: lic.status,
  }
}

export function getStatusColor(status) {
  if (status === 'active') {
    return { color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.1)', border: 'rgba(74, 222, 128, 0.25)' }
  }
  if (status === 'warning' || status === 'grace') {
    return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' }
  }
  return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)' }
}

export function getEffectivePlan(tenant) {
  return tenant?.plan || 'starter'
}

export function getExpiryLabel(tenant) {
  const sub = getSubscriptionStatus(tenant)
  if (!sub.expiresAt) return 'Permanen (Unlimited)'

  const dateStr = sub.expiresAt.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  switch (sub.status) {
    case 'active':   return `${sub.label} aktif hingga ${dateStr}`
    case 'warning':  return `Lisensi berakhir ${dateStr} (${sub.daysLeft} hari lagi)`
    case 'grace':    return `Masa tenggang hingga ${sub.graceExpiresAt?.toLocaleDateString('id-ID') || dateStr}`
    case 'expired':  return `Terkunci sejak ${dateStr}`
    default:         return null
  }
}

