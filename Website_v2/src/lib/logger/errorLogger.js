/**
 * TernakOS — Central Error Logger
 *
 * Writes to public.system_error_logs via Supabase.
 * - Never throws. If insert fails → console.error only.
 * - Redacts all sensitive fields before insert.
 * - SSG-safe: no direct window access at module level.
 * - Context (user_id, tenant_id, etc.) is injected by AuthProvider.
 */

import { supabase } from '@/lib/supabase'

// ── Module-level context (set by AuthProvider after login) ────────────────────
let _ctx = {
  userId: null,
  tenantId: null,
  vertical: null,
  role: null,
}

// Called by AuthProvider when auth state changes
export function setLoggerContext({ userId, tenantId, vertical, role }) {
  _ctx = { userId, tenantId, vertical, role }
}

// ── Table availability flag ───────────────────────────────────────────────────
let _tableUnavailable = false
let _tableCheckDone = false

// ── Pre-auth RPC availability flag ────────────────────────────────────────────
// If `log_pre_auth_error` RPC is missing (migration not run), warn once then
// suppress further pre-auth attempts for this session.
let _preAuthRpcUnavailable = false
let _preAuthRpcWarned = false

// ── Re-entry guards to prevent infinite logging loops ──────────────────────────
let _isLoggingSystemError = false
let _isSendingPreAuthLog = false

// ── Pre-auth deduplication cache ──────────────────────────────────────────────
const _recentPreAuthErrors = new Map()
function isPreAuthDeduplicated(signature) {
  const now = Date.now()
  const lastTime = _recentPreAuthErrors.get(signature)
  if (lastTime && now - lastTime < 60_000) {
    return true // Deduplicated / Throttled (1 log per 60s max per error signature)
  }
  _recentPreAuthErrors.set(signature, now)
  // Cleanup old entries
  if (_recentPreAuthErrors.size > 100) {
    for (const [k, v] of _recentPreAuthErrors.entries()) {
      if (now - v > 60_000) _recentPreAuthErrors.delete(k)
    }
  }
  return false
}

// ── Skip-warning flag — warn at most once per session ─────────────────────────
let _noAuthWarned = false

// ── Sensitive key patterns (lowercase) ───────────────────────────────────────
const SENSITIVE_PATTERNS = /password|token|secret|apikey|api_key|authorization|bearer|cookie|refresh/i

// Recursively strip sensitive keys from an object
function redact(value, depth = 0) {
  if (depth > 5) return '[truncated]'
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(v => redact(v, depth + 1))

  const cleaned = {}
  for (const [k, v] of Object.entries(value)) {
    if (SENSITIVE_PATTERNS.test(k)) {
      cleaned[k] = '[redacted]'
    } else {
      cleaned[k] = redact(v, depth + 1)
    }
  }
  return cleaned
}

function truncate(str, max) {
  if (!str) return null
  const s = String(str)
  return s.length > max ? s.slice(0, max) + '…' : s
}

// ── Throttle: max 5 identical errors per minute ───────────────────────────────
const _recentKeys = new Map()
function isThrottled(key) {
  const now = Date.now()
  const entry = _recentKeys.get(key)
  if (entry && now - entry.time < 60_000 && entry.count >= 5) return true
  if (entry) {
    entry.count++
    entry.time = now
  } else {
    _recentKeys.set(key, { count: 1, time: now })
  }
  // Clean old entries periodically
  if (_recentKeys.size > 200) {
    for (const [k, v] of _recentKeys.entries()) {
      if (now - v.time > 120_000) _recentKeys.delete(k)
    }
  }
  return false
}

// ── Current page path (SSG-safe) ─────────────────────────────────────────────
function getPagePath() {
  if (typeof window === 'undefined') return null
  return window.location.pathname
}

