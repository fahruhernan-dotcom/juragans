import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/useAuth'
import { resolveBusinessVertical, getXBasePath } from '@/lib/businessModel'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/useLanguage'

import {
  T,
  VERTICAL_ACCENTS,
  ROLE_LABELS,
  BILLING_ROLES,
  PLAN_INFO,
  getUserRole,
  normalizeVertical
} from './constants'

import {
  ProfileHero,
  QuickActions,
  ActiveBusinessCard,
  HelpAboutCard,
  LogoutBtn,
  getEditBizPath
} from './components/AccountCards'
import { NotificationPreferencesCard } from './components/NotificationPreferencesCard'
import { isDevUser } from '@/lib/auth/business-roles'

import {
  EditProfileSheet,
  EditBisnisSheet,
  DeleteBusinessDialog,
  DangerZoneSheet
} from './components/DialogSheets'

export default function AkunPage() {
  const { user, profile, tenant, ownerTenant, profiles, isSuperadmin, refetchProfile, logout } = useAuth()
  const navigate = useNavigate()
  const { state: routerState } = useLocation()
  const { t, tRole, tVertical } = useLanguage()

  const activeTenant = tenant
  const billingTenant = ownerTenant || tenant

  const rawVertical = resolveBusinessVertical(profile, activeTenant)
  const verticalKey = normalizeVertical(rawVertical)
  const basePath = getXBasePath(activeTenant, profile) || ''
  const editBizPath = getEditBizPath(rawVertical, basePath)

  const originalAccent = VERTICAL_ACCENTS[verticalKey] || VERTICAL_ACCENTS.peternak
  const accent = { ...originalAccent, name: tVertical(verticalKey) }

  const role = isSuperadmin ? 'superadmin' : getUserRole(profile)
  const originalRoleBadge = ROLE_LABELS[role] || ROLE_LABELS.view_only
  const roleBadge = { ...originalRoleBadge, label: tRole(role) }
  const showBilling = BILLING_ROLES.includes(role)

  const isMultiTenant = (profiles?.length ?? 0) > 1
  const planKey = billingTenant?.plan || 'none'
  const plan = PLAN_INFO[planKey] ? planKey : 'none'

  const displayName = profile?.full_name || user?.email?.split('@')[0] || t('index_fallback_user', 'Pengguna')
  const email = user?.email || t('index_fallback_email', 'Belum tersedia')
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const tenantName = activeTenant?.business_name || activeTenant?.name || t('index_fallback_biz', 'Bisnis Aktif')
  const tenantCity = activeTenant?.city || activeTenant?.location || '—'

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout()
      } else {
        localStorage.removeItem('sembako_active_role')
        localStorage.removeItem('ternakos_active_tenant_id')
        await supabase.auth.signOut({ scope: 'local' })
      }
      toast.success('Berhasil keluar')
    } catch (err) {
      // ignore
    } finally {
      navigate('/login', { replace: true })
    }
  }

  const canDeleteBusiness = role === 'owner' && !!activeTenant?.id
  const canEditBisnis = role === 'owner' && !!activeTenant?.id

  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [editBisnisOpen, setEditBisnisOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false)

  useEffect(() => {
    if (routerState?.openEditBisnis && canEditBisnis) {
      setEditBisnisOpen(true)
      navigate('.', { replace: true, state: {} })
    }
  }, [routerState?.openEditBisnis, canEditBisnis])

  const handleUpgrade = () => navigate('/upgrade')

  return (
    <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: 120 }}>
      <style>{`
        @keyframes pulse2 { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <ProfileHero
        accent={accent} roleBadge={roleBadge}
        displayName={displayName} email={email} initials={initials}
        tenantName={tenantName}
      />

      <div style={{ padding: '0 20px' }}>

        <QuickActions
          accent={accent} plan={plan} showBilling={showBilling}
          isMultiTenant={isMultiTenant}
          onSwitch={() => isMultiTenant && toast.info(t('index_toast_switch_biz_info'))}
          onUpgrade={handleUpgrade}
          onManage={() => navigate('/billing')}
          onHelp={() => navigate('/hubungi-kami')}
          onEditProfile={() => setEditProfileOpen(true)}
        />

        <ActiveBusinessCard
          accent={accent} roleBadge={roleBadge}
          tenantName={tenantName} tenantCity={tenantCity}
          tenantProvince={activeTenant?.province || null}
          canEditBisnis={canEditBisnis}
          onEditBiz={canEditBisnis ? () => setEditBisnisOpen(true) : (editBizPath ? () => navigate(editBizPath) : null)}
        />

        <NotificationPreferencesCard
          tenantId={activeTenant?.id}
          userId={user?.id}
          accent={accent}
        />

        {isDevUser(profile) && (
          <div style={{ marginBottom: 18 }}>
            <button
              onClick={() => navigate(`${basePath}/kelola-akun`)}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 14,
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                color: '#7C3AED', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 18 }}>🔑</span>
              <div>
                <div>Kelola Akun Login (Dev Mode)</div>
                <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.8, marginTop: 2 }}>Buat & atur akun Admin / Owner / Dev</div>
              </div>
            </button>
          </div>
        )}

        <HelpAboutCard navigate={navigate} canDeleteBusiness={canDeleteBusiness} onDeleteClick={() => setDangerZoneOpen(true)} />

        <LogoutBtn onLogout={handleLogout} />
      </div>

      <EditProfileSheet
        key={editProfileOpen ? 'profile-open' : 'profile-closed'}
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        profile={profile} user={user}
        onSuccess={refetchProfile} accent={accent}
      />

      <EditBisnisSheet
        key={editBisnisOpen ? 'bisnis-open' : 'bisnis-closed'}
        open={editBisnisOpen}
        onClose={() => setEditBisnisOpen(false)}
        tenant={activeTenant}
        onSuccess={refetchProfile} accent={accent}
      />

      {deleteDialogOpen && (
        <DeleteBusinessDialog
          tenant={activeTenant} profiles={profiles}
          onClose={() => setDeleteDialogOpen(false)}
          onDeleted={() => {
            setDeleteDialogOpen(false)
            try { localStorage.removeItem('ternakos_active_tenant_id') } catch { /* ok */ }
            refetchProfile()
            setTimeout(() => {
              const remaining = profiles.filter(p => p.tenant_id !== activeTenant?.id)
              navigate(remaining.length > 0 ? '/' : '/welcome', { replace: true })
            }, 300)
          }}
        />
      )}

      <DangerZoneSheet
        open={dangerZoneOpen}
        onClose={() => setDangerZoneOpen(false)}
        tenantName={tenantName}
        onDelete={() => setDeleteDialogOpen(true)}
      />
    </div>
  )
}
