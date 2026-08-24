import Dexie from 'dexie'

export const db = new Dexie('VirginERP_OfflineDB')

db.version(2).stores({
  products: 'id, product_name, category, is_active, is_deleted, min_stock_alert',
  customers: 'id, customer_name, phone, area, is_deleted',
  suppliers: 'id, supplier_name, phone, is_deleted',
  sales: 'id, invoice_number, customer_id, customer_name, payment_status, transaction_date, sync_status',
  stock_batches: 'id, product_id, supplier_id, batch_code, purchase_date',
  stock_outs: 'id, product_id, sale_id, created_at',
  returns: 'id, type, party_name, product_id, status, created_at, sync_status',
  sync_queue: '++id, action, entity, payload, created_at, status', // status: 'pending' | 'syncing' | 'failed'
  app_metadata: 'key, value',
  audit_logs: 'id, tenant_id, timestamp'
})

// Initialize default app metadata if empty safely
db.on('ready', async () => {
  try {
    const lastSync = await db.app_metadata.get('last_sync_timestamp')
    if (!lastSync) {
      await db.app_metadata.put({ key: 'last_sync_timestamp', value: null })
    }
  } catch (err) {
    console.warn('[Dexie] ready hook warning (handled):', err)
  }
})
