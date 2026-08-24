import { db } from './db'
import { supabase } from '@/lib/supabase'

export const SyncStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  SYNCING: 'syncing',
  ERROR: 'error'
}

class SyncEngine {
  constructor() {
    this.status = navigator.onLine ? SyncStatus.ONLINE : SyncStatus.OFFLINE
    this.listeners = new Set()
    this.isSyncing = false

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true))
      window.addEventListener('offline', () => this.handleNetworkChange(false))
    }
  }

  subscribe(listener) {
    this.listeners.add(listener)
    listener(this.status)
    return () => this.listeners.delete(listener)
  }

  notify() {
    this.listeners.forEach(fn => fn(this.status))
  }

  handleNetworkChange(isOnline) {
    if (isOnline) {
      this.status = SyncStatus.ONLINE
      this.notify()
      this.syncNow()
    } else {
      this.status = SyncStatus.OFFLINE
      this.notify()
    }
  }

  // ── PULL DATA FROM SUPABASE TO INDEXEDDB ────────────────────────────────
  async pullInitialData(tenantId) {
    if (!navigator.onLine || !tenantId) return

    try {
      // Pull Products
      const { data: products } = await supabase.from('sembako_products').select('*').eq('tenant_id', tenantId)
      if (products && products.length > 0) {
        await db.products.bulkPut(products)
      }

      // Pull Customers
      const { data: customers } = await supabase.from('sembako_customers').select('*').eq('tenant_id', tenantId)
      if (customers && customers.length > 0) {
        await db.customers.bulkPut(customers)
      }

      // Pull Suppliers
      const { data: suppliers } = await supabase.from('sembako_suppliers').select('*').eq('tenant_id', tenantId)
      if (suppliers && suppliers.length > 0) {
        await db.suppliers.bulkPut(suppliers)
      }

      // Pull Sales
      const { data: sales } = await supabase.from('sembako_sales').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(200)
      if (sales && sales.length > 0) {
        await db.sales.bulkPut(sales)
      }

      // Pull Audit Logs
      const { data: auditLogs } = await supabase.from('sembako_audit_logs').select('*').eq('tenant_id', tenantId).order('timestamp', { ascending: false }).limit(100)
      if (auditLogs && auditLogs.length > 0) {
        await db.audit_logs.bulkPut(auditLogs)
      }

      await db.app_metadata.put({ key: 'last_sync_timestamp', value: new Date().toISOString() })
    } catch (err) {
      console.warn('[SyncEngine] Failed to pull initial data:', err)
    }
  }

  // ── PUSH LOCAL QUEUE TO SUPABASE ─────────────────────────────────────────
  async syncNow() {
    if (this.isSyncing || !navigator.onLine) return

    this.isSyncing = true
    this.status = SyncStatus.SYNCING
    this.notify()

    try {
      const pendingItems = await db.sync_queue.where('status').equals('pending').toArray()

      for (const item of pendingItems) {
        try {
          await db.sync_queue.update(item.id, { status: 'syncing' })

          if (item.entity === 'sales') {
            if (item.action === 'CREATE') {
              const { error } = await supabase.from('sembako_sales').insert(item.payload)
              if (error) throw error
            }
          } else if (item.entity === 'products') {
            if (item.action === 'CREATE') {
              const { error } = await supabase.from('sembako_products').insert(item.payload)
              if (error) throw error
            } else if (item.action === 'UPDATE') {
              const { error } = await supabase.from('sembako_products').update(item.payload).eq('id', item.payload.id)
              if (error) throw error
            }
          } else if (item.entity === 'customers') {
            if (item.action === 'CREATE') {
              const { error } = await supabase.from('sembako_customers').insert(item.payload)
              if (error) throw error
            } else if (item.action === 'UPDATE') {
              const { error } = await supabase.from('sembako_customers').update(item.payload).eq('id', item.payload.id)
              if (error) throw error
            }
          } else if (item.entity === 'suppliers') {
            if (item.action === 'CREATE') {
              const { error } = await supabase.from('sembako_suppliers').insert(item.payload)
              if (error) throw error
            } else if (item.action === 'UPDATE') {
              const { error } = await supabase.from('sembako_suppliers').update(item.payload).eq('id', item.payload.id)
              if (error) throw error
            }
          } else if (item.entity === 'payments') {
            if (item.action === 'CREATE') {
              const { error } = await supabase.from('sembako_payments').insert(item.payload)
              if (error) throw error
            }
          } else if (item.entity === 'returns') {
            if (item.action === 'CREATE') {
              const { error } = await supabase.from('sembako_returns').insert(item.payload)
              if (error) throw error
            }
          } else if (item.entity === 'audit_logs') {
            if (item.action === 'CREATE') {
              const { error } = await supabase.from('sembako_audit_logs').insert(item.payload)
              if (error) throw error
            }
          }

          // Successfully synced -> Remove from queue
          await db.sync_queue.delete(item.id)
        } catch (itemErr) {
          console.error(`[SyncEngine] Error syncing queue item #${item.id}:`, itemErr)
          await db.sync_queue.update(item.id, { status: 'pending' })
        }
      }

      this.status = SyncStatus.ONLINE
    } catch (err) {
      console.error('[SyncEngine] Sync failed:', err)
      this.status = SyncStatus.ERROR
    } finally {
      this.isSyncing = false
      this.notify()
    }
  }
}

export const syncEngine = new SyncEngine()
