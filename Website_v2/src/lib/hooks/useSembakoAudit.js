import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { db } from '../offline/db'
import { syncEngine } from '../offline/syncEngine'
import { toast } from 'sonner'

export function useDeleteSingleAuditLog() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (logId) => {
      const tenantId = tenant?.id

      // 1. Delete from local Dexie
      try {
        await db.audit_logs.delete(logId)
      } catch (e) {
        console.warn('[useDeleteSingleAuditLog] Dexie delete failed:', e)
      }

      // 2. Delete from Supabase
      if (tenantId && navigator.onLine) {
        try {
          await supabase.from('sembako_audit_logs').delete().eq('id', logId).eq('tenant_id', tenantId)
        } catch (err) {
          console.warn('[useDeleteSingleAuditLog] Supabase delete failed:', err)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      toast.success('Log berhasil dihapus')
    },
    onError: (err) => {
      toast.error('Gagal menghapus log: ' + (err?.message || 'Error'))
    }
  })
}

export function usePurgeAuditLogsBeforeDate() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (timestamp) => {
      const tenantId = tenant?.id
      if (!timestamp) return

      // 1. Delete from local Dexie where timestamp <= timestamp
      try {
        const oldLogKeys = await db.audit_logs
          .where('timestamp')
          .belowOrEqual(timestamp)
          .primaryKeys()
        if (oldLogKeys.length > 0) {
          await db.audit_logs.bulkDelete(oldLogKeys)
        }
      } catch (e) {
        console.warn('[usePurgeAuditLogsBeforeDate] Dexie delete failed:', e)
      }

      // 2. Delete from Supabase
      if (tenantId && navigator.onLine) {
        try {
          const { error } = await supabase
            .from('sembako_audit_logs')
            .delete()
            .eq('tenant_id', tenantId)
            .lte('created_at', timestamp)
          if (error) throw error
        } catch (err) {
          console.warn('[usePurgeAuditLogsBeforeDate] Supabase delete failed:', err)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      toast.success('Log lama berhasil dibersihkan!')
    },
    onError: (err) => {
      toast.error('Gagal membersihkan log lama: ' + (err?.message || 'Error'))
    }
  })
}

export function useClearSembakoAuditLogs() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const tenantId = tenant?.id

      // 1. Clear local IndexedDB logs
      try {
        await db.audit_logs.clear()
      } catch (e) {
        console.warn('[useClearSembakoAuditLogs] Dexie clear failed:', e)
      }

      // 2. Clear cloud logs in Supabase
      if (tenantId && navigator.onLine) {
        try {
          const { error } = await supabase.from('sembako_audit_logs').delete().eq('tenant_id', tenantId)
          if (error) throw error
        } catch (err) {
          console.warn('[useClearSembakoAuditLogs] Supabase delete failed:', err)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      toast.success('Seluruh riwayat log audit berhasil dibersihkan!')
    },
    onError: (err) => {
      toast.error('Gagal membersihkan log audit: ' + (err?.message || 'Error'))
    }
  })
}

// Helper to record an audit log entry (persisted locally and synced with DB if available)
export async function recordAuditLog({ action_type, product_name, old_value, new_value, notes, profile, tenant_id }) {
  const logEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    tenant_id: tenant_id || profile?.tenant_id || null,
    user_name: profile?.full_name || profile?.email || 'User System',
    user_role: profile?.role || 'admin',
    action_type, // 'DELETE_SUPPLIER', 'DELETE_CUSTOMER', 'EDIT_SUPPLIER', 'EDIT_CUSTOMER', 'stock_adj', etc.
    product_name: product_name || '-',
    old_value: old_value ?? '-',
    new_value: new_value ?? '-',
    notes: notes || '',
  }

  // 1. Store in Dexie IndexedDB for client-side audit history
  try {
    await db.audit_logs.put(logEntry)
    const count = await db.audit_logs.count()
    if (count > 200) {
      const keysToDelete = await db.audit_logs.orderBy('timestamp').limit(count - 200).keys()
      await db.audit_logs.bulkDelete(keysToDelete)
    }
  } catch (e) {
    console.warn('[recordAuditLog] Dexie put failed', e)
  }

  // 2. Direct insert to Supabase if online
  if (navigator.onLine && logEntry.tenant_id) {
    try {
      const dbPayload = {
        tenant_id: logEntry.tenant_id,
        user_name: logEntry.user_name || 'Sistem',
        role: logEntry.user_role || 'admin',
        action_type: logEntry.action_type || 'AUDIT',
        product_name: logEntry.product_name || '-',
        notes: logEntry.notes || (logEntry.old_value !== '-' || logEntry.new_value !== '-' ? `${logEntry.old_value} -> ${logEntry.new_value}` : ''),
        created_at: logEntry.timestamp || new Date().toISOString(),
      }
      await supabase.from('sembako_audit_logs').insert(dbPayload)
    } catch (err) {
      console.warn('[recordAuditLog] Direct insert to supabase failed, queuing:', err)
      try {
        await db.sync_queue.add({
          action: 'CREATE',
          entity: 'audit_logs',
          payload: logEntry,
          created_at: new Date().toISOString(),
          status: 'pending'
        })
      } catch (qErr) {
        console.warn('[recordAuditLog] Sync queue fallback failed:', qErr)
      }
    }
  } else {
    // Queue for background synchronization to Supabase
    try {
      await db.sync_queue.add({
        action: 'CREATE',
        entity: 'audit_logs',
        payload: logEntry,
        created_at: new Date().toISOString(),
        status: 'pending'
      })
    } catch (qErr) {
      console.warn('[recordAuditLog] Sync queue addition failed:', qErr)
    }
  }

  // 3. Trigger sync in background if online
  if (navigator.onLine) {
    syncEngine.syncNow().catch(err => {
      console.warn('[recordAuditLog] Background sync trigger failed:', err)
    })
  }

  return logEntry
}

