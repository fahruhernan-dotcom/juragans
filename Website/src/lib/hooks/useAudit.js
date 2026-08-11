import { supabase } from '../supabaseClient'

export async function recordAuditLog({ action_type, product_name, old_value, new_value, notes, profile, tenant_id }) {
  const logEntry = {
    tenant_id: tenant_id || profile?.tenant_id || '00000000-0000-0000-0000-000000000002',
    user_name: profile?.full_name || profile?.email || 'System Juragan',
    role: profile?.role || 'owner',
    action_type,
    product_name: product_name || '-',
    old_qty: typeof old_value === 'number' ? old_value : 0,
    new_qty: typeof new_value === 'number' ? new_value : 0,
    notes: notes || '',
    created_at: new Date().toISOString()
  }

  try {
    const { data, error } = await supabase
      .from('sembako_audit_logs')
      .insert([logEntry])
      .select()
    
    if (error) {
      console.warn('[recordAuditLog] Supabase insert note:', error.message)
    }
    return data ? data[0] : logEntry
  } catch (err) {
    console.warn('[recordAuditLog] Exception recording audit log:', err)
    return logEntry
  }
}
