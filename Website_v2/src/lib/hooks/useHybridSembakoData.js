import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/offline/db'
import { syncEngine } from '@/lib/offline/syncEngine'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEffect } from 'react'

export function useHybridSembakoProducts() {
  const { tenant } = useAuth()
  const tenantId = tenant?.id

  // Initial Sync Pull from Supabase when Online
  useEffect(() => {
    if (tenantId && navigator.onLine) {
      syncEngine.pullInitialData(tenantId)
    }
  }, [tenantId])

  // Live Query from Local Dexie IndexedDB
  const products = useLiveQuery(
    () => db.products.where('is_deleted').equals(false).toArray(),
    [tenantId],
    []
  )

  return {
    data: products,
    isLoading: products === undefined,
    isOffline: !navigator.onLine
  }
}

export function useCreateHybridSembakoSale() {
  const { tenant } = useAuth()

  const mutateAsync = async (salePayload) => {
    const saleId = salePayload.id || crypto.randomUUID()
    const record = {
      ...salePayload,
      id: saleId,
      tenant_id: tenant?.id,
      created_at: new Date().toISOString(),
      sync_status: navigator.onLine ? 'synced' : 'pending'
    }

    // 1. Save to local Dexie DB instantly (0ms latency for offline POS)
    await db.sales.put(record)

    // 2. Push to Sync Queue
    await db.sync_queue.add({
      action: 'CREATE',
      entity: 'sales',
      payload: record,
      created_at: new Date().toISOString(),
      status: 'pending'
    })

    // 3. Trigger Sync if online
    if (navigator.onLine) {
      syncEngine.syncNow()
    }

    return record
  }

  return { mutateAsync }
}