export function useSembakoAuditLogs() {
  const { tenant } = useAuth()
  const tenantId = tenant?.id

  return useQuery({
    queryKey: ['sembako-audit-logs', tenantId],
    queryFn: async () => {
      const logMap = new Map()

      // 1. Fetch explicit audit logs from Supabase cloud if online
      if (tenantId && navigator.onLine) {
        try {
          const { data: dbLogs, error: dbErr } = await supabase
            .from('sembako_audit_logs')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(200)

          if (!dbErr && dbLogs && dbLogs.length > 0) {
            const mappedLogs = dbLogs.map(l => ({
              ...l,
              timestamp: l.created_at || l.timestamp || new Date().toISOString(),
              user_role: l.role || l.user_role || 'staff',
            }))
            mappedLogs.forEach(l => logMap.set(l.id, l))
            // Background save to local Dexie for offline speed
            db.audit_logs.bulkPut(mappedLogs).catch(() => {})
          }
        } catch (err) {
          console.warn('[useSembakoAuditLogs] Supabase query failed:', err)
        }
      }

      // 2. Fetch local Dexie audit logs to cover offline & un-synced entries
      try {
        const localLogs = await db.audit_logs.toArray()
        localLogs.forEach(l => {
          if (!logMap.has(l.id)) {
            logMap.set(l.id, l)
          }
        })
      } catch (e) {
        console.warn('[useSembakoAuditLogs] Dexie read failed', e)
      }

      // 3. Synthesize from DB tables: sembako_stock_batches, sembako_stock_out & sembako_returns
      try {
        let batchQ = supabase
          .from('sembako_stock_batches')
          .select('*, sembako_products(product_name, unit), sembako_suppliers(supplier_name)')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(40)

        let outQ = supabase
          .from('sembako_stock_out')
          .select('*, sembako_products(product_name, unit), sembako_sales(invoice_number, is_deleted)')
          .order('created_at', { ascending: false })
          .limit(40)

        if (tenantId) {
          batchQ = batchQ.eq('tenant_id', tenantId)
          outQ = outQ.eq('tenant_id', tenantId)
        }

        const [{ data: batches }, { data: outs }] = await Promise.all([batchQ, outQ])

        if (batches) {
          batches.forEach(b => {
            const pName = b.sembako_products?.product_name || 'Produk'
            const unit = b.sembako_products?.unit || 'unit'
            const sup = b.sembako_suppliers?.supplier_name ? ` dari ${b.sembako_suppliers.supplier_name}` : ''
            const logId = `batch-${b.id}`
            if (!logMap.has(logId)) {
              logMap.set(logId, {
                id: logId,
                timestamp: b.purchase_date || b.created_at,
                user_name: 'Admin',
                user_role: 'admin',
                action_type: 'MASUK',
                product_name: pName,
                old_value: '0',
                new_value: `+${b.qty_masuk} ${unit}`,
                notes: `Stok masuk batch ${b.batch_code || ''}${sup} (@ Rp ${Number(b.buy_price || 0).toLocaleString('id-ID')})`,
              })
            }
          })
        }

        if (outs) {
          outs.forEach(s => {
            if (s.sembako_sales?.is_deleted) return // Skip deleted sales
            const pName = s.sembako_products?.product_name || 'Produk'
            const unit = s.sembako_products?.unit || 'unit'
            const inv = s.sembako_sales?.invoice_number ? ` (Inv: ${s.sembako_sales.invoice_number})` : ''
            const isAdj = s.reason === 'adjustment'
            const logId = `out-${s.id}`
            if (!logMap.has(logId)) {
              logMap.set(logId, {
                id: logId,
                timestamp: s.created_at,
                user_name: 'Kasir / System',
                user_role: 'system',
                action_type: isAdj ? 'ADJUSTMENT' : 'KELUAR',
                product_name: pName,
                old_value: '-',
                new_value: `-${s.qty_keluar} ${unit}`,
                notes: s.notes || (isAdj ? `Penyesuaian stok` : `Penjualan${inv}`),
              })
            }
          })
        }

        // Synthesize returns
        let retQ = supabase
          .from('sembako_returns')
          .select('*')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(30)

        if (tenantId) {
          retQ = retQ.eq('tenant_id', tenantId)
        }

        const { data: returnsData } = await retQ
        if (returnsData) {
          returnsData.forEach(r => {
            const logId = `retur-${r.id}`
            if (!logMap.has(logId)) {
              const isCancelled = r.is_deleted || r.status === 'cancelled'
              logMap.set(logId, {
                id: logId,
                timestamp: r.created_at || new Date().toISOString(),
                user_name: 'Admin / Retur',
                user_role: 'admin',
                action_type: isCancelled ? 'RETUR_BATAL' : 'RETUR_MASUK',
                product_name: r.product_name || 'Produk',
                old_value: isCancelled ? `${r.quantity} ${r.unit}` : '0',
                new_value: isCancelled ? '0 (Dibatalkan)' : `+${r.quantity} ${r.unit}`,
                notes: `Retur (${r.party_name || '-'}) - ${r.reason || 'Klaim'} @ Rp ${Number(r.total_amount || r.amount || 0).toLocaleString('id-ID')}`,
              })
            }
          })
        }
      } catch (err) {
        console.warn('[useSembakoAuditLogs] db synthesis fallback err:', err)
      }

      // Sort combined logs by timestamp descending
      const combined = Array.from(logMap.values())
      return combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    },
    staleTime: 10000,
  })
}
