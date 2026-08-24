import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { toast } from 'sonner'
import { getSubscriptionStatus } from '../subscriptionUtils'
import { logSupabaseError } from '../logger/supabaseLogger'
import { logError } from '../logger/errorLogger'

export const useAllTenants = () => {
  return useQuery({
    queryKey: ['admin-tenants'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id, business_name, business_vertical, plan,
          is_active, trial_ends_at, plan_expires_at, created_at,
          profiles(id, full_name, role, user_type, is_active, last_seen_at)
        `)
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error
      return data
    }
  })
}

export const useAdminUpdateTenant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ tenantId, updates }) => {
      const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId)
      
      if (error) {
        logSupabaseError(error, { table: 'tenants', operation: 'update', component: 'useAdminUpdateTenant', actionName: 'admin.tenant.update' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tenants'])
      queryClient.invalidateQueries(['admin-all-users'])
      queryClient.invalidateQueries(['profile'])
      queryClient.invalidateQueries(['admin-global-stats'])
      toast.success('Tenant berhasil diupdate')
    },
    onError: (error) => {
      toast.error('Gagal mengupdate tenant: ' + error.message)
    }
  })
}

export const useAllInvoices = () => {
  return useQuery({
    queryKey: ['admin-invoices'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_invoices')
        .select(`
          id, invoice_number, amount, plan, billing_period,
          billing_months, status, payment_proof_url, payment_method,
          payment_provider, provider_order_id, provider_payment_url, provider_status,
          confirmed_by, confirmed_at, paid_at, notes, created_at,
          tenants(id, business_name, business_vertical)
        `)
        .order('created_at', { ascending: false })
        .limit(500)
      if (error) throw error
      return data
    }
  })
}

export const useConfirmInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ invoiceId, tenantId, plan, billingMonths, notes }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const now = new Date().toISOString()

      // Superadmin mungkin tidak punya row di profiles — cek dulu, fallback null
      // supaya FK constraint "subscription_invoices_confirmed_by_fkey" tidak error
      let confirmedBy = null
      if (user?.id) {
        const { data: prof } = await supabase
          .from('profiles').select('id').eq('id', user.id).maybeSingle()
        confirmedBy = prof?.id ?? null
      }

      // 1. Capture base date BEFORE updating invoice — must happen before the DB trigger fires
      //    to avoid double-extend (trigger + frontend both extending from already-extended date)
      let baseDate = new Date()
      if (!plan.startsWith('addon_')) {
        const { data: currentTenant } = await supabase
          .from('tenants')
          .select('plan_expires_at')
          .eq('id', tenantId)
          .single()
        if (currentTenant?.plan_expires_at && new Date(currentTenant.plan_expires_at) > new Date()) {
          baseDate = new Date(currentTenant.plan_expires_at)
        }
      }

      // 2. Update invoice status → paid (DB trigger fires here, uses same base date we captured)
      const { data: invoiceRows, error: invoiceErr } = await supabase
        .from('subscription_invoices')
        .update({
          status: 'paid',
          confirmed_at: now,
          paid_at: now,
          confirmed_by: confirmedBy,
          ...(notes ? { notes } : {})
        })
        .eq('id', invoiceId)
        .eq('status', 'pending')
        .select('id')
      if (invoiceErr) {
        logSupabaseError(invoiceErr, { table: 'subscription_invoices', operation: 'update', component: 'useConfirmInvoice', actionName: 'admin.invoice.confirm_status' })
        throw invoiceErr
      }
      if (!invoiceRows || invoiceRows.length === 0) {
        throw new Error('Invoice sudah diproses sebelumnya — konfirmasi tidak dijalankan.')
      }

      // 3. Specialized Fulfillment
      // If it's an add-on (e.g. addon_business_slot), we update profiles, not tenants.
      if (plan.startsWith('addon_')) {
        if (plan === 'addon_business_slot') {
          // Find the owner profile to increment their additional_slots
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, additional_slots')
            .eq('tenant_id', tenantId)
            .eq('role', 'owner')
            .maybeSingle()

          if (profile) {
            const { error: profErr } = await supabase
              .from('profiles')
              .update({ additional_slots: (profile.additional_slots || 0) + (billingMonths || 1) })
              .eq('id', profile.id)
            if (profErr) {
              logError({ error: profErr, message: 'Failed to update profile for addon', actionName: 'admin.invoice.confirm_addon', component: 'useConfirmInvoice', metadata: { partial: true, step: 'update_profile' } })
              throw profErr
            }
            toast.success('Slot bisnis tambahan berhasil dikonfirmasi!')
          }
        }
        return // Stop here for addons
      }

      // 4. Regular Plan Fulfillment (Pro/Business)

      const newExpiry = new Date(baseDate)
      newExpiry.setMonth(newExpiry.getMonth() + billingMonths)

      const { data: planConfigRow } = await supabase
        .from('plan_configs')
        .select('config_value')
        .eq('config_key', 'kandang_limit')
        .maybeSingle()
      const kandangLimitConfig = planConfigRow?.config_value ?? {}
      const KANDANG_DEFAULTS = { starter: 1, pro: 2, business: 99 }
      const kandangLimit = kandangLimitConfig[plan] ?? KANDANG_DEFAULTS[plan] ?? 1

      const { error: tenantErr } = await supabase
        .from('tenants')
        .update({
          plan,
          plan_expires_at: newExpiry.toISOString(),
          kandang_limit: kandangLimit
        })
        .eq('id', tenantId)
      if (tenantErr) {
        logError({ error: tenantErr, message: 'Failed to update tenant plan after invoice confirm', actionName: 'admin.invoice.confirm_tenant', component: 'useConfirmInvoice', metadata: { partial: true, step: 'update_tenant' } })
        throw tenantErr
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-invoices'])
      queryClient.invalidateQueries(['admin-tenants'])
      toast.success('Invoice dikonfirmasi, plan tenant diupdate')
    },
    onError: (error) => {
      toast.error('Gagal konfirmasi invoice: ' + error.message)
    }
  })
}

export const useActivateTrial = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ tenantId, plan = 'pro', days = 7 }) => {
      const { error } = await supabase.rpc('activate_plan_trial', {
        p_tenant_id: tenantId,
        p_plan:      plan,
        p_days:      days,
      })
      if (error) {
        logSupabaseError(error, { table: 'rpc:activate_plan_trial', operation: 'rpc', component: 'useActivateTrial', actionName: 'admin.trial.activate' })
        throw error
      }
      return { plan, days }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(['profile'])
      queryClient.invalidateQueries(['admin-tenants'])
      toast.success(`Trial ${result?.plan === 'business' ? 'Business' : 'Pro'} ${result?.days ?? 7} hari berhasil diaktifkan! Selamat mencoba.`)
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal mengaktifkan trial.')
    },
  })
}

export const usePaymentSettings = () => {
  return useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })
}

export const useDeletePaymentSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('payment_settings')
        .delete()
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'payment_settings', operation: 'delete', component: 'useDeletePaymentSetting', actionName: 'admin.payment_setting.delete' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-settings'])
      toast.success('Rekening dihapus')
    },
    onError: (error) => {
      toast.error('Gagal hapus rekening: ' + error.message)
    }
  })
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ tenantId, plan, billingMonths, amount, notes, discount_code }) => {
      const timestamp = Date.now().toString(36).toUpperCase()
      const random = crypto.getRandomValues(new Uint8Array(4))
        .reduce((str, b) => str + b.toString(16).padStart(2, '0'), '')
        .toUpperCase().substring(0, 4)
      const invoiceNumber = `INV-${timestamp}-${random}`

      const { data: row, error } = await supabase
        .from('subscription_invoices')
        .insert({
          tenant_id: tenantId,
          invoice_number: invoiceNumber,
          plan,
          billing_months: billingMonths,
          amount,
          notes: notes || null,
          status: 'pending',
          payment_method: 'manual',
          payment_provider: 'manual',
          discount_code: discount_code || null
        })
        .select('id, amount')
        .single()
      if (error) {
        logSupabaseError(error, { table: 'subscription_invoices', operation: 'insert', component: 'useCreateInvoice', actionName: 'admin.invoice.create' })
        throw error
      }
      return { invoiceNumber, invoiceId: row.id, amount: row.amount }
    },
    onSuccess: ({ invoiceNumber }) => {
      queryClient.invalidateQueries(['admin-invoices'])
      toast.success(`Invoice ${invoiceNumber} berhasil dibuat`)
    },
    onError: (error) => {
      toast.error('Gagal buat invoice: ' + error.message)
    }
  })
}

export const useHasPendingInvoice = (tenantId) => {
  return useQuery({
    queryKey: ['invoice-pending-check', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_invoices')
        .select('id, invoice_number, amount')
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle()
      if (error) return null
      return data ?? null  // null = no pending, object = has pending
    },
    enabled: !!tenantId,
    staleTime: 10_000,
  })
}

export const useCancelPendingInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ invoiceId }) => {
      const { data, error } = await supabase.rpc('cancel_pending_invoice', {
        p_invoice_id: invoiceId,
      })
      if (error) {
        logSupabaseError(error, { table: 'subscription_invoices', operation: 'rpc', component: 'useCancelPendingInvoice', actionName: 'user.invoice.cancel' })
        throw error
      }
      return data
    },
    onSuccess: (data, variables) => {
      const { tenantId } = variables
      queryClient.invalidateQueries({ queryKey: ['invoice-pending-check', tenantId] })
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] })
    },
  })
}


export const useUpsertPaymentSetting = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('payment_settings')
        .upsert(payload)
      if (error) {
        logSupabaseError(error, { table: 'payment_settings', operation: 'upsert', component: 'useUpsertPaymentSetting', actionName: 'admin.payment_setting.upsert' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-settings'])
      toast.success('Rekening berhasil disimpan')
    },
    onError: (error) => {
      toast.error('Gagal simpan rekening: ' + error.message)
    }
  })
}

// --- Admin Phase 5: Pricing & Discounts (Supabase DB) ---

export const usePricingConfig = () => useQuery({
  queryKey: ['pricing-plans'],
  staleTime: 1000 * 60 * 30, // static pricing — cached for 30 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  queryFn: async () => {
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('id, role, plan, price, original_price')
      .order('role')
      .order('plan')
    if (error) throw error
    // Transform to { broker: { pro: { price, originalPrice, id }, business: {...} }, ... }
    return data.reduce((acc, row) => {
      if (!acc[row.role]) acc[row.role] = {}
      acc[row.role][row.plan] = {
        price: row.price,
        originalPrice: row.original_price,
        id: row.id
      }
      return acc
    }, {})
  }
})

export const useUpdatePricing = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ role, plan, price, originalPrice }) => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .update({ price, original_price: originalPrice, updated_at: new Date().toISOString() })
        .eq('role', role)
        .eq('plan', plan)
        .select()
        
      if (error) {
        logSupabaseError(error, { table: 'pricing_plans', operation: 'update', component: 'useUpdatePricing', actionName: 'admin.pricing.update' })
        throw error
      }

      if (!data || data.length === 0) {
        // If row doesn't exist, insert it
        const { error: insertError } = await supabase
          .from('pricing_plans')
          .insert({ role, plan, price, original_price: originalPrice })
        if (insertError) {
          logError({ error: insertError, message: 'Failed to insert pricing plan', actionName: 'admin.pricing.insert', component: 'useUpdatePricing', metadata: { partial: true, step: 'insert_pricing_plan' } })
          throw insertError
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pricing-plans'])
      toast.success('Harga berhasil diupdate')
    },
    onError: () => toast.error('Gagal update harga')
  })
}

export const useDiscountCodes = () => useQuery({
  queryKey: ['discount-codes'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
})

export const useCreateDiscountCode = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('discount_codes')
        .insert(payload)
      if (error) {
        logSupabaseError(error, { table: 'discount_codes', operation: 'insert', component: 'useCreateDiscountCode', actionName: 'admin.discount.create' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['discount-codes'])
      toast.success('Kode diskon berhasil dibuat')
    },
    onError: (err) => toast.error('Gagal membuat kode: ' + err.message)
  })
}

export const useToggleDiscountCode = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active })
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'discount_codes', operation: 'update', component: 'useToggleDiscountCode', actionName: 'admin.discount.toggle' })
        throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['discount-codes'])
  })
}

export const useDeleteDiscountCode = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active: false })
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'discount_codes', operation: 'update', component: 'useDeleteDiscountCode', actionName: 'admin.discount.soft_disable' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['discount-codes'])
      toast.success('Kode diskon berhasil dinonaktifkan.')
    },
    onError: (error) => {
      toast.error('Gagal menonaktifkan kode diskon: ' + error.message)
    }
  })
}

// --- Plan Configs (plan_configs table) ---

export const usePlanConfigs = () => useQuery({
  queryKey: ['plan-configs'],
  staleTime: 1000 * 60 * 30, // static configs — cached for 30 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  queryFn: async () => ({ trial_config: { duration: 14 } })
})

export const useUpdatePlanConfig = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ config_key, config_value }) => {
      const { error } = await supabase
        .from('plan_configs')
        .upsert(
          { config_key, config_value, updated_at: new Date().toISOString() },
          { onConflict: 'config_key' }
        )
      if (error) {
        logSupabaseError(error, { table: 'plan_configs', operation: 'upsert', component: 'useUpdatePlanConfig', actionName: 'admin.plan_config.update' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['plan-configs'])
      toast.success('Konfigurasi berhasil disimpan')
    },
    onError: () => toast.error('Gagal menyimpan konfigurasi')
  })
}

export const usePlanConfigHistory = (configKey, limit = 5) => useQuery({
  queryKey: ['plan-config-history', configKey],
  queryFn: async () => {
    const { data } = await supabase
      .from('global_audit_logs')
      .select('*')
      .eq('entity_type', `plan_configs.${configKey}`)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data ?? []
  },
  enabled: !!configKey
})

export const useMarketPriceReviewQueue = () => useQuery({
  queryKey: ['market-price-review-queue'],
  staleTime: 15_000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from('market_prices')
      .select('*')
      .eq('needs_review', true)
      .order('price_date', { ascending: false })
      .limit(50)
    if (error) throw error
    return data ?? []
  }
})

export const useApproveMarketPrice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('market_prices')
        .update({ needs_review: false })
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'market_prices', operation: 'update', component: 'useApproveMarketPrice', actionName: 'admin.market_price.approve' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['market-price-review-queue'])
      toast.success('Harga disetujui')
    },
    onError: (err) => toast.error('Gagal menyetujui: ' + err.message)
  })
}

export const useDeleteMarketPrice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('market_prices')
        .delete()
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'market_prices', operation: 'delete', component: 'useDeleteMarketPrice', actionName: 'admin.market_price.delete' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['market-price-review-queue'])
      toast.success('Data harga dihapus')
    },
    onError: (err) => toast.error('Gagal menghapus: ' + err.message)
  })
}

export const useGlobalStats = () => useQuery({
  queryKey: ['admin-global-stats'],
  staleTime: 55_000,
  refetchInterval: 60_000,
  queryFn: async () => {
    const [tenantsRes, invoicesRes] = await Promise.all([
      supabase.from('tenants').select(`
        id, business_name, plan, is_active, trial_ends_at, plan_expires_at, created_at, business_vertical,
        profiles(id, is_active, last_seen_at, role)
      `),
      supabase.from('subscription_invoices').select(
        'id, invoice_number, amount, status, confirmed_at, created_at, tenant_id, plan, billing_months, tenants(business_name)'
      )
    ])
    if (tenantsRes.error) throw tenantsRes.error
    if (invoicesRes.error) throw invoicesRes.error

    const tenants  = tenantsRes.data  || []
    const invoices = invoicesRes.data || []
    const now           = new Date()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo  = new Date(now - 7  * 24 * 60 * 60 * 1000)

    // Growth chart — last 6 calendar months (monthly new registrations)
    const monthLabels = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now)
      d.setMonth(d.getMonth() - (5 - i))
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('id-ID', { month: 'short' })
      }
    })
    const growthData = monthLabels.map(({ key, label }) => ({
      month: label,
      count: tenants.filter(t => {
        const d = new Date(t.created_at)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === key
      }).length
    }))

    return {
      tenants: {
        total:        tenants.length,
        active:       tenants.filter(t => t.is_active).length,
        pro:          tenants.filter(t => t.plan === 'pro'      && t.is_active).length,
        business:     tenants.filter(t => t.plan === 'business' && t.is_active).length,
        starter:      tenants.filter(t => t.plan === 'starter'  && t.is_active).length,
        newThisMonth: tenants.filter(t => new Date(t.created_at) > thirtyDaysAgo).length,
        trialExpiringSoon: tenants
          .filter(t => {
            const status = getSubscriptionStatus(t)
            return status.status === 'trial' && status.isExpiringSoon
          })
          .sort((a, b) => getSubscriptionStatus(a).daysLeft - getSubscriptionStatus(b).daysLeft),
        planExpiringSoon: tenants
          .filter(t => {
            const status = getSubscriptionStatus(t)
            return status.status === 'active' && status.plan !== 'starter' && status.isExpiringSoon
          })
          .sort((a, b) => getSubscriptionStatus(a).daysLeft - getSubscriptionStatus(b).daysLeft),
        planAlreadyExpired: tenants
          .filter(t => {
            const status = getSubscriptionStatus(t)
            return status.status === 'expired'
          }),
        byVertical: {
          poultry_broker: tenants.filter(t => t.business_vertical === 'poultry_broker').length,
          egg_broker:     tenants.filter(t => t.business_vertical === 'egg_broker').length,
          peternak:       tenants.filter(t => ['peternak', 'peternak_layer', 'peternak_kambing_domba_penggemukan', 'peternak_kambing_domba_breeding'].includes(t.business_vertical)).length,
          rpa:            tenants.filter(t => ['rpa', 'rumah_potong_rpa', 'rpa_ayam'].includes(t.business_vertical)).length,
        },
        growthData
      },
      users: {
        total: new Set(tenants.flatMap(t => (t.profiles || []).map(p => p.id))).size,
        activeThisWeek: new Set(
          tenants.flatMap(t => t.profiles || [])
            .filter(p => p.last_seen_at && new Date(p.last_seen_at) > sevenDaysAgo)
            .map(p => p.id)
        ).size
      },
      revenue: {
        total:         invoices.filter(i => i.status === 'paid')
                         .reduce((sum, i) => sum + (i.amount || 0), 0),
        thisMonth:     invoices
                         .filter(i => i.status === 'paid' && i.paid_at && new Date(i.paid_at) > thirtyDaysAgo)
                         .reduce((sum, i) => sum + (i.amount || 0), 0),
        pendingAmount: invoices.filter(i => i.status === 'pending')
                         .reduce((sum, i) => sum + (i.amount || 0), 0),
        pendingList:   invoices
                         .filter(i => i.status === 'pending')
                         .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                         .slice(0, 5)
      }
    }
  }
})
export const useAuditLogs = (filters = {}) => {
  return useQuery({
    queryKey: ['admin-audit-logs', filters.tenantId, filters.action, filters.entityType],
    staleTime: 10_000,
    queryFn: async () => {
      let query = supabase
        .from('global_audit_logs')
        .select(`
          *,
          actor:profiles(full_name, role),
          tenant:tenants(business_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filters.tenantId) query = query.eq('tenant_id', filters.tenantId)
      if (filters.action) query = query.eq('action', filters.action)
      if (filters.entityType) query = query.eq('entity_type', filters.entityType)

      const { data, error } = await query
      if (error) throw error
      return data
    }
  })
}

