import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { calculateLicenseStatus } from '@/lib/license/licenseStatus'
import { addMonthlyLicense, addYearlyLicense, setPermanent, setFromToday } from '@/lib/license/licenseUtils'
import { formatLicenseDate, getGraceDate } from '@/lib/license/licenseActions'
import { DEVELOPER_WA, GRACE_DAYS } from '@/lib/license/licenseConstants'
import { toast } from 'sonner'

export function useLicense() {
  const { tenant, profile, refetchProfile } = useAuth()
  const tenantId = tenant?.id

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [licenseExpiresAt, setLicenseExpiresAt] = useState(null)
  const [licenseActivatedAt, setLicenseActivatedAt] = useState(null)
  const [history, setHistory] = useState([])
  const [customDateInput, setCustomDateInput] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [pendingExpiry, setPendingExpiry] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // ── Computed Status ────────────────────────────────────────────────────
  const statusInfo = useMemo(
    () => calculateLicenseStatus(new Date(), licenseExpiresAt),
    [licenseExpiresAt]
  )

  const graceDaysLeft = useMemo(() => {
    if (!statusInfo.isGrace) return 0
    return GRACE_DAYS + statusInfo.daysRemaining + 1
  }, [statusInfo])

  // ── Data Fetching ──────────────────────────────────────────────────────
  const fetchLicense = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('plan_expires_at, license_activated_at, created_at')
        .eq('id', tenantId)
        .maybeSingle()
      if (!error && data) {
        setLicenseExpiresAt(data.plan_expires_at)
        setLicenseActivatedAt(data.license_activated_at || data.created_at)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [tenantId])

  const fetchHistory = useCallback(async () => {
    if (!tenantId) return
    setHistoryLoading(true)
    try {
      const { data, error } = await supabase
        .from('sembako_audit_logs')
        .select('id, user_name, role, action_type, notes, created_at')
        .eq('tenant_id', tenantId)
        .eq('action_type', 'license_update')
        .order('created_at', { ascending: false })
        .limit(20)
      if (!error && data) {
        const mapped = data.map(d => ({
          ...d,
          user_role: d.role,
          timestamp: d.created_at
        }))
        setHistory(mapped)
      }
    } catch { /* ignore */ }
    finally { setHistoryLoading(false) }
  }, [tenantId])

  useEffect(() => {
    fetchLicense()
    fetchHistory()
  }, [fetchLicense, fetchHistory])

  // ── Update Actions ─────────────────────────────────────────────────────
  const prepareLicenseUpdate = useCallback((actionType) => {
    const today = new Date()
    let targetDate = null

    if (actionType === 'monthly') {
      targetDate = addMonthlyLicense(licenseExpiresAt, today)
    } else if (actionType === 'yearly') {
      targetDate = addYearlyLicense(licenseExpiresAt, today)
    } else if (actionType === 'permanent') {
      targetDate = setPermanent()
    } else if (actionType === 'reset_999') {
      targetDate = setFromToday(999)
    } else if (actionType === 'reset_365') {
      // null = baseDate dari hari ini → addYearlyLicense snap ke tgl 28
      targetDate = addYearlyLicense(null, today)
    } else if (actionType === 'reset_30') {
      // null = baseDate dari hari ini → addMonthlyLicense snap ke tgl 28
      targetDate = addMonthlyLicense(null, today)
    } else if (actionType === 'custom') {
      if (!customDateInput) {
        toast.error('Pilih tanggal kustom terlebih dahulu!')
        return
      }
      targetDate = new Date(customDateInput)
      targetDate.setHours(23, 59, 59, 999)
    }

    setPendingAction(actionType)
    setPendingExpiry(targetDate)
    setShowConfirm(true)
  }, [licenseExpiresAt, customDateInput])

  const executeLicenseUpdate = useCallback(async () => {
    if (!tenantId) { toast.error('ID bisnis tidak ditemukan'); return }

    setUpdating(true)
    setShowConfirm(false)
    const toastId = toast.loading('Memperbarui lisensi server...')

    try {
      const newExpiry = pendingExpiry ? pendingExpiry.toISOString() : null
      const newActivatedAt = new Date().toISOString()

      const { error: tenantErr } = await supabase
        .from('tenants')
        .update({ plan_expires_at: newExpiry, license_activated_at: newActivatedAt })
        .eq('id', tenantId)

      if (tenantErr) throw tenantErr

      const actionLabels = {
        monthly: 'Perpanjang 1 Bulan',
        yearly: 'Perpanjang 1 Tahun',
        permanent: 'Lisensi Permanen',
        reset_999: 'Reset ke 999 Hari (Dev)',
        reset_365: 'Reset ke 365 Hari',
        reset_30: 'Reset ke 30 Hari',
        custom: `Set Kustom → ${formatLicenseDate(newExpiry)}`
      }

      await supabase.from('sembako_audit_logs').insert({
        tenant_id: tenantId,
        created_at: new Date().toISOString(),
        user_name: profile?.full_name || profile?.name || 'Developer',
        role: profile?.role || 'dev',
        action_type: 'license_update',
        notes: actionLabels[pendingAction] || 'Perbarui Lisensi'
      })

      setLicenseExpiresAt(newExpiry)
      setLicenseActivatedAt(newActivatedAt)
      if (refetchProfile) refetchProfile()
      toast.success('Lisensi server berhasil diperbarui!', { id: toastId })
      fetchHistory()
    } catch (e) {
      toast.error('Gagal memperbarui lisensi: ' + e.message, { id: toastId })
    } finally {
      setUpdating(false)
      setPendingAction(null)
      setPendingExpiry(null)
    }
  }, [tenantId, pendingExpiry, pendingAction, profile, fetchHistory])

  // ── WhatsApp Contact ───────────────────────────────────────────────────
  const contactDeveloper = useCallback(() => {
    const biz = tenant?.business_name || tenant?.name || 'Toko Sembako'
    const msg = encodeURIComponent(
      `Halo, lisensi server Sembako OS kami memerlukan perpanjangan untuk bisnis: ${biz}`
    )
    window.open(`https://wa.me/${DEVELOPER_WA}?text=${msg}`, '_blank')
  }, [tenant])

  return {
    loading,
    updating,
    historyLoading,
    licenseExpiresAt,
    licenseActivatedAt,
    statusInfo,
    graceDaysLeft,
    history,
    customDateInput,
    setCustomDateInput,
    pendingAction,
    pendingExpiry,
    showConfirm,
    setShowConfirm,
    prepareLicenseUpdate,
    executeLicenseUpdate,
    contactDeveloper,
    fetchHistory,
    formatLicenseDate,
    getGraceDate
  }
}
