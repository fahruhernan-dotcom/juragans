import { supabase } from '../../supabase'

export const STALE_5M = 5 * 60 * 1000 // 5 minutes stale time for master data cache efficiency
export const STALE_1M = 1 * 60 * 1000 // 1 minute stale time for active dashboard metrics
export const STALE_10S = 10 * 1000    // 10s stale time for high-frequency live tracking

export const ALLOWED_COLUMNS = {
  sembako_customers: [
    'tenant_id', 'customer_name', 'customer_type', 'phone', 'address', 'area',
    'payment_terms', 'credit_limit', 'reliability_score', 'is_deleted'
  ],
  sembako_suppliers: [
    'tenant_id', 'supplier_name', 'phone', 'address', 'notes', 'is_deleted'
  ],
  sembako_products: [
    'tenant_id', 'product_name', 'category', 'unit', 'current_stock',
    'avg_buy_price', 'sell_price', 'min_stock_alert', 'is_active', 'is_deleted',
    'sku', 'weight_gram', 'raw_ingredient_cost', 'pouch_cost', 'sticker_front_cost',
    'sticker_back_cost', 'other_packaging_cost', 'harga_solo_rp', 'harga_luar_kota_rp',
    'harga_grosir_rp', 'harga_marketplace_promo_rp'
  ],
  sembako_raw_materials: [
    'tenant_id', 'material_name', 'category', 'unit', 'current_stock', 'unit_cost',
    'total_spent', 'min_stock_alert', 'supplier_name', 'notes', 'is_deleted'
  ],
  b2b_leads: [
    'tenant_id', 'campaign_id', 'queue_id', 'place_id', 'name', 'clean_name', 'category', 'country',
    'city', 'address', 'latitude', 'longitude', 'maps_url', 'phone', 'email',
    'email_source', 'website', 'cms', 'has_contact_form', 'instagram_url',
    'facebook_url', 'tiktok_url', 'linkedin_url', 'rating', 'review_count',
    'contactability_score', 'lead_priority', 'status_email', 'status_whatsapp',
    'ai_menu_highlight', 'ai_custom_icebreaker', 'ai_generated_subject', 'ai_generated_pitch',
    'notes', 'is_deleted'
  ],
  b2b_scraping_queue: [
    'target_location', 'country', 'city_or_region', 'status', 'total_leads_collected', 'last_scraped_at', 'notes'
  ],
  juragan_b2b_settings: [
    'tenant_id', 'active_target_country', 'active_target_region', 'is_auto_outreach_active',
    'daily_email_limit', 'offer_tasting_sample', 'sample_size_gram'
  ],
  sembako_stock_batches: [
    'tenant_id', 'product_id', 'supplier_id', 'batch_code', 'qty_masuk',
    'qty_sisa', 'buy_price', 'purchase_date', 'expiry_date', 'notes', 'is_deleted'
  ],
  sembako_employees: [
    'tenant_id', 'full_name', 'phone', 'role', 'status', 'base_salary', 'is_deleted'
  ],
  sembako_deliveries: [
    'tenant_id', 'sale_id', 'employee_id', 'driver_name', 'vehicle_type',
    'vehicle_plate', 'delivery_date', 'status', 'notes',
    'departed_at', 'arrived_at', 'completed_at', 'is_deleted'
  ],
  sembako_payments: [
    'tenant_id', 'sale_id', 'customer_id', 'amount', 'payment_date',
    'payment_method', 'reference_number', 'notes', 'is_deleted'
  ],
  sembako_returns: [
    'tenant_id', 'return_number', 'return_type', 'party_name', 'product_id',
    'product_name', 'customer_id', 'supplier_id', 'sale_id', 'quantity',
    'unit', 'unit_price', 'total_amount', 'reason', 'action', 'status',
    'notes', 'is_deleted'
  ],
  sembako_inventory_mutations: [
    'tenant_id', 'material_id', 'material_name', 'material_category',
    'mutation_type', 'action_type', 'quantity', 'unit', 'unit_cost',
    'total_cost', 'prev_stock', 'new_stock', 'ref_type', 'ref_id',
    'ref_number', 'party_name', 'notes', 'created_by', 'created_at'
  ]
}

export function sanitizeDBPayload(payload, allowedKey) {
  if (!payload || typeof payload !== 'object') return {}
  const allowed = ALLOWED_COLUMNS[allowedKey]
  if (!allowed) return payload
  const clean = {}
  for (const key of allowed) {
    if (key in payload && payload[key] !== undefined) {
      clean[key] = payload[key]
    }
  }
  return clean
}

export async function getTenantId() {
  const activeTenantId = localStorage.getItem('ternakos_active_tenant_id')
  if (activeTenantId) return activeTenantId

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .limit(1)

      if (profiles && profiles.length > 0 && profiles[0]?.tenant_id) {
        return profiles[0].tenant_id
      }
    }
  } catch (e) {
    // ignore
  }

  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1)
    if (tenants && tenants.length > 0 && tenants[0]?.id) {
      return tenants[0].id
    }
  } catch (e) {
    // ignore
  }

  const fallbackId = '00000000-0000-0000-0000-000000000002'
  try {
    await supabase.from('tenants').upsert({
      id: fallbackId,
      business_name: '',
      business_vertical: 'distributor_sembako'
    }, { onConflict: 'id' })
  } catch (e) {
    // ignore
  }

  return fallbackId
}