export const useAllUsers = () => {
  return useQuery({
    queryKey: ['admin-all-users'],
    staleTime: 30_000,
    queryFn: async () => {
      // 1. Fetch primary associations from profiles
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('*, tenants(id, business_name, business_vertical)')
        .order('created_at', { ascending: false })
        .limit(500)

      if (pErr) throw pErr

      // 2. Fetch staff associations from tenant_memberships
      const { data: members, error: mErr } = await supabase
        .from('tenant_memberships')
        .select('*, tenants(id, business_name, business_vertical)')
      
      if (mErr) throw mErr

      // 3. Map memberships to include source context
      const memberAssociations = (members || []).map(m => ({
        ...m,
        is_membership: true,
        // Since memberships don't have full_name, we rely on the grouping logic 
        // to find a matching profiles row with the same auth_user_id.
        full_name: m.full_name || null
      }))

      return [...profiles, ...memberAssociations]
    }
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId) => {
      // 1. Get all profiles associated with this user
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, tenant_id, role')
        .eq('auth_user_id', userId)

      if (userProfiles && userProfiles.length > 0) {
        for (const p of userProfiles) {
          // 2. If they are an owner, check if the business is "lonely"
          if (p.role === 'owner') {
            const { count, error: countErr } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('tenant_id', p.tenant_id)
            
            if (!countErr && count === 1) {
              // User is the ONLY person in this business. 
              // Delete the Tenant (this should ideally cascade delete all its wiring)
              const { error: tErr } = await supabase.from('tenants').delete().eq('id', p.tenant_id)
              if (tErr) {
                logError({ error: tErr, message: 'Failed to delete lonely tenant during user deletion', actionName: 'admin.user.delete_tenant', component: 'useDeleteUser', metadata: { partial: true, step: 'delete_tenant', tenantId: p.tenant_id } })
              }
            }
          }
        }
      }

      // 3. Remove the user's profile entries
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('auth_user_id', userId)
      if (error) {
        logSupabaseError(error, { table: 'profiles', operation: 'delete', component: 'useDeleteUser', actionName: 'admin.user.delete' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-all-users'])
      queryClient.invalidateQueries(['admin-tenants'])
      toast.success('User berhasil dihapus dari database')
    },
    onError: (error) => {
      toast.error('Gagal hapus user: ' + error.message)
    }
  })
}

export const useDeleteTenant = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (tenantId) => {
      const tid = tenantId

      const del = async (table, filter = { col: 'tenant_id', val: tid }) => {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq(filter.col, filter.val)
        if (error) {
          logError({ error, message: `Failed deleting ${table}`, actionName: 'admin.tenant.delete_cascade', component: 'useDeleteTenant', metadata: { partial: true, step: `delete_${table}` } })
          throw new Error(`Failed deleting ${table}: ${error.message}`)
        }
      }

      const nullify = async (table, col) => {
        const { error } = await supabase
          .from(table)
          .update({ [col]: null })
          .eq(col, tid)
        if (error) {
          logError({ error, message: `Failed nullifying ${table}.${col}`, actionName: 'admin.tenant.nullify_cascade', component: 'useDeleteTenant', metadata: { partial: true, step: `nullify_${table}` } })
          throw new Error(`Failed nullifying ${table}.${col}: ${error.message}`)
        }
      }

      await del('ai_anomaly_logs')
      await del('ai_staged_transactions')
      await del('broker_profiles')
      await del('cycle_expenses')
      await del('generated_invoices')
      await del('harvest_records')
      await del('kandang_workers')
      await del('market_listings')
      await del('peternak_profiles')
      await del('worker_payments')

      const { error: bcErr } = await supabase
        .from('broker_connections')
        .delete()
        .or(`requester_tenant_id.eq.${tid},target_tenant_id.eq.${tid}`)
      if (bcErr) {
        logError({ error: bcErr, message: 'Failed deleting broker_connections', actionName: 'admin.tenant.delete_broker_connections', component: 'useDeleteTenant', metadata: { partial: true, step: 'delete_broker_connections' } })
        throw new Error(`Failed deleting broker_connections: ${bcErr.message}`)
      }

      await nullify('rpa_payments', 'broker_tenant_id')
      await nullify('rpa_purchase_orders', 'broker_tenant_id')

      await del('rpa_customer_payments')
      await del('rpa_invoices')
      await del('rpa_customers')
      await del('rpa_products')

      await del('sembako_stock_out')
      await del('sembako_payroll')
      await del('sembako_supplier_payments')
      await del('sembako_payments')
      await del('sembako_deliveries')
      await del('sembako_expenses')
      await del('sembako_sales')
      await del('sembako_stock_batches')
      await del('sembako_products')
      await del('sembako_customers')
      await del('sembako_suppliers')
      await del('sembako_employees')

      const { error, count } = await supabase
        .from('tenants')
        .delete({ count: 'exact' })
        .eq('id', tid)
      if (error) {
        logSupabaseError(error, { table: 'tenants', operation: 'delete', component: 'useDeleteTenant', actionName: 'admin.tenant.delete_final' })
        throw error
      }
      if (count === 0) throw new Error('Akses ditolak: superadmin DELETE policy belum diset di Supabase.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tenants'])
      queryClient.invalidateQueries(['admin-all-users'])
      toast.success('Bisnis dan seluruh data terkait berhasil dihapus')
    },
    onError: (error) => {
      toast.error('Gagal hapus bisnis: ' + error.message)
    }
  })
}


export const useDeleteInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (invoiceId) => {
      const { data: deleted, error } = await supabase
        .from('subscription_invoices')
        .delete()
        .eq('id', invoiceId)
        .neq('status', 'paid')
        .select('id')
      if (error) {
        logSupabaseError(error, { table: 'subscription_invoices', operation: 'delete', component: 'useDeleteInvoice', actionName: 'admin.invoice.delete' })
        throw error
      }
      if (!deleted || deleted.length === 0) {
        throw new Error('Invoice dengan status paid tidak dapat dihapus.')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-invoices'])
      toast.success('Invoice berhasil dihapus permanen')
    },
    onError: (error) => {
      toast.error('Gagal hapus invoice: ' + error.message)
    }
  })
}
