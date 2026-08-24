/**
 * TernakOS — Supabase Error Logger
 * Classifies and logs Supabase/PostgREST errors to system_error_logs.
 */

import { logError } from './errorLogger'

function classifySupabaseError(error) {
  if (!error) return 'supabase_error'
  const code = error.code || ''
  const msg = (error.message || '').toLowerCase()

  if (code === '42501' || msg.includes('permission denied')) return 'policy_error'
  if (msg.includes('row-level security') || msg.includes('rls')) return 'rls_error'
  if (code === '23505') return 'constraint_error'
  if (code === 'P0001') return 'rpc_error'
  if (code === 'PGRST301') return 'policy_error'
  if (error instanceof TypeError && msg.includes('fetch')) return 'network_error'
  if (msg.includes('network') || msg.includes('failed to fetch')) return 'network_error'
  return 'supabase_error'
}

/**
 * Log a Supabase query/mutation error.
 *
 * @param {object} error - The error object from supabase query result
 * @param {object} context
 * @param {string} context.table - Table name
 * @param {string} context.operation - select | insert | update | delete | rpc
 * @param {string} [context.component]
 * @param {string} [context.actionName]
 * @param {string} [context.tenantId]
 */
export function logSupabaseError(error, {
  table = null,
  operation = null,
  component = null,
  actionName = null,
  tenantId = null,
  metadata = {},
} = {}) {
  if (!error) return

  const errorClass = classifySupabaseError(error)

  logError({
    level: 'error',
    source: 'supabase',
    component,
    actionName,
    error: {
      code: error.code || errorClass,
      message: error.message,
      details: error.details,
      stack: null,
    },
    metadata: {
      table,
      operation,
      hint: error.hint || null,
      errorClass,
      ...(tenantId ? { tenantId } : {}),
      ...metadata,
    },
  })
}
