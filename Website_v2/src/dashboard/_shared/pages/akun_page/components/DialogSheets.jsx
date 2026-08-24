import React, { useState } from 'react'
import { MapPin, Trash2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { logError } from '@/lib/logger/errorLogger'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/useLanguage'
import { T, INDONESIA_PROVINCES, cardStyle } from '../constants'

// ─── Edit Bisnis Sheet ────────────────────────────────────────

export function EditBisnisSheet({ open, onClose, tenant, onSuccess, accent }) {
  const { t } = useLanguage()
  const [businessName, setBusinessName] = useState(tenant?.business_name || '')
  const [location, setLocation] = useState(tenant?.location || '')
  const inferredProvince = !tenant?.province && tenant?.location && INDONESIA_PROVINCES.includes(tenant.location) ? tenant.location : ''
  const [province, setProvince] = useState(tenant?.province || inferredProvince)
  const [saving, setSaving] = useState(false)

  const originalName = tenant?.business_name || ''
  const originalLocation = tenant?.location || ''
  const originalProvince = tenant?.province || ''
  const isDirty = businessName.trim() !== originalName || location.trim() !== originalLocation || province !== originalProvince
  const isValid = businessName.trim().length > 0
  const canSave = isDirty && isValid && !saving

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    const { error } = await supabase
      .from('tenants')
      .update({
        business_name: businessName.trim(),
        location: location.trim() || null,
        province: province || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenant.id)
    setSaving(false)
    if (error) {
      logSupabaseError(error, {
        table: 'tenants',
        operation: 'update',
        component: 'EditBisnisSheet',
        actionName: 'account.bisnis.update',
      })
      toast.error(t('index_toast_save_failed') + ': ' + (error.message || t('try_again')))
    } else {
      toast.success(t('index_toast_biz_save_success'))
      onSuccess?.()
      onClose()
    }
  }

  if (!open) return null

  const sheetStyle = {
    width: '100%', maxWidth: 480, margin: '0 auto',
    background: T.surface,
    borderRadius: '20px 20px 0 0',
    borderTop: `1px solid ${T.hairlineStrong}`,
    paddingBottom: 'calc(120px + env(safe-area-inset-bottom))',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
    zIndex: 5001,
    maxHeight: '90dvh', overflowY: 'auto',
    animation: 'slideUp 240ms cubic-bezier(0.32,0.72,0,1)',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 5000,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 180ms ease',
      }}
    >
      <div onClick={e => e.stopPropagation()} style={sheetStyle}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.hairlineStrong }} />
        </div>

        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${T.hairline}` }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: -0.3 }}>{t('eb_title')}</div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 3 }}>{t('eb_subtitle')}</div>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Business Name */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              {t('eb_biz_name_label')} <span style={{ color: T.danger }}>*</span>
            </label>
            <input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder={t('eb_biz_name_placeholder')}
              style={{
                width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                background: T.surfaceAlt, border: `1px solid ${businessName.trim() ? accent.base + '55' : T.hairline}`,
                borderRadius: 12, color: T.text, fontSize: 16, outline: 'none',
              }}
            />
          </div>

          {/* Provinsi — dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              {t('eb_province_label')} <span style={{ color: T.warn }}>⚠</span>
              <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>
                {t('eb_province_required')}
              </span>
            </label>
            <select
              value={province}
              onChange={e => setProvince(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                background: T.surfaceAlt, border: `1px solid ${province ? accent.base + '55' : 'oklch(0.78 0.14 70 / 0.5)'}`,
                borderRadius: 12, color: province ? T.text : T.textDim, fontSize: 16, outline: 'none',
                appearance: 'none', WebkitAppearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239BA29B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                paddingRight: 36,
              }}
            >
              <option value="">{t('eb_province_placeholder')}</option>
              {INDONESIA_PROVINCES.map(p => (
                <option key={p} value={p} style={{ background: T.surface, color: T.text }}>{p}</option>
              ))}
            </select>
          </div>

          {/* Lokasi / Kota */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              {t('eb_city_label')} <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{t('eb_city_optional')}</span>
            </label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder={t('eb_city_placeholder')}
              style={{
                width: '100%', padding: '12px 14px', boxSizing: 'border-box',
                background: T.surfaceAlt, border: `1px solid ${T.hairline}`,
                borderRadius: 12, color: T.text, fontSize: 16, outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: '13px',
              background: 'transparent', border: `1px solid ${T.hairlineStrong}`,
              color: T.textDim, borderRadius: 12, cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
          >
            {t('eb_cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: 2, padding: '13px',
              background: canSave ? accent.base : T.hairlineStrong,
              border: 'none', color: canSave ? '#0A0E0C' : T.textMute,
              borderRadius: 12, cursor: canSave ? 'pointer' : 'not-allowed',
              fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 150ms',
            }}
          >
            {saving ? t('eb_saving') : <><MapPin size={14} /> {t('eb_save')}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Profile Sheet ───────────────────────────────────────

export function EditProfileSheet({ open, onClose, profile, user, onSuccess, accent }) {
  const { t } = useLanguage()
  const [name, setName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const originalName = profile?.full_name || ''
  const originalPhone = profile?.phone || ''
  const isNameChanged = name.trim() !== originalName
  const isPhoneChanged = phone.trim() !== originalPhone
  const isPasswordChanged = newPassword.trim().length > 0
  const isDirty = isNameChanged || isPhoneChanged || isPasswordChanged
  const isValid = name.trim().length > 0 && (!isPasswordChanged || newPassword.length >= 6)
  const canSave = isDirty && isValid && !saving

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)

    if (isPasswordChanged) {
      if (newPassword !== confirmPassword) {
        toast.error('Konfirmasi password baru tidak cocok!')
        setSaving(false)
        return
      }
      try {
        const { error: passErr } = await supabase.auth.updateUser({ password: newPassword.trim() })
        if (passErr) {
          toast.error('Gagal ganti password: ' + passErr.message)
          setSaving(false)
          return
        }
      } catch (err) {
        // ignore
      }
    }

    if (isNameChanged || isPhoneChanged) {
      const payload = {
        full_name: name.trim(),
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      }

      let query = supabase.from('profiles').update(payload)

      if (profile?.profile_id) {
        query = query.eq('id', profile.profile_id)
      } else if (profile?.tenant_id && user?.id) {
        query = query.eq('auth_user_id', user.id).eq('tenant_id', profile.tenant_id)
      } else if (user?.id) {
        query = query.eq('auth_user_id', user.id)
      }

      const { error } = await query

      if (error) {
        logSupabaseError(error, {
          table: 'profiles',
          operation: 'update',
          component: 'EditProfileSheet',
          actionName: 'handleSave',
        })
        toast.error(t('index_toast_save_failed') + ': ' + (error.message || t('try_again')))
        setSaving(false)
        return
      }
    }

    setSaving(false)
    toast.success('Nama tampilan / password berhasil diperbarui!')
    onSuccess?.()
    onClose()
  }

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 5000,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 180ms ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: T.surface,
          borderRadius: '20px 20px 0 0',
          borderTop: `1px solid ${T.hairlineStrong}`,
          paddingBottom: 'calc(120px + env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          zIndex: 5001,
          maxHeight: '90dvh', overflowY: 'auto',
          animation: 'slideUp 240ms cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%) }
            to   { transform: translateY(0) }
          }
        `}</style>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.hairlineStrong }} />
        </div>

        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${T.hairline}` }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: -0.3 }}>Edit Profil & Password</div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 3 }}>Ubah nama tampilan atau perbarui password akun kamu</div>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              Nama Tampilan <span style={{ color: T.danger }}>*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              style={{
                width: '100%', padding: '12px 14px',
                background: T.surfaceAlt, border: `1px solid ${name.trim() ? accent.base + '55' : T.hairline}`,
                borderRadius: 12, color: T.text, fontSize: 15, outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 150ms',
              }}
            />
            {name.trim().length === 0 && (
              <div style={{ fontSize: 11, color: T.danger, marginTop: 5 }}>Nama tidak boleh kosong</div>
            )}
          </div>

          {/* New Password */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              Password Baru <span style={{ fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opsional — min. 6 karakter)</span>
            </label>
            <input
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              style={{
                width: '100%', padding: '12px 14px',
                background: T.surfaceAlt, border: `1px solid ${T.hairline}`,
                borderRadius: 12, color: T.text, fontSize: 15, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Confirm Password */}
          {newPassword.trim().length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
                Konfirmasi Password Baru <span style={{ color: T.danger }}>*</span>
              </label>
              <input
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                type="password"
                style={{
                  width: '100%', padding: '12px 14px',
                  background: T.surfaceAlt, border: `1px solid ${confirmPassword === newPassword ? accent.base + '55' : T.danger}`,
                  borderRadius: 12, color: T.text, fontSize: 15, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <div style={{ fontSize: 11, color: T.danger, marginTop: 5 }}>Konfirmasi password tidak cocok</div>
              )}
            </div>
          )}

          {/* Email — readonly */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              Email Akun
            </label>
            <div style={{
              padding: '12px 14px',
              background: T.surfaceAlt + '88', border: `1px solid ${T.hairline}`,
              borderRadius: 12, color: T.textDim, fontSize: 15,
              display: 'flex', items: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email || '—'}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: T.textMute, flexShrink: 0, letterSpacing: 0.3, textTransform: 'uppercase' }}>Read-only</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: '13px',
              background: 'transparent', border: `1px solid ${T.hairlineStrong}`,
              color: T.textDim, borderRadius: 12, cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
          >
            {t('ep_cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: 2, padding: '13px',
              background: canSave ? accent.base : T.surfaceAlt,
              border: 'none', borderRadius: 12,
              cursor: canSave ? 'pointer' : 'default',
              color: canSave ? '#0A0E0C' : T.textMute,
              fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 150ms, color 150ms',
              boxShadow: canSave ? `0 6px 18px ${accent.base}55` : 'none',
            }}
          >
            {saving ? (
              <>
                <span style={{ width: 14, height: 14, borderRadius: 999, border: `2px solid currentColor`, borderTopColor: 'transparent', animation: 'spin 600ms linear infinite', display: 'inline-block' }} />
                {t('ep_saving')}
              </>
            ) : t('ep_save')}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ─── Delete Business Dialog ───────────────────────────────────

export function DeleteBusinessDialog({ tenant, profiles, onClose, onDeleted }) {
  const { t } = useLanguage()
  const tenantName = tenant?.business_name || 'Bisnis Aktif'
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const isLastBusiness = profiles.filter(p => p.tenant_id !== tenant?.id).length === 0
  const nameMatches = confirmText.trim().toLowerCase() === tenantName.toLowerCase()

  const handleDelete = async () => {
    if (!nameMatches || deleting) return
    setDeleting(true)
    const { error } = await supabase.rpc('delete_my_business', { p_tenant_id: tenant.id })
    setDeleting(false)
    if (error) {
      logSupabaseError(error, {
        table: 'rpc:delete_my_business',
        operation: 'rpc',
        component: 'DeleteBusinessDialog',
        actionName: 'account.business.delete',
      })
      logError({
        level: 'error',
        source: 'supabase',
        component: 'DeleteBusinessDialog',
        actionName: 'account.business.delete',
        error,
        metadata: { tenant_id: tenant?.id },
      })
      if (error.message?.includes('ACCESS_DENIED')) {
        toast.error(t('dd_error_access_denied'))
      } else {
        toast.error(t('dd_error_failed') + ': ' + (error.message || t('try_again')))
      }
      return
    }
    toast.success(tenantName + ' ' + t('index_toast_delete_success'))
    onDeleted()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 5000,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 180ms ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: T.surface,
          borderRadius: '20px 20px 0 0',
          borderTop: `2px solid ${T.danger}55`,
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
          boxShadow: `0 -8px 40px rgba(0,0,0,0.6), 0 -2px 0 ${T.danger}33`,
          animation: 'slideUp 240ms cubic-bezier(0.32,0.72,0,1)',
          maxHeight: '90dvh', overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.hairlineStrong }} />
        </div>

        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${T.hairline}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: `${T.danger}18`, color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trash2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: -0.3 }}>{t('dd_title')}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{t('dd_subtitle')}</div>
          </div>
        </div>

        <div style={{ padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Warning box */}
          <div style={{
            padding: '14px', borderRadius: 12,
            background: `${T.danger}10`, border: `1px solid ${T.danger}30`,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <AlertTriangle size={16} color={T.danger} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.6 }}>
              {t('dd_warning_pre')} <strong style={{ color: T.text }}>{tenantName}</strong> {t('dd_warning_mid')}
              {isLastBusiness && (
                <><br /><br /><span style={{ color: T.warn }}>{t('dd_last_biz_warning')}</span></>
              )}
            </div>
          </div>

          {/* Confirm input */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
              {t('dd_confirm_label')}
            </label>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.danger, background: `${T.danger}12`, border: `1px solid ${T.danger}30`, borderRadius: 8, padding: '6px 12px', marginBottom: 8, letterSpacing: 0.2 }}>
              {tenantName}
            </div>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={t('dd_confirm_placeholder_prefix', 'Ketik:') + ' ' + tenantName}
              autoComplete="off"
              style={{
                width: '100%', padding: '12px 14px',
                background: T.surfaceAlt,
                border: `1px solid ${nameMatches ? T.danger + '88' : T.hairline}`,
                borderRadius: 12, color: T.text, fontSize: 15, outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 150ms',
              }}
            />
            {confirmText.length > 0 && !nameMatches && (
              <div style={{ fontSize: 11, color: T.textDim, marginTop: 5 }}>{t('dd_name_mismatch')}</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '8px 20px 0', display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={deleting}
            style={{
              flex: 1, padding: '13px',
              background: 'transparent', border: `1px solid ${T.hairlineStrong}`,
              color: T.textDim, borderRadius: 12, cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
            }}
          >
            {t('dd_cancel')}
          </button>
          <button
            onClick={handleDelete}
            disabled={!nameMatches || deleting}
            style={{
              flex: 2, padding: '13px',
              background: nameMatches && !deleting ? T.danger : T.surfaceAlt,
              border: 'none', borderRadius: 12,
              cursor: nameMatches && !deleting ? 'pointer' : 'default',
              color: nameMatches && !deleting ? '#fff' : T.textMute,
              fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 150ms, color 150ms',
              boxShadow: nameMatches && !deleting ? `0 6px 18px ${T.danger}44` : 'none',
            }}
          >
            {deleting ? (
              <>
                <span style={{ width: 14, height: 14, borderRadius: 999, border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'spin 600ms linear infinite', display: 'inline-block' }} />
                {t('dd_deleting')}
              </>
            ) : (
              <><Trash2 size={14} /> {t('dd_delete_btn')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Danger Zone Sheet ────────────────────────────────────────

export function DangerZoneSheet({ open, onClose, tenantName, onDelete }) {
  const { t } = useLanguage()
  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 5000,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 180ms ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, margin: '0 auto',
          background: T.surface,
          borderRadius: '20px 20px 0 0',
          borderTop: `2px solid ${T.danger}55`,
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          zIndex: 5001,
          maxHeight: '90dvh', overflowY: 'auto',
          animation: 'slideUp 240ms cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: T.hairlineStrong }} />
        </div>

        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${T.hairline}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: `${T.danger}18`, color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: -0.3 }}>{t('dz_title')}</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{t('dz_subtitle')}</div>
          </div>
        </div>

        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            ...cardStyle(),
            border: `1px solid ${T.danger}33`,
            background: `${T.danger}08`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: `1px solid ${T.hairline}` }}>
              <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: `${T.danger}18`, color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                <Trash2 size={15} />
              </span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 3 }}>{t('dz_delete_title')}</div>
                <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5 }}>
                  {t('dz_delete_desc_pre')} <strong style={{ color: T.text }}>{tenantName}</strong> {t('dz_delete_desc_post')}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onDelete()
                onClose()
              }}
              style={{
                marginTop: 12, width: '100%', padding: '11px',
                background: T.danger, border: 'none',
                color: '#fff', borderRadius: 10, cursor: 'pointer',
                fontSize: 13, fontWeight: 700, letterSpacing: -0.1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: `0 4px 14px ${T.danger}40`,
              }}
            >
              <Trash2 size={14} strokeWidth={2.5} /> {t('dz_delete_btn')}
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '12px',
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.hairline}`,
              color: T.text, borderRadius: 10, cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
            }}
          >
            {t('dz_cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
