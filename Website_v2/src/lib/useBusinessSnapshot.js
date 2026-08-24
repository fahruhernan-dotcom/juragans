import { supabase } from './supabase'

/**
 * useBusinessSnapshot
 * Phase 6: Financial State & Snapshot Engine
 * 
 * Provides consolidated state by summing Production + Staging + UI levels.
 */
export const useBusinessSnapshot = () => {

  /**
   * Fetches the total accumulated quantity/amount for a parent entity.
   * Logic: Production DB + Staged AI Transactions.
   */
  const getAccumulatedTotal = async (parentId, type) => {
    if (!parentId) return 0

    // NEW: Guard against non-UUID IDs (like 'entry-1' or '2')
    // Databases using UUIDs will throw 400 if queried with plain strings/numbers.
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parentId)
    
    let productionTotal = 0
    let stagedTotal = 0

    if (type === 'DELIVERY') {
      // 1. Production: Sum of deliveries already in DB
      if (isUUID) {
        const { data: prodData } = await supabase
          .from('deliveries')
          .select('initial_count')
          .eq('sale_id', parentId)
          .eq('is_deleted', false)
        
        productionTotal = prodData?.reduce((acc, curr) => acc + (curr.initial_count || 0), 0) || 0
      }

      // 2. Staging: Sum of confirmed deliveries still in undo window
      const { data: stagedData } = await supabase
        .from('ai_staged_transactions')
        .select('payload')
        .eq('intent', 'CATAT_PENGIRIMAN')
        .eq('status', 'staged')
      
      stagedTotal = stagedData?.reduce((acc, curr) => {
        if (curr.payload?.sale_id === parentId) {
          // AI might extract as qty_ekor, map it to initial_count for consistency if needed, 
          // but here we check both for robustness
          return acc + (curr.payload?.initial_count || curr.payload?.qty_ekor || 0)
        }
        return acc
      }, 0) || 0
    }

    if (type === 'PAYMENT') {
      // 1. Production: Sum of payments already in DB
      if (isUUID) {
        const { data: prodData } = await supabase
          .from('payments')
          .select('amount')
          .eq('sale_id', parentId)
        
        productionTotal = prodData?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0
      }

      // 2. Staging: Sum of confirmed payments still in undo window
      if (isUUID) {
        const { data: stagedData } = await supabase
          .from('ai_staged_transactions')
          .select('payload')
          .eq('intent', 'CATAT_BAYAR')
          .eq('status', 'staged')
        
        stagedTotal = stagedData?.reduce((acc, curr) => {
          if (curr.payload?.sale_id === parentId) {
            return acc + Number(curr.payload?.amount || 0)
          }
          return acc
        }, 0) || 0
      }
    }

    return productionTotal + stagedTotal
  }

  /**
   * Fetches the parent entity itself to get its capacity/limit.
   */
  const getParentContext = async (parentId, intent) => {
    if (!parentId) return null

    // NEW: Guard against non-UUID (e.g. while drafting)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parentId)
    if (!isUUID) return null

    if (intent === 'CATAT_PENGIRIMAN' || intent === 'CATAT_BAYAR') {
      // Parent is SALE
      const { data } = await supabase.from('sales').select('*').eq('id', parentId).single()
      return data
    }

    // Add more types as needed (Purchases, etc)
    return null
  }

  return { getAccumulatedTotal, getParentContext }
}
