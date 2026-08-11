import React, { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Lock, ArrowLeft, Building2, MapPin, ChevronDown, X, Key, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react'
import { useNavigate as useNav } from 'react-router-dom'
import { useLanguage } from '@/lib/i18n/useLanguage'
import { supabase } from '@/lib/supabase'
import { BUSINESS_MODELS, BUSINESS_CATEGORIES, ANIMAL_GROUPS, resolveBusinessVertical } from '@/lib/businessModel'
import { toTitleCase } from '@/lib/format'
import { PROVINCES } from '@/lib/constants/regions'
import { checkQuotaUsage } from '@/lib/quotaUtils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import StepSetup, { VERTICAL_SETUP_CONFIG } from './onboarding/StepSetup'
import { isSuperadmin } from '@/lib/auth'
import { logError } from '@/lib/logger/errorLogger'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'

// Verticals that need a dedicated setup step after business name.
// Driven by StepSetup's VERTICAL_SETUP_CONFIG — single source of truth.
// Note: Kandang/Initial batch setup has been moved out of the required onboarding flow to reduce initial friction.
const SETUP_REQUIRED_VERTICALS = new Set()

// Step labels for progress bar — peternak (5 steps max) and non-peternak (3 steps)
const STEP_LABELS_PETERNAK       = ['Kategori', 'Hewan', 'Spesialisasi', 'Nama Farm', 'Setup Awal']
const STEP_LABELS_PETERNAK_SHORT = ['Kategori', 'Hewan', 'Spesialisasi', 'Nama Farm']
const STEP_LABELS_BROKER         = ['Kategori', 'Spesialisasi', 'Nama Bisnis']

export default function BusinessModelOverlay({ user, profile, isNewBusiness, onComplete }) {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState(null)
  const [animalGroup, setAnimalGroup] = useState(null)
  const [selected, setSelected] = useState(null)
  const [businessName, setBusinessName] = useState('')
  const [nameChecking, setNameChecking] = useState(false)
  const [nameTaken, setNameTaken] = useState(false)
  const [province, setProvince] = useState('')
  const [provinceSearch, setProvinceSearch] = useState('')
  const [provinceOpen, setProvinceOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()
  const [isSuccess, setIsSuccess] = useState(false) // success animation gate
  const [setupData, setSetupData] = useState({
    batch_name: '',
    start_date: new Date().toISOString().split('T')[0],
    initial_count: '',
    initial_avg_weight: '',
    purchase_price_per_kg: '',
  })
  const debounceRef = useRef(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const [createdTenantId, setCreatedTenantId] = useState(null)
  const isSubmittingRef = useRef(false)
  const nav = useNav()

  // Verticals that need extra setup step
  const needsSetupStep = SETUP_REQUIRED_VERTICALS.has(selected)

  // Dynamic step count:
  // Peternak: Category(1) → Animal Group(2) → Sub-role(3) → Name(4) [→ Setup(5) if sapi]
  // Others: Category(1) → Sub-role(2) → Name(3)
  const isPeternak = category === 'peternak'
  const isAnimalStep = isPeternak && step === 2
  const isSubRoleStep = isPeternak ? step === 3 : step === 2
  const isNameStep = isPeternak ? step === 4 : step === 3
  const isSetupStep = needsSetupStep && step === 5

  // Memoize sub-roles based on category + animal group
  const subRoles = useMemo(() => {
    if (!category) return []
    if (isPeternak && animalGroup) {
      const group = ANIMAL_GROUPS.find(g => g.key === animalGroup)
      if (group) return Object.values(BUSINESS_MODELS).filter(m => m.category === 'peternak' && group.filter(m))
    }
    return Object.values(BUSINESS_MODELS).filter(m => m.category === category)
  }, [category, animalGroup, isPeternak])

  // Role Locking Logic
  //   - Superadmin: never locked.
  //   - Add-new-business mode (?mode=new_business): NOT locked — user explicitly
  //     wants a fresh tenant + profile via create_new_business RPC.
  //   - Regular onboarding with business_model_selected=true: LOCKED — user
  //     has already committed a category; DB trigger forbids changing user_type.
  //   - Regular onboarding with business_model_selected=false (default broker
  //     from registration, never explicitly chosen): NOT locked. If they pick
  //     a different user_type, saveAndComplete routes through create_new_business
  //     RPC (userTypeMismatch branch) to sidestep the trigger.
  const isRoleLocked = useMemo(() => {
    if (isSuperadmin(profile)) return false
    // When adding a new business, restrict to the same category as the user's existing role.
    // A peternak can only create new peternak businesses; a broker can only create broker businesses.
    if (isNewBusiness && profile?.user_type) return true
    return !isNewBusiness && profile?.business_model_selected === true
  }, [isNewBusiness, profile])

  const primaryRoleInfo = useMemo(() => {
    if (!isRoleLocked || !profile) return null
    
    // Use the explicit user_type if it's a valid business category
    const userType = profile.user_type
    const validCategory = BUSINESS_CATEGORIES.find(c => c.key === userType)
    
    if (validCategory) {
      return {
        category: userType,
        label: validCategory.label || 'Bisnis'
      }
    }

    const verticalKey = resolveBusinessVertical(profile, profile.tenants)
    const model = BUSINESS_MODELS[verticalKey]
    return {
       category: model?.category || 'broker',
       label: model?.categoryLabel || 'Bisnis'
    }
  }, [profile, isRoleLocked])

  // Lookups for step labels
  const stepLabelMap = {
    'Kategori': t('onboarding_step_category', 'Kategori'),
    'Hewan': t('onboarding_step_animal', 'Hewan'),
    'Spesialisasi': t('onboarding_step_specialization', 'Spesialisasi'),
    'Nama Farm': t('onboarding_step_farm_name', 'Nama Farm'),
    'Nama Bisnis': t('onboarding_step_business_name', 'Nama Bisnis'),
    'Setup Awal': t('onboarding_step_initial_setup', 'Setup Awal')
  }

  // Auto-skip step 1 ONLY if role is locked
  useEffect(() => {
    if (isRoleLocked && primaryRoleInfo && step === 1) {
      setCategory(primaryRoleInfo.category)
      setStep(2)
    }
  }, [isRoleLocked, primaryRoleInfo, step])

  // Memoize provinces
  const filteredProvinces = useMemo(() => {
    if (!provinceSearch) return PROVINCES
    return PROVINCES.filter(p => 
      p.toLowerCase().includes(provinceSearch.toLowerCase())
    )
  }, [provinceSearch])

  // Allow rendering even without profile (for brand new users)
  // But if session is already onboarded and NOT in new business mode, hide it (Safety)
  if (profile?.onboarded && !isNewBusiness) return null

  // Reset name check state when name changes
  const handleNameChange = (val) => {
    setBusinessName(val)
    setNameTaken(false)
    setNameChecking(val.trim().length >= 3)

    // Debounce uniqueness check: 600ms after user stops typing
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 3) { setNameChecking(false); return }

    debounceRef.current = setTimeout(async () => {
      const formatted = toTitleCase(val.trim())
      let query = supabase
        .from('tenants')
        .select('id')
        .ilike('business_name', formatted)
      
      if (profile?.tenant_id && profile.tenant_id !== 'undefined') {
        query = query.neq('id', profile.tenant_id)
      }

      const { data } = await query.limit(1)
      setNameChecking(false)
      setNameTaken(data && data.length > 0)
    }, 600)
  }

  // Called when user clicks "Mulai Sekarang" on name step
  const handleNameConfirm = async () => {
    if (!selected || !businessName.trim() || businessName.trim().length < 3) return
    if (nameTaken || nameChecking) return
    if (!province) return
    const model = BUSINESS_MODELS[selected]
    if (!model) return

    const formattedName = toTitleCase(businessName.trim())

    // Final server-side uniqueness check before saving
    let uniqueQuery = supabase
      .from('tenants')
      .select('id')
      .ilike('business_name', formattedName)
    
    if (profile?.tenant_id && profile.tenant_id !== 'undefined') {
      uniqueQuery = uniqueQuery.neq('id', profile.tenant_id)
    }

    const { data: existing } = await uniqueQuery.limit(1)
    
    if (existing && existing.length > 0) {
      setNameTaken(true)
      return
    }

    // If this vertical needs a setup step, go there instead of finishing
    if (needsSetupStep) {
      setStep(5)
      return
    }

    await saveAndComplete()
  }

  const saveAndComplete = async () => {
    const model = BUSINESS_MODELS[selected]
    if (!model) {
      console.error('[Onboarding] saveAndComplete: model not found for selected key:', selected)
      return
    }
    const formattedName = toTitleCase(businessName.trim())

    // --- VALIDATION: Guard against undefined/invalid user_type ---
    if (!model.user_type) {
      console.error('[Onboarding] model.user_type is missing for model:', model.key, model)
      toast.error(t('onboarding_error_invalid_config', 'Konfigurasi bisnis tidak valid. Silakan coba lagi.'))
      return
    }

    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setLoading(true)

    let resolvedTenantId = null
    let isFirstTimeOnboarding = false
    let userTypeMismatch = false
    let targetAuthId = user?.id || profile?.auth_user_id

    try {
      const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

      if (!targetAuthId || targetAuthId === 'undefined' || !isUUID(targetAuthId)) {
        console.error('[Onboarding] targetAuthId is missing or invalid. profile:', profile, 'user:', user)
        throw new Error('User session missing or invalid auth ID')
      }

      // Check loaded user businesses/memberships to prevent duplicate tenant creation
      let existingMatchedTenantId = null
      if (!isNewBusiness) {
        const { data: existingProfiles, error: fetchError } = await supabase
          .from('profiles')
          .select('tenant_id, tenants(id, business_vertical, sub_type, is_active)')
          .eq('auth_user_id', targetAuthId)

        if (fetchError) {
          console.warn('[Onboarding] Failed to fetch existing user profiles:', fetchError.message)
        }

        if (existingProfiles && existingProfiles.length > 0) {
          const match = existingProfiles.find(p => 
            p.tenants?.is_active && 
            (p.tenants?.business_vertical === model.key || p.tenants?.sub_type === model.sub_type)
          )
          if (match) {
            existingMatchedTenantId = match.tenant_id
            console.log('[Onboarding] Found existing active business with same vertical/sub_type. Reusing tenant:', existingMatchedTenantId)
          }
        }
      }

      resolvedTenantId = createdTenantId || existingMatchedTenantId || (profile?.tenant_id === 'undefined' ? null : profile?.tenant_id)

      // New user onboarding check
      isFirstTimeOnboarding = !profile?.onboarded || !profile?.business_model_selected

      // When picking a vertical with different user_type than existing profile,
      // we normally route through create_new_business RPC instead of trying to UPDATE the existing profile.
      userTypeMismatch = Boolean(
        profile?.user_type &&
        model.user_type &&
        profile.user_type !== model.user_type
      )

      // If they have a resolvedTenantId but it's their first time and NOT an explicit new business,
      // we can reuse the existing placeholder tenant.
      const canReuseExistingTenant = isFirstTimeOnboarding && resolvedTenantId && !isNewBusiness && !userTypeMismatch

      // Only create via RPC if we CANNOT reuse the existing tenant, and we haven't already created one in this flow
      let shouldCreateViRPC = false
      if (canReuseExistingTenant) {
        shouldCreateViRPC = false
      } else if ((isNewBusiness || !resolvedTenantId || userTypeMismatch) && !createdTenantId) {
        shouldCreateViRPC = true
      }

      console.log('[Onboarding] saveAndComplete start:', {
        selectedKey: selected,
        modelKey: model.key,
        user_type: model.user_type,
        isNewBusiness,
        isFirstTimeOnboarding,
        canReuseExistingTenant,
        userTypeMismatch,
        shouldCreateViRPC,
        profile_tenant_id: profile?.tenant_id,
        targetAuthId,
      })

      if (shouldCreateViRPC) {
        // --- SCALABILITY: Final Quota Check before RPC ---
        if (isNewBusiness) {
          const quota = await checkQuotaUsage(null, profile, 'business')
          if (!quota.canAdd) {
            toast.error(t('onboarding_error_quota_full', 'Jatah bisnis bapak sudah penuh ({usage}/{limit}). Silakan beli slot tambahan di Portal Add-on.').replace('{usage}', quota.usage).replace('{limit}', quota.limit))
            setLoading(false)
            isSubmittingRef.current = false
            return
          }
        }

        // --- MULTI-TENANT & NEW USER: Use RPC for Atomic Creation ---
        console.log('[Onboarding] Calling create_new_business RPC with:', {
          p_business_name: formattedName,
          p_business_vertical: model.key,
          p_location: province || null,
          p_phone: profile?.phone || user?.user_metadata?.phone || '',
        })

        const { data: rpcData, error: rpcError } = await supabase
          .rpc('create_new_business', {
            p_business_name: formattedName,
            p_business_vertical: model.key,
            p_location: province || null,
            p_phone: profile?.phone || user?.user_metadata?.phone || null
          })

        if (rpcError) {
          console.error('[Onboarding] create_new_business RPC failed:', rpcError)
          logSupabaseError(rpcError, {
            table: 'rpc:create_new_business',
            operation: 'rpc',
            component: 'BusinessModelOverlay',
            actionName: 'onboarding.create_new_business',
            metadata: {
              profile_id: profile?.id ?? null,
              auth_user_id: targetAuthId,
              tenant_id: resolvedTenantId,
              selected_vertical: selected || null,
              selected_business_model: model.key || null,
              onboarding_step: step,
              is_first_time_onboarding: isFirstTimeOnboarding,
              is_new_business: isNewBusiness,
              user_type_mismatch: userTypeMismatch,
            }
          })
          throw rpcError
        }
        
        if (!rpcData || rpcData === 'undefined' || !isUUID(rpcData)) {
          console.error('[Onboarding] create_new_business RPC returned invalid tenant_id:', rpcData)
          throw new Error('RPC returned invalid tenant_id')
        }

        console.log('[Onboarding] RPC create_new_business success, returned tenant_id:', rpcData)
        // Store created tenant_id in state to prevent duplicates on subsequent steps failure & retry
        setCreatedTenantId(rpcData)
        resolvedTenantId = rpcData

        // Point active session at the new tenant so the subsequent refetchProfile
        // (in OnboardingFlow.onComplete) picks the new business instead of the
        // old default-broker tenant that was previously persisted.
        if (typeof window !== 'undefined') {
          try { localStorage.setItem('ternakos_active_tenant_id', rpcData) } catch { /* ok */ }
        }

        toast.success(isNewBusiness ? t('onboarding_toast_new_biz_success', 'Bisnis baru berhasil dibuat!') : t('onboarding_toast_profile_success', 'Profil bisnis berhasil dibuat!'))
      }

      if (!resolvedTenantId || resolvedTenantId === 'undefined' || !isUUID(resolvedTenantId)) {
        console.error('[Onboarding] resolvedTenantId is invalid before profile update:', resolvedTenantId)
        logError({
          level: 'error',
          source: 'action',
          component: 'BusinessModelOverlay',
          actionName: 'onboarding.missing_tenant_id',
          error: { message: 'resolvedTenantId is invalid before profile update', code: 'missing_tenant_id' },
          metadata: {
            profile_id: profile?.id ?? null,
            auth_user_id: targetAuthId,
            tenant_id: resolvedTenantId || null,
            selected_vertical: selected || null,
            selected_business_model: model.key || null,
            onboarding_step: step,
            is_first_time_onboarding: isFirstTimeOnboarding,
            is_new_business: isNewBusiness,
            user_type_mismatch: userTypeMismatch,
          },
        })
        throw new Error('Tenant ID is invalid/undefined')
      }

      // --- ALWAYS UPDATE PROFILE + TENANT TO ENSURE DATA INTEGRITY ---
      console.log('[Onboarding] Updating profile and tenant details:', {
        targetAuthId,
        tenant_id: resolvedTenantId,
        user_type: model.user_type,
        sub_type: model.sub_type,
        business_vertical: model.key,
      })

      // Skip the profile update after RPC success since create_new_business() already handles it.
      if (!shouldCreateViRPC) {
        const profilePayload = {
          business_model_selected: true,
          onboarded: true,
          onboarding_completed_at: new Date().toISOString(),
        }

        // We use a safe update filtered by auth_user_id and tenant_id.
        const { error: profError } = await supabase
          .from('profiles')
          .update(profilePayload)
          .eq('auth_user_id', targetAuthId)
          .eq('tenant_id', resolvedTenantId)

        if (profError) {
          console.warn('[Onboarding] profiles update failed (non-fatal):', {
            code: profError.code,
            message: profError.message,
            details: profError.details,
            hint: profError.hint,
            payload: { auth_user_id: targetAuthId, tenant_id: resolvedTenantId },
          })
          logSupabaseError(profError, {
            table: 'profiles',
            operation: 'update',
            component: 'BusinessModelOverlay',
            actionName: 'onboarding.update_profile',
            metadata: {
              profile_id: profile?.id ?? null,
              auth_user_id: targetAuthId,
              tenant_id: resolvedTenantId,
              selected_vertical: selected || null,
              selected_business_model: model.key || null,
              onboarding_step: step,
              is_first_time_onboarding: isFirstTimeOnboarding,
              is_new_business: isNewBusiness,
              user_type_mismatch: userTypeMismatch,
            }
          })
        } else {
          console.log('[Onboarding] profiles update success')
        }
      } else {
        console.log('[Onboarding] Skipping redundant profiles update after RPC success')
      }

      if (resolvedTenantId) {
        const subType = model.sub_type || ''
        const baseType = subType.includes('sapi') ? 'sapi'
          : subType.includes('domba') && !subType.includes('kambing') ? 'domba'
          : subType.includes('kambing') && !subType.includes('domba') ? 'kambing'
          : subType.includes('bebek') ? 'bebek'
          : subType.includes('babi') ? 'babi'
          : ['peternak_broiler','peternak_layer','broker_ayam','broker_telur','rpa_ayam','rph'].includes(subType) ? 'ayam'
          : null
        const { error: tenError } = await supabase
          .from('tenants')
          .update({
            sub_type: model.sub_type || null,
            business_vertical: model.key,
            business_name: formattedName,
            province: province || null,
            base_livestock_type: baseType,
            owner_name: profile?.full_name || user?.user_metadata?.full_name || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', resolvedTenantId)
        
        if (tenError) {
          console.error('[Onboarding] tenants UPDATE failed:', {
            code: tenError.code,
            message: tenError.message,
            details: tenError.details,
            tenant_id: resolvedTenantId,
          })
          logSupabaseError(tenError, {
            table: 'tenants',
            operation: 'update',
            component: 'BusinessModelOverlay',
            actionName: 'onboarding.update_tenant',
            metadata: {
              profile_id: profile?.id ?? null,
              auth_user_id: targetAuthId,
              tenant_id: resolvedTenantId,
              selected_vertical: selected || null,
              selected_business_model: model.key || null,
              onboarding_step: step,
              is_first_time_onboarding: isFirstTimeOnboarding,
              is_new_business: isNewBusiness,
              user_type_mismatch: userTypeMismatch,
            }
          })
          throw tenError
        }
        console.log('[Onboarding] tenants UPDATE success')

        // Auto-activate trial if there is an intended trial plan from landing/pricing pages
        const intendedPlan = sessionStorage.getItem('intended_trial_plan')
        if (intendedPlan && (intendedPlan === 'pro' || intendedPlan === 'business') && resolvedTenantId) {
          console.log('[Onboarding] Auto-activating trial for plan:', intendedPlan)
          try {
            const { error: trialError } = await supabase.rpc('activate_plan_trial', {
              p_tenant_id: resolvedTenantId,
              p_plan:      intendedPlan,
              p_days:      14, // default trial days
            })
            if (trialError) {
              console.error('[Onboarding] Auto trial activation failed:', trialError.message)
            } else {
              console.log('[Onboarding] Auto trial activation success')
              toast.success(t('onboarding_toast_trial_success', 'Trial {plan} 14 hari gratis berhasil diaktifkan!').replace('{plan}', intendedPlan === 'business' ? 'Business' : 'Pro'))
            }
          } catch (trialErr) {
            console.error('[Onboarding] Auto trial activation exception:', trialErr)
          } finally {
            sessionStorage.removeItem('intended_trial_plan')
          }
        }
      }

      // --- SETUP STEP: Save initial batch (config-driven for all penggemukan verticals) ---
      const BATCH_TABLE_MAP = {
        peternak_sapi_penggemukan:             'sapi_penggemukan_batches',
        peternak_domba_penggemukan:            'domba_penggemukan_batches',
        peternak_kambing_penggemukan:          'kambing_penggemukan_batches',
        peternak_kambing_domba_penggemukan:    'domba_penggemukan_batches',
      }
      const batchTable = BATCH_TABLE_MAP[selected]
      if (batchTable && setupData.initial_count && resolvedTenantId) {
        const batchCode = `BATCH-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-001`
        const batchPayload = {
          tenant_id:            resolvedTenantId,
          batch_code:           setupData.batch_name?.trim() || batchCode,
          kandang_name:         setupData.kandang_name?.trim() || 'Kandang Utama',
          start_date:           setupData.start_date,
          total_animals:        parseInt(setupData.initial_count) || 0,
          avg_entry_weight_kg:  parseFloat(setupData.initial_avg_weight) || null,
          status:               'active',
        }
        // Sapi-specific fields
        if (selected === 'peternak_sapi_penggemukan') {
          batchPayload.batch_purpose = 'potong'
          if (setupData.purchase_price_per_kg) {
            batchPayload.notes = `Harga beli: Rp ${parseInt(setupData.purchase_price_per_kg).toLocaleString('id-ID')}/kg`
          }
        }
        const { error: batchError } = await supabase.from(batchTable).insert(batchPayload)
        if (batchError) {
          // Non-fatal: log warning but don't block onboarding
          console.warn('[Onboarding] Batch insert failed, continuing:', batchError.message)
          logSupabaseError(batchError, {
            table: batchTable,
            operation: 'insert',
            component: 'BusinessModelOverlay',
            actionName: 'onboarding.insert_initial_batch',
            metadata: {
              profile_id: profile?.id ?? null,
              auth_user_id: targetAuthId,
              tenant_id: resolvedTenantId,
              selected_vertical: selected || null,
              selected_business_model: model.key || null,
              onboarding_step: step,
              is_first_time_onboarding: isFirstTimeOnboarding,
              is_new_business: isNewBusiness,
              user_type_mismatch: userTypeMismatch,
            }
          })
        }
      }

      // Show success animation briefly before calling onComplete
      setIsSuccess(true)
      setTimeout(() => {
        if (onComplete) onComplete(selected)
      }, 1800)
    } catch (err) {
      isSubmittingRef.current = false
      console.error('[Onboarding] saveAndComplete FATAL error:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        stack: err?.stack,
      })
      // Catch-all: per-step errors above already logged via logSupabaseError.
      // This handles unexpected throws (validation, ID parse, etc.).
      logError({
        level: 'error',
        source: 'action',
        component: 'BusinessModelOverlay',
        actionName: 'onboarding.saveAndComplete_fatal',
        error: err,
        metadata: {
          profile_id: profile?.id ?? null,
          auth_user_id: targetAuthId || null,
          tenant_id: resolvedTenantId || null,
          selected_vertical: selected || null,
          selected_business_model: model?.key || null,
          onboarding_step: step,
          is_first_time_onboarding: isFirstTimeOnboarding,
          is_new_business: isNewBusiness,
          user_type_mismatch: userTypeMismatch,
        },
      })

      // Friendly toast for trigger-enforced user_type lock (P0001).
      // Even with the tenant_id scope fix above, this protects against future
      // schema changes or legitimate "you really can't switch type" cases.
      const isUserTypeLocked =
        err?.code === 'P0001' &&
        typeof err?.message === 'string' &&
        err.message.toLowerCase().includes('cannot change user_type')

      if (isUserTypeLocked) {
        toast.error(t('onboarding_error_cannot_change_type', 'Tidak bisa mengubah tipe bisnis akun ini. Buat bisnis baru lewat menu "Tambah Bisnis".'))
      } else {
        toast.error(t('onboarding_error_save_failed', 'Gagal menyelesaikan onboarding. Coba lagi sebentar lagi.'))
      }
      setLoading(false)
    }
  }

  // Legacy alias used by the name step's confirm button
  const handleConfirm = handleNameConfirm

  const handleInviteSubmit = () => {
    if (inviteInput.length !== 6) return
    nav(`/invite?code=${inviteInput.trim().toUpperCase()}`)
  }

  const handleCategorySelect = (key) => {
    setCategory(key)
    setAnimalGroup(null)
    setSelected(null)
    setStep(2)
  }

  const handleAnimalGroupSelect = (key) => {
    setAnimalGroup(key)
    setSelected(null)
    setStep(3)
  }

  const handleSubRoleSelect = (key) => {
    setSelected(key)
    setStep(isPeternak ? 4 : 3)
    // Reset setup data when changing sub-role
    setSetupData({
      batch_name: '',
      start_date: new Date().toISOString().split('T')[0],
      initial_count: '',
      initial_avg_weight: '',
      purchase_price_per_kg: '',
    })
  }

  const handleBack = () => {
    if (isSetupStep) {
      setStep(4)
    } else if (isNameStep) {
      setStep(step - 1)
      setProvinceSearch('')
    } else if (isSubRoleStep) {
      if (isPeternak) {
        setStep(2) // back to animal group
        setSelected(null)
      } else {
        // If role is locked, they can't go back to Category selection (Step 1)
        if (isRoleLocked) return
        setStep(1)
        setCategory(null)
        setSelected(null)
      }
    } else if (isAnimalStep) {
      // If role is locked, they can't go back to Category selection (Step 1)
      if (isRoleLocked) return
      setStep(1)
      setCategory(null)
      setAnimalGroup(null)
      setSelected(null)
    } else {
      if (isRoleLocked) return
      setStep(1)
      setCategory(null)
      setSelected(null)
    }
  }

  // ── Success Animation Screen ────────────────────────────────────────────────
  if (isSuccess) {
    const successModel = BUSINESS_MODELS[selected]
    const emoji = VERTICAL_SETUP_CONFIG[selected]?.emoji || successModel?.icon || '🎉'
    return (
      <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="flex flex-col items-center text-center gap-6 max-w-xs w-full"
        >
          {/* Animated check ring */}
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(ellipse at 40% 30%, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.03))',
                border: '2px solid rgba(34, 197, 94, 0.35)',
                boxShadow: '0 0 40px rgba(34, 197, 94, 0.2)',
              }}
            >
              <span className="text-5xl select-none">{emoji}</span>
            </motion.div>
            {/* Pulse ring 1 */}
            <motion.div
              animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="absolute inset-0 rounded-full border border-green-500/30"
            />
            {/* Pulse ring 2 */}
            <motion.div
              animate={{ scale: [1, 1.8], opacity: [0.2, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
              className="absolute inset-0 rounded-full border border-green-500/15"
            />
            {/* Checkmark badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 18 }}
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/40"
            >
              <Check size={18} strokeWidth={3} className="text-white" />
            </motion.div>
          </div>

          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xs font-black uppercase tracking-widest text-green-400 mb-1"
            >
              {t('onboarding_success_title', 'Bisnis Berhasil Dibuat!')}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-black text-white leading-tight"
            >
              {toTitleCase(businessName.trim())}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="text-[13px] text-slate-500 mt-2"
            >
              {t('onboarding_success_redirecting', 'Mengarahkan ke dashboard...')}
            </motion.p>
          </div>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-1.5"
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-green-500"
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-[460px] m-auto bg-[#0C1319]/80 border border-white/5 rounded-[28px] p-6 sm:p-8 shadow-2xl backdrop-blur-md overflow-hidden"
      >
        {/* Animated Background Orbs */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => onComplete?.()}
          className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer z-30 active:scale-90"
        >
          <X size={18} />
        </button>

        {/* Top accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-green-400/40 to-transparent shadow-[0_0_15px_rgba(34,197,94,0.3)]" />

        <div className="text-center mb-6 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-1 bg-green-500/10 rounded-lg border border-green-500/20 shadow-inner">
              <img src="/logo.png" alt="TernakOS" className="w-7 h-7 rounded-md object-cover" />
            </div>
            <span className="font-display font-black text-lg tracking-tight text-white">TernakOS</span>
          </div>

          {/* Progress bar with step labels */}
          <div className="flex items-start justify-center gap-1 mb-6 relative z-10">
            {(() => {
              const labels = isPeternak
                ? (needsSetupStep ? STEP_LABELS_PETERNAK : STEP_LABELS_PETERNAK_SHORT)
                : STEP_LABELS_BROKER
              return labels.map((label, i) => {
                const s = i + 1
                const isActive = step === s
                const isDone = step > s
                return (
                  <div key={s} className="flex flex-col items-center gap-1" style={{ minWidth: 52 }}>
                    <div className={cn(
                      'h-1 w-full rounded-full transition-all duration-500',
                      isDone || isActive
                        ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.35)]'
                        : 'bg-white/10'
                    )} />
                    <span className={cn(
                      'text-[8px] font-black uppercase tracking-wider transition-colors duration-300 leading-none',
                      isActive ? 'text-green-400' : isDone ? 'text-green-400' : 'text-white/15'
                    )}>
                      {stepLabelMap[label] || label}
                    </span>
                  </div>
                )
              })
            })()}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative z-10"
            >
              {step === 1 ? (
                <>
                  <h2 className="font-display text-xl sm:text-2xl font-black text-white mb-2 leading-tight">
                    {t('onboarding_cat_title', 'Kamu berbisnis sebagai?')}
                  </h2>
                  <p className="text-[13px] text-slate-400 font-medium">
                    {t('onboarding_cat_subtitle', 'Pilih kategori bisnis utama kamu.')}
                  </p>
                </>
              ) : isAnimalStep ? (
                <>
                  <h2 className="font-display text-xl sm:text-2xl font-black text-white mb-2 leading-tight">
                    {t('onboarding_animal_title', 'Jenis hewan apa? 🐄')}
                  </h2>
                  <p className="text-[13px] text-slate-400 font-medium">
                    {t('onboarding_animal_subtitle', 'Pilih jenis ternak utama bapak.')}
                  </p>
                </>
              ) : isSubRoleStep ? (
                <>
                  <h2 className="font-display text-xl sm:text-2xl font-black text-white mb-1.5 leading-tight">
                    {isNewBusiness 
                      ? t('onboarding_title_new_business_type', 'Bisnis {type}').replace('{type}', primaryRoleInfo ? t('biz_cat_' + primaryRoleInfo.category + '_label', primaryRoleInfo.label) : t('onboarding_title_new_business_fallback', 'Baru'))
                      : t('onboarding_title_specialization', 'Spesialisasi Bisnis')}
                  </h2>
                  <p className="text-[13px] text-slate-400 font-medium leading-relaxed max-w-[320px] mx-auto">
                    {isNewBusiness 
                      ? t('onboarding_desc_new_business', 'Pilih spesialisasi unit bisnis tambahan.')
                      : t('onboarding_desc_specialization', 'Lengkapi profil agar dashboard sesuai kebutuhanmu.')}
                  </p>
                </>
              ) : isNameStep ? (
                <>
                  <h2 className="font-display text-xl sm:text-2xl font-black text-white mb-1.5 leading-tight">
                    {category === 'peternak' 
                      ? t('onboarding_name_title_farm', 'Nama farm bapak?') 
                      : t('onboarding_name_title_biz', 'Nama bisnis bapak?')}
                  </h2>
                  <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                    {category === 'peternak' 
                      ? t('onboarding_name_desc_farm', 'Berikan nama yang unik untuk lokasi farm ini.') 
                      : t('onboarding_name_desc_biz', 'Nama ini akan tampil di seluruh laporan dan invoice.')}
                  </p>
                </>
              ) : isSetupStep ? (
                <>
                  <h2 className="font-display text-xl sm:text-2xl font-black text-white mb-1.5 flex items-center justify-center gap-2.5 leading-tight">
                    {t('onboarding_setup_batch_title', 'Setup Batch Pertama')}{' '}
                    <span className="animate-bounce-slow">
                      {VERTICAL_SETUP_CONFIG[selected]?.emoji || '🐄'}
                    </span>
                  </h2>
                  <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                    Data awal untuk mendukung performa ternak.
                  </p>
                </>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-3 relative z-10"
            >
              {BUSINESS_CATEGORIES.map((cat) => (
                <CategoryCard key={cat.key} cat={cat} onClick={() => handleCategorySelect(cat.key)} />
              ))}

              {/* ── Invite code entry ── */}
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => setInviteOpen(v => !v)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-[0.99]"
                >
                  <span className="flex items-center gap-2 text-[13px] font-medium">
                    <Key size={14} />
                    {t('onboarding_invite_button', 'Punya kode undangan?')}
                  </span>
                  <ChevronRight
                    size={14}
                    className={cn('transition-transform duration-200', inviteOpen && 'rotate-90')}
                  />
                </button>
 
                <AnimatePresence>
                  {inviteOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={inviteInput}
                          onChange={e => setInviteInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                          placeholder={t('onboarding_invite_placeholder', 'KODE6X')}
                          className="flex-1 h-11 rounded-xl bg-[#111C24] border border-white/8 px-4 font-mono font-black text-base tracking-[0.25em] text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors uppercase"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && inviteInput.length === 6) handleInviteSubmit()
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          disabled={inviteInput.length !== 6}
                          onClick={handleInviteSubmit}
                          className="h-11 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-[#052c1e] font-black text-sm transition-all"
                        >
                          {t('onboarding_invite_submit', 'Masuk')}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#4B6478] mt-1.5 px-1">
                        {t('onboarding_invite_note', 'Kode diberikan oleh pemilik bisnis / farm yang mengundangmu.')}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : isAnimalStep ? (
            <motion.div
              key="step-animal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="relative z-10"
            >
              <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
                {ANIMAL_GROUPS.map((group) => (
                  <ModelCard
                    key={group.key}
                    model={{
                      key: group.key,
                      label: group.label,
                      icon: group.icon,
                      description: group.description,
                      comingSoon: group.comingSoon,
                    }}
                    selected={animalGroup === group.key}
                    onClick={() => !group.comingSoon && handleAnimalGroupSelect(group.key)}
                  />
                ))}
              </div>

              {isRoleLocked ? null : (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 w-full mt-6 py-2 text-slate-500 hover:text-white transition-colors text-sm font-bold"
                >
                  <ArrowLeft size={16} />
                  {t('common.back', 'Kembali')}
                </button>
              )}
            </motion.div>
          ) : isSubRoleStep ? (
            <motion.div
              key="step-sub"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="relative z-10"
            >
              <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto pr-1 custom-scrollbar">
                {subRoles.map((model) => (
                  <ModelCard
                    key={model.key}
                    model={{
                      key: model.key,
                      label: model.name,
                      icon: model.icon,
                      description: model.description,
                      comingSoon: model.comingSoon
                    }}
                    selected={selected === model.key}
                    onClick={() => !model.comingSoon && handleSubRoleSelect(model.key)}
                  />
                ))}
              </div>

              {isRoleLocked && !isPeternak ? null : (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 w-full mt-6 py-2 text-slate-500 hover:text-white transition-colors text-sm font-bold"
                >
                  <ArrowLeft size={16} />
                  {t('common.back', 'Kembali')}
                </button>
              )}
            </motion.div>
          ) : isNameStep ? (
            <motion.div
              key="step-name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="relative z-10"
            >
              {/* Business Name Input */}
              <div className="mb-6">
                <label className="flex items-center gap-2.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                  <Building2 size={12} className="text-slate-500" />
                  {category === 'peternak' ? t('onboarding_name_label_farm', 'Nama Farm') : t('onboarding_name_label_biz', 'Nama Bisnis')} <span className="text-green-400/50">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={(e) => handleNameChange(toTitleCase(e.target.value))}
                    placeholder={t('onboarding_name_placeholder', 'Contoh: Poultry Farm Jaya')}
                    maxLength={80}
                    autoFocus
                    className={cn(
                      "relative w-full h-14 px-5 bg-[#111C24] border rounded-2xl text-white font-display font-bold text-lg outline-none transition-all duration-300",
                      nameTaken 
                        ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                        : businessName.trim().length >= 3 && !nameChecking
                          ? "border-green-500/30 focus:border-green-500/60"
                          : "border-white/5 focus:border-white/10"
                    )}
                  />
                </div>

                {/* Status messages */}
                <div className="min-h-[24px] mt-2.5 px-1">
                  {businessName.trim().length > 0 && businessName.trim().length < 3 && (
                    <p className="text-[12px] text-red-400 font-medium">
                      {category === 'peternak' ? t('onboarding_name_min_farm', 'Nama farm minimal 3 karakter') : t('onboarding_name_min_biz', 'Nama bisnis minimal 3 karakter')}
                    </p>
                  )}
                  {businessName.trim().length >= 3 && nameChecking && (
                    <div className="flex items-center gap-2.5 text-[12px] text-slate-500 font-medium font-display">
                      <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                      {t('onboarding_name_checking', 'Mengecek ketersediaan...')}
                    </div>
                  )}
                  {businessName.trim().length >= 3 && !nameChecking && nameTaken && (
                    <p className="text-[12px] text-red-500 font-medium animate-in fade-in slide-in-from-left-2 duration-300">
                      {t('onboarding_name_taken', '❌ Nama "{name}" sudah terpakai.').replace('{name}', toTitleCase(businessName))}
                    </p>
                  )}
                  {businessName.trim().length >= 3 && !nameChecking && !nameTaken && (
                    <p className="text-[12px] text-green-400 font-bold animate-in fade-in slide-in-from-left-2 duration-300">
                      {t('onboarding_name_available', '✅ {name} tersedia').replace('{name}', toTitleCase(businessName))}
                    </p>
                  )}
                </div>
              </div>

              {/* Province Searchable Combobox */}
              <div className="mb-8 relative">
                <label className="flex items-center gap-2.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                  <MapPin size={12} className="text-slate-500" />
                  {t('onboarding_province_label', 'Provinsi')} <span className="text-green-500/50">*</span>
                </label>
                
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                  <input
                    type="text"
                    value={provinceOpen ? provinceSearch : province}
                    onChange={(e) => {
                      setProvinceSearch(e.target.value)
                      if (!provinceOpen) setProvinceOpen(true)
                    }}
                    onFocus={() => {
                      setProvinceSearch('')
                      setProvinceOpen(true)
                    }}
                    placeholder={province || t('onboarding_province_placeholder', 'Ketik nama provinsi...')}
                    className={cn(
                      "relative w-full h-14 pl-5 pr-12 bg-[#111C24] border rounded-2xl text-white font-medium text-[15px] outline-none transition-all duration-300",
                      province ? "border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]" : "border-white/5 focus:border-white/10"
                    )}
                  />
                  <div 
                    onClick={() => setProvinceOpen(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-full cursor-pointer transition-all z-10"
                  >
                    <ChevronDown size={16} className={cn("text-slate-500 transition-transform duration-300", provinceOpen && "rotate-180")} />
                  </div>
                </div>

                <AnimatePresence>
                  {provinceOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -4 }}
                      className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#111C24]/95 border border-white/10 rounded-2xl max-h-[220px] overflow-y-auto z-[100] p-2 shadow-2xl backdrop-blur-xl custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                      {filteredProvinces.length > 0 ? (
                        filteredProvinces.map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => { 
                              setProvince(p)
                              setProvinceSearch('')
                              setProvinceOpen(false) 
                            }}
                            className={cn(
                              "w-full px-4 py-3.5 text-left rounded-xl text-[14px] font-medium transition-all mb-1 flex items-center justify-between",
                              province === p 
                                ? "bg-green-500/10 text-green-400 font-bold" 
                                : "text-slate-300 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <span>{p}</span>
                            {province === p && <Check size={14} className="text-green-400 font-black" />}
                          </button>
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-sm text-slate-500 italic">{t('onboarding_province_not_found', 'Provinsi tidak ditemukan')}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                onClick={handleConfirm}
                disabled={loading || businessName.trim().length < 3 || nameTaken || nameChecking || !province}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "w-full h-14 rounded-2xl font-display font-black text-base shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2",
                  (businessName.trim().length >= 3 && !nameTaken && !nameChecking && province)
                    ? "bg-emerald-500 hover:bg-emerald-400 text-[#052c1e] shadow-emerald-500/20"
                    : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                )}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
                    {t('common.saving', 'Menyimpan...')}
                  </div>
                ) : (
                  <>{t('common.continue', 'Lanjutkan')} <ArrowLeft size={16} className="rotate-180" /></>
                )}
              </motion.button>

              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-2 w-full mt-6 py-2 text-slate-500 hover:text-white transition-colors text-sm font-bold"
              >
                <ArrowLeft size={16} />
                {t('common.back', 'Kembali')}
              </button>
            </motion.div>

          ) : isSetupStep ? (
            <motion.div
              key="step-setup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="relative z-10"
            >
              <div className="mb-2">
                <StepSetup
                  selectedModel={selected}
                  setupData={setupData}
                  setSetupData={setSetupData}
                  t={t}
                />
              </div>

              <motion.button
                onClick={saveAndComplete}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "w-full h-16 rounded-2xl font-display font-black text-lg shadow-xl shadow-amber-500/20 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2",
                  loading ? "bg-amber-500/50 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-400 text-[#2c1a05]"
                )}
              >
                {loading ? (
                   <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-amber-900/30 border-t-amber-900 rounded-full animate-spin" />
                    {t('common.saving', 'Menyimpan...')}
                  </div>
                ) : (
                  <>{t('onboarding_setup_complete', 'Selesaikan Setup')} <ArrowLeft size={18} className="rotate-180" /></>
                )}
              </motion.button>

              <div className="flex flex-col gap-1 mt-6">
                <button
                  onClick={() => saveAndComplete()}
                  className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-[13px] font-bold transition-colors"
                >
                  {t('onboarding_setup_skip', 'Lewati untuk sekarang')}
                </button>

                <button
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 w-full py-2 text-slate-600 hover:text-slate-400 transition-colors text-xs font-bold"
                >
                  <ArrowLeft size={14} />
                  {t('onboarding_setup_back_to_name', 'Kembali ke Nama Bisnis')}
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function CategoryCard({ cat, onClick }) {
  const { t } = useLanguage()
  const labelKey = `biz_cat_${cat.key}_label`
  const descKey = `biz_cat_${cat.key}_desc`
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01, borderColor: 'rgba(34, 197, 94, 0.2)' }}
      onClick={onClick}
      className="group relative bg-[#111C24] border border-white/5 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:bg-[#15232d] shadow-lg hover:shadow-green-500/5"
    >
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-500 border border-green-500/10 group-hover:border-green-500/30 group-hover:bg-green-500/20 overflow-hidden">
          {typeof cat.icon === 'string' && cat.icon.includes('/')
            ? <img src={cat.icon} alt={t(labelKey, cat.label)} className="w-full h-full object-cover scale-110" />
            : cat.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-display font-bold text-[16px] text-white group-hover:text-green-400 transition-colors duration-300">
            {t(labelKey, cat.label)}
          </h4>
          <p className="font-body text-[12px] text-slate-500 mt-1 leading-relaxed">
            {t(descKey, cat.description)}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-green-400 group-hover:bg-green-500/10 transition-all duration-300">
          ›
        </div>
      </div>
    </motion.div>
  )
}

function ModelCard({ model, selected, onClick }) {
  const { t } = useLanguage()
  const isAnimal = ['ayam', 'bebek', 'domba', 'kambing', 'sapi', 'babi'].includes(model.key)
  const labelKey = isAnimal ? `animal_group_${model.key}_label` : `biz_model_${model.key}_label`
  const descKey = isAnimal ? `animal_group_${model.key}_desc` : `biz_model_${model.key}_desc`
  return (
    <motion.div
      whileTap={!model.comingSoon ? { scale: 0.98 } : {}}
      whileHover={!model.comingSoon ? { scale: 1.01 } : {}}
      onClick={onClick}
      className={cn(
        "group relative border rounded-2xl p-4 transition-all duration-300 flex items-center gap-4",
        model.comingSoon ? "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed" : 
        selected 
          ? "bg-green-500/5 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)] cursor-pointer" 
          : "bg-[#111C24] border-white/5 hover:border-white/10 hover:bg-[#15232d] cursor-pointer"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-500 border overflow-hidden",
        selected
          ? "bg-green-500/20 border-green-500/30 shadow-inner"
          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
      )}>
        {typeof model.icon === 'string' && model.icon.includes('/')
          ? <img src={model.icon} alt={t(labelKey, model.label)} className="w-full h-full object-cover scale-110" />
          : model.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1">
          <h4 className={cn(
            "font-display font-bold text-[15px] truncate transition-colors",
            selected ? "text-green-400" : "text-white"
          )}>
            {t(labelKey, model.label)}
          </h4>
          {model.comingSoon && (
            <span className="text-[9px] font-black tracking-widest text-[#FBBF24] bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
              Soon
            </span>
          )}
        </div>
        <p className="font-body text-[11px] text-slate-500 leading-relaxed truncate">
          {t(descKey, model.description)}
        </p>
      </div>
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 border-1.5",
        selected 
          ? "bg-green-500 border-transparent shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
          : "border-white/10"
      )}>
        {model.comingSoon ? <Lock size={10} className="text-white/20" /> : selected && <Check size={12} className="text-[#052c1e] font-black" strokeWidth={4} />}
      </div>
    </motion.div>
  )
}