// ── User Agent (SSG-safe) ────────────────────────────────────────────────────
function getUserAgent() {
  if (typeof window === 'undefined') return null
  return navigator.userAgent
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function logError({
  level = 'error',
  source = 'frontend',
  component = null,
  actionName = null,
  error = null,
  metadata = {},
} = {}) {
  if (_isLoggingSystemError) return
  _isLoggingSystemError = true

  try {
    // Skip if table was confirmed unavailable this session
    if (_tableUnavailable) return

    const rawMessage = error?.message || (typeof error === 'string' ? error : null)
    const throttleKey = `${source}:${rawMessage}:${component}`
    if (isThrottled(throttleKey)) return

    const payload = {
      level,
      source,
      vertical: _ctx.vertical || null,
      role: _ctx.role || null,
      tenant_id: _ctx.tenantId || null,
      user_id: _ctx.userId || null,
      page_path: truncate(getPagePath(), 500),
      component: truncate(component, 200),
      action_name: truncate(actionName, 200),
      error_code: truncate(error?.code || null, 100),
      error_message: truncate(rawMessage, 500),
      error_details: truncate(error?.details || null, 1000),
      stack: truncate(error?.stack || null, 3000),
      metadata: redact(metadata),
      user_agent: truncate(getUserAgent(), 500),
      app_version: 'v0.9.4',
    }

    // No authenticated user:
    //   - For source === 'auth' (Login/Register/AuthCallback errors before session
    //     exists), route through SECURITY DEFINER RPC so we still capture pre-auth
    //     failures in /admin/info. RPC stamps a sentinel user_id.
    //   - Otherwise skip (RLS would reject direct insert). Warn at most once.
    if (!payload.user_id) {
      if (source === 'auth' && !_preAuthRpcUnavailable) {
        await _sendPreAuthRpc(payload)
        return
      }
      if (!_noAuthWarned) {
        console.warn('[TernakOS Logger] Skipping remote log — no authenticated user')
        _noAuthWarned = true
      }
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('system_error_logs')
        .insert(payload)

      if (insertError) {
        // Detect table-not-found errors → disable remote logging for this session
        if (
          insertError.code === '42P01' ||
          insertError.message?.includes('system_error_logs') ||
          insertError.message?.includes('does not exist')
        ) {
          if (!_tableCheckDone) {
            console.warn('[TernakOS Logger] system_error_logs table not found — remote logging disabled for this session. Run the migration SQL first.')
            _tableUnavailable = true
            _tableCheckDone = true
          }
          return
        }
        // Other insert errors — log to console only
        console.error('[TernakOS Logger] Insert failed:', insertError.message)
      }
    } catch (e) {
      // Never propagate logger errors
      console.error('[TernakOS Logger] Unexpected error:', e)
    }
  } finally {
    _isLoggingSystemError = false
  }
}

// ── Pre-auth RPC sender (internal) ────────────────────────────────────────────
// Relays an already-built payload to public.log_pre_auth_error (SECURITY DEFINER).
// Throttling + redaction are the caller's responsibility — this is a thin shim
// shared by logError()'s fallback path AND the public logPreAuthError() helper.
async function _sendPreAuthRpc(payload) {
  if (_preAuthRpcUnavailable) return

  const signature = `${payload.component}:${payload.action_name}:${payload.error_code}:${payload.error_message}`
  if (isPreAuthDeduplicated(signature)) return

  if (_isSendingPreAuthLog) return
  _isSendingPreAuthLog = true

  try {
    const { error: rpcError } = await supabase.rpc('log_pre_auth_error', {
      p_source: 'auth',
      p_component: payload.component || null,
      p_action_name: payload.action_name || null,
      p_error_code: payload.error_code || 'PRE_AUTH_ERROR',
      p_error_message: payload.error_message || null,
      p_page_path: payload.page_path || null,
      p_metadata: payload.metadata || {},
    })

    if (rpcError) {
      // Function-not-found (42883) or schema mismatch → disable for the session.
      if (
        rpcError.code === '42883' ||
        rpcError.code === 'PGRST202' ||
        rpcError.message?.includes('log_pre_auth_error') ||
        rpcError.message?.includes('does not exist') ||
        (rpcError.message?.includes('function') && rpcError.message?.includes('not found'))
      ) {
        if (!_preAuthRpcWarned) {
          console.warn('[TernakOS Logger] log_pre_auth_error RPC unavailable — pre-auth logging disabled. Run the migration SQL first.')
          _preAuthRpcWarned = true
        }
        _preAuthRpcUnavailable = true
        return
      }
      console.warn('[TernakOS Logger] Pre-auth RPC failed:', rpcError.message)
    }
  } catch (e) {
    console.warn('[TernakOS Logger] Pre-auth RPC exception:', e.message || e)
  } finally {
    _isSendingPreAuthLog = false
  }
}

// ── Public pre-auth helper ────────────────────────────────────────────────────
// Use this directly when you know there's no session yet (Login/Register/AuthCallback).
// Most call sites should keep using logError({ source: 'auth', ... }) — the
// fallback inside logError() routes here automatically when user_id is null.
// This helper is exposed for cases where you want to bypass the auth-state
// detection (e.g. server-rendered error pages) and call the RPC directly.
//
// Applies same redaction + throttle + SSG-safe window access as logError().
export async function logPreAuthError({
  component = null,
  actionName = null,
  error = null,
  metadata = {},
} = {}) {
  if (_preAuthRpcUnavailable) return
  if (_isSendingPreAuthLog) return

  const rawMessage = error?.message || (typeof error === 'string' ? error : (error != null ? String(error) : null))
  const throttleKey = `auth:${rawMessage}:${component}`
  if (isThrottled(throttleKey)) return

  const payload = {
    component: truncate(component, 200),
    action_name: truncate(actionName, 200),
    error_code: truncate(error?.code || error?.name || 'PRE_AUTH_ERROR', 100),
    error_message: truncate(rawMessage, 500),
    page_path: truncate(getPagePath(), 500),
    metadata: redact(metadata || {}),
  }

  await _sendPreAuthRpc(payload)
}
