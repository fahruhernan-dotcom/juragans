import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { logError } from '@/lib/logger/errorLogger'
import { recordAuditLog } from '@/lib/hooks/useSembakoAudit'
import { STALE_5M, sanitizeDBPayload, getTenantId } from './sembakoCommon'

export const useSembakoReturns = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-returns', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        let { data, error } = await supabase.from('sembako_returns')
          .select(`*, sembako_products(id, product_name, unit, current_stock)`)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })

        if (error) {
          const fallback = await supabase.from('sembako_returns')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
          if (fallback.error) throw fallback.error
          data = fallback.data
        }
        return data || []
      } catch (e) {
        console.warn('[useSembakoReturns]', e)
        const saved = localStorage.getItem('erp_retur_list')
        return saved ? JSON.parse(saved) : []
      }
    }
  })
}

export const useCreateSembakoReturn = () => {
  const qc = useQueryClient()
  const { tenant, user } = useAuth()

  return useMutation({
    mutationFn: async (payload) => {
      const tenantId = tenant?.id || (await getTenantId())
      const {
        return_type,
        party_name,
        product_id,
        product_name,
        customer_id,
        supplier_id,
        sale_id,
        quantity,
        unit,
        unit_price,
        total_amount,
        reason,
        action,
        notes
      } = payload

      const returnNumber = `RET-${Date.now().toString().slice(-6)}`

      // 1. Try DB insert into sembako_returns
      let returnData = null
      try {
        const cleanPayload = sanitizeDBPayload({
          tenant_id: tenantId,
          created_by: user?.id || null,
          return_number: returnNumber,
          return_type: return_type || 'sale_return',
          party_name: party_name || '',
          product_id: product_id || null,
          product_name: product_name || '',
          customer_id: customer_id || null,
          supplier_id: supplier_id || null,
          sale_id: sale_id || null,
          quantity: Number(quantity || 1),
          unit: unit || 'pcs',
          unit_price: Number(unit_price || 0),
          total_amount: Number(total_amount || 0),
          reason: reason || 'Lainnya',
          action: action || 'fifo_stock',
          status: 'pending',
          notes: notes || '',
        }, 'sembako_returns')

        const { data, error } = await supabase.from('sembako_returns').insert(cleanPayload).select().single()

        if (!error && data) {
          returnData = data
        }
      } catch (e) {
        console.warn('[useCreateSembakoReturn] DB Insert warning:', e)
      }

      // 2. Perform FIFO Stock adjustment if action is 'fifo_stock'
      if (product_id && action === 'fifo_stock') {
        try {
          const { data: prod } = await supabase.from('sembako_products').select('current_stock').eq('id', product_id).single()
          if (prod) {
            const qty = Number(quantity || 0)
            const newStock = return_type === 'sale_return'
              ? (prod.current_stock || 0) + qty  // Retur dari toko -> stok bertambah
              : Math.max(0, (prod.current_stock || 0) - qty) // Retur ke pabrik -> stok berkurang

            await supabase.from('sembako_products').update({ current_stock: newStock }).eq('id', product_id)

            // Add batch entry for FIFO if sale return
            if (return_type === 'sale_return' && qty > 0) {
              let returnedToOriginalBatches = false

              if (sale_id) {
                // 1. Fetch stock out records for this sale & product (FIFO order)
                const { data: stockOuts, error: outErr } = await supabase
                  .from('sembako_stock_out')
                  .select('batch_id, qty_keluar')
                  .eq('sale_id', sale_id)
                  .eq('product_id', product_id)
                  .eq('is_deleted', false)
                  .order('created_at', { ascending: true })

                // 2. Fetch all other returns for this sale & product (excluding this one)
                const { data: existingReturns } = await supabase
                  .from('sembako_returns')
                  .select('quantity')
                  .eq('sale_id', sale_id)
                  .eq('product_id', product_id)
                  .eq('is_deleted', false)

                if (!outErr && stockOuts && stockOuts.length > 0) {
                  const totalAlreadyReturned = (existingReturns || []).reduce((sum, r) => sum + Number(r.quantity || 0), 0)
                  let remainingAlreadyReturned = totalAlreadyReturned
                  let remainingToReturn = qty

                  for (const out of stockOuts) {
                    if (remainingToReturn <= 0) break
                    const soldQty = Number(out.qty_keluar || 0)
                    if (soldQty <= 0) continue

                    // How much of the previous returns belong to this stock out?
                    const prevReturnedForThisOut = Math.min(soldQty, remainingAlreadyReturned)
                    remainingAlreadyReturned -= prevReturnedForThisOut

                    // How much of the cumulative (prev + current) returns belong to this stock out?
                    const maxCumulativeReturn = soldQty
                    const cumulativeReturnedForThisOut = Math.min(maxCumulativeReturn, prevReturnedForThisOut + remainingToReturn)
                    const deltaToReturn = cumulativeReturnedForThisOut - prevReturnedForThisOut

                    if (deltaToReturn > 0) {
                      const { data: batch } = await supabase
                        .from('sembako_stock_batches')
                        .select('qty_sisa')
                        .eq('id', out.batch_id)
                        .single()

                      if (batch) {
                        await supabase
                          .from('sembako_stock_batches')
                          .update({ qty_sisa: (batch.qty_sisa || 0) + deltaToReturn })
                          .eq('id', out.batch_id)
                      }

                      remainingToReturn -= deltaToReturn
                      returnedToOriginalBatches = true
                    }
                  }

                  // If there is still leftover return qty (excess of sold qty)
                  if (remainingToReturn > 0) {
                    const generatedBatchCode = `BTC-RET-${returnNumber}-EXCESS`
                    const batchPayload = {
                      tenant_id: tenantId,
                      product_id: product_id,
                      batch_code: generatedBatchCode,
                      qty_masuk: remainingToReturn,
                      qty_awal: remainingToReturn,
                      qty_sisa: remainingToReturn,
                      buy_price: Number(unit_price || 0),
                      total_cost: remainingToReturn * Number(unit_price || 0),
                      notes: `Retur Penjualan (${party_name}) - Sisa/Kelebihan FIFO Reversal`,
                    }
                    const cleanPayload = sanitizeDBPayload(batchPayload, 'sembako_stock_batches')
                    await supabase.from('sembako_stock_batches').insert(cleanPayload)
                  }
                }
              }

              if (!returnedToOriginalBatches) {
                // Fallback: create a custom batch for the return
                const generatedBatchCode = `BTC-RET-${returnNumber}`
                const batchPayload = {
                  tenant_id: tenantId,
                  product_id: product_id,
                  batch_code: generatedBatchCode,
                  qty_masuk: qty,
                  qty_awal: qty,
                  qty_sisa: qty,
                  buy_price: Number(unit_price || 0),
                  total_cost: qty * Number(unit_price || 0),
                  notes: `Retur Penjualan (${party_name}) - FIFO Reversal (Fallback)`,
                }
                const cleanPayload = sanitizeDBPayload(batchPayload, 'sembako_stock_batches')
                await supabase.from('sembako_stock_batches').insert(cleanPayload)
              }
            }
          }
        } catch (stkErr) {
          console.warn('[useCreateSembakoReturn] Stock adjustment warning:', stkErr)
        }
      }

      // 3. Automatic Piutang Deduction (Potong Piutang Toko -> Auto Mark Lunas)
      const financialAction = payload.financial_action || 'potong_piutang'
      if (return_type === 'sale_return' && financialAction === 'potong_piutang' && total_amount > 0) {
        try {
          // Find unpaid sales specifically for this customer/party
          let unpaidSalesQuery = supabase.from('sembako_sales')
            .select('id, remaining_amount, paid_amount, total_amount, invoice_number, customer_id, customer_name')
            .eq('tenant_id', tenantId)
            .eq('is_deleted', false)
            .neq('payment_status', 'lunas')

          if (customer_id) {
            unpaidSalesQuery = unpaidSalesQuery.eq('customer_id', customer_id)
          } else if (party_name && party_name.trim()) {
            unpaidSalesQuery = unpaidSalesQuery.eq('customer_name', party_name.trim())
          } else {
            unpaidSalesQuery = null
          }

          const { data: unpaidSales } = unpaidSalesQuery ? await unpaidSalesQuery.order('transaction_date', { ascending: true }) : { data: [] }

          let remainingCredit = Number(total_amount)

          if (unpaidSales && unpaidSales.length > 0) {
            for (const sale of unpaidSales) {
              if (remainingCredit <= 0) break
              const curRem = Number(sale.remaining_amount || 0)
              if (curRem <= 0) continue

              const deduct = Math.min(curRem, remainingCredit)
              const newRem = curRem - deduct
              const newPaid = Number(sale.paid_amount || 0) + deduct
              const newStatus = newRem <= 0 ? 'lunas' : 'sebagian'

              await supabase.from('sembako_sales').update({
                remaining_amount: newRem,
                paid_amount: newPaid,
                payment_status: newStatus,
              }).eq('id', sale.id)

              // Record payment entry
              await supabase.from('sembako_payments').insert({
                tenant_id: tenantId,
                sale_id: sale.id,
                customer_id: customer_id || sale.customer_id || null,
                amount: deduct,
                amount_paid: deduct,
                payment_method: 'potong_piutang_retur',
                notes: `Potong Piutang Retur ${returnNumber} (${product_name})`,
              })

              remainingCredit -= deduct
            }
          }
        } catch (piutangErr) {
          console.warn('[useCreateSembakoReturn] Piutang deduction warning:', piutangErr)
        }
      }

      // 4. If financial_action is 'none' (retur dari nota lunas), sync overpay state on sembako_sales
      if (return_type === 'sale_return' && financialAction === 'none' && sale_id && total_amount > 0) {
        try {
          const { data: saleRow } = await supabase
            .from('sembako_sales')
            .select('total_amount, paid_amount, remaining_amount')
            .eq('id', sale_id)
            .single()

          if (saleRow) {
            // Fetch ALL active returns for this sale after insert
            const { data: allReturns } = await supabase
              .from('sembako_returns')
              .select('total_amount')
              .eq('sale_id', sale_id)
              .eq('is_deleted', false)

            const allReturnTotal = (allReturns || []).reduce((s, r) => s + Number(r.total_amount || 0), 0)
            const grossTotal = Number(saleRow.total_amount || 0)
            const netTotal = Math.max(0, grossTotal - allReturnTotal)
            const paidAmt = Number(saleRow.paid_amount || 0)
            const isOvpd = paidAmt > netTotal
            const ovpdAmt = isOvpd ? (paidAmt - netTotal) : 0
            const newRemaining = isOvpd ? 0 : Math.max(0, netTotal - paidAmt)
            const newStatus = newRemaining <= 0 ? 'lunas' : (paidAmt > 0 ? 'sebagian' : 'belum_lunas')

            await supabase.from('sembako_sales').update({
              is_overpaid: isOvpd,
              overpay_amount: ovpdAmt,
              remaining_amount: newRemaining,
              payment_status: newStatus,
            }).eq('id', sale_id)
          }
        } catch (overpayErr) {
          console.warn('[useCreateSembakoReturn] Overpay sync warning:', overpayErr)
        }
      }

      // 5. Always maintain localStorage sync for instant reactivity
      const saved = localStorage.getItem('erp_retur_list')
      const currentList = saved ? JSON.parse(saved) : []
      const localEntry = returnData || {
        id: returnNumber,
        date: new Date().toISOString().split('T')[0],
        type: return_type,
        party_name,
        product_name,
        quantity: Number(quantity),
        unit,
        amount: Number(total_amount),
        reason,
        action,
        status: 'pending',
        notes
      }
      localStorage.setItem('erp_retur_list', JSON.stringify([localEntry, ...currentList]))

      // 4. Record Audit Log for Retur Creation
      try {
        await recordAuditLog({
          action_type: 'RETUR_MASUK',
          product_name: product_name || 'Produk',
          old_value: '0',
          new_value: `+${quantity} ${unit}`,
          notes: `Retur produk (${party_name}) - ${reason || 'Klaim'} - Rp ${total_amount}`,
          tenant_id: tenantId,
        })
      } catch (logErr) {
        console.warn('[useCreateSembakoReturn] Audit log warning:', logErr)
      }

      return localEntry
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sembako-sales'] })
      qc.invalidateQueries({ queryKey: ['sembako-returns'] })
      qc.invalidateQueries({ queryKey: ['sembako-products'] })
      qc.invalidateQueries({ queryKey: ['sembako-customers'] })
      qc.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      qc.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      qc.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      qc.invalidateQueries({ queryKey: ['sembako-laporan'] })
      qc.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      toast.success('Retur produk berhasil dicatat!')
    },
    onError: (err) => {
      toast.error(err.message || 'Gagal menginput retur')
    }
  })
}

export const useUpdateSembakoReturnStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => {
      try {
        await supabase.from('sembako_returns').update({ status }).eq('id', id)
      } catch (e) {
        // ignore
      }
      // Update local storage
      const saved = localStorage.getItem('erp_retur_list')
      if (saved) {
        const list = JSON.parse(saved)
        const updated = list.map(r => r.id === id ? { ...r, status } : r)
        localStorage.setItem('erp_retur_list', JSON.stringify(updated))
      }

      // Record Audit Log
      try {
        await recordAuditLog({
          action_type: 'RETUR_STATUS',
          product_name: 'Retur Produk',
          old_value: 'pending',
          new_value: status,
          notes: `Update status retur ${id} -> ${status}`,
        })
      } catch (logErr) {
        console.warn('[useUpdateSembakoReturnStatus] Audit log warning:', logErr)
      }

      return { id, status }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sembako-sales'] })
      qc.invalidateQueries({ queryKey: ['sembako-returns'] })
      qc.invalidateQueries({ queryKey: ['sembako-products'] })
      qc.invalidateQueries({ queryKey: ['sembako-customers'] })
      qc.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      qc.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      qc.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      qc.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
    }
  })
}

export const useDeleteSembakoReturn = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (returnObj) => {
      const id = typeof returnObj === 'object' ? returnObj.id : returnObj

      // 1. Mark is_deleted in DB
      try {
        await supabase.from('sembako_returns').update({ is_deleted: true, status: 'cancelled' }).eq('id', id)
      } catch (e) {
        console.warn('[useDeleteSembakoReturn] DB update error', e)
      }

      if (typeof returnObj === 'object') {
        const retAmount = Number(returnObj.total_amount || returnObj.amount || 0)

        // 2. Reverse Stock Adjustment (Product & Batch level)
        if (returnObj.product_id && returnObj.action === 'fifo_stock') {
          try {
            const qty = Number(returnObj.quantity || 0)
            const rType = returnObj.return_type || returnObj.type
            const saleId = returnObj.sale_id
            const returnNumber = returnObj.return_number || id

            // A. Product stock reversal
            const { data: prod } = await supabase.from('sembako_products').select('current_stock').eq('id', returnObj.product_id).single()
            if (prod) {
              const restoredStock = rType === 'sale_return'
                ? Math.max(0, (prod.current_stock || 0) - qty)
                : (prod.current_stock || 0) + qty
              await supabase.from('sembako_products').update({ current_stock: restoredStock }).eq('id', returnObj.product_id)
            }

            // B. Batch stock reversal
            if (rType === 'sale_return') {
              if (saleId) {
                // Fetch stock outs
                const { data: stockOuts } = await supabase
                  .from('sembako_stock_out')
                  .select('batch_id, qty_keluar')
                  .eq('sale_id', saleId)
                  .eq('product_id', returnObj.product_id)
                  .eq('is_deleted', false)
                  .order('created_at', { ascending: true })

                // Fetch other returns excluding this one
                const { data: otherReturns } = await supabase
                  .from('sembako_returns')
                  .select('quantity')
                  .eq('sale_id', saleId)
                  .eq('product_id', returnObj.product_id)
                  .eq('is_deleted', false)
                  .neq('id', id)

                if (stockOuts && stockOuts.length > 0) {
                  const totalWithoutCurrent = (otherReturns || []).reduce((sum, r) => sum + Number(r.quantity || 0), 0)
                  const totalWithCurrent = totalWithoutCurrent + qty
                  let remWithout = totalWithoutCurrent
                  let remWith = totalWithCurrent

                  for (const out of stockOuts) {
                    const soldQty = Number(out.qty_keluar || 0)
                    if (soldQty <= 0) continue

                    const prevReturnedForThisOut = Math.min(soldQty, remWithout)
                    remWithout -= prevReturnedForThisOut

                    const cumulativeReturnedForThisOut = Math.min(soldQty, remWith)
                    remWith -= cumulativeReturnedForThisOut

                    const deltaToSubtract = cumulativeReturnedForThisOut - prevReturnedForThisOut

                    if (deltaToSubtract > 0) {
                      const { data: batch } = await supabase
                        .from('sembako_stock_batches')
                        .select('qty_sisa')
                        .eq('id', out.batch_id)
                        .single()

                      if (batch) {
                        await supabase
                          .from('sembako_stock_batches')
                          .update({ qty_sisa: Math.max(0, (batch.qty_sisa || 0) - deltaToSubtract) })
                          .eq('id', out.batch_id)
                      }
                    }
                  }
                }
              }

              // Also check and clean up any fallback batches created with this return number
              const { data: fallbackBatches } = await supabase
                .from('sembako_stock_batches')
                .select('id, qty_sisa')
                .ilike('batch_code', `%${returnNumber}%`)
                .eq('is_deleted', false)

              if (fallbackBatches && fallbackBatches.length > 0) {
                for (const fb of fallbackBatches) {
                  await supabase
                    .from('sembako_stock_batches')
                    .update({ qty_sisa: 0, is_deleted: true })
                    .eq('id', fb.id)
                }
              }
            }
          } catch (stkErr) {
            console.warn('[useDeleteSembakoReturn] Stock reversal warning:', stkErr)
          }
        }

        // 3. Reverse Sale Transaction / Piutang (Update Saldo Invoice Otomatis)
        if (returnObj.sale_id && retAmount > 0) {
          try {
            const { data: sale } = await supabase.from('sembako_sales').select('id, total_amount, paid_amount, remaining_amount').eq('id', returnObj.sale_id).single()
            if (sale) {
              const curPaid = Number(sale.paid_amount || 0)
              const curRem = Number(sale.remaining_amount || 0)
              const totAmount = Number(sale.total_amount || 0)

              const newPaid = Math.max(0, curPaid - retAmount)
              const newRem = Math.min(totAmount, curRem + retAmount)
              const newStatus = newRem <= 0 ? 'lunas' : (newPaid > 0 ? 'sebagian' : 'belum_lunas')

              await supabase.from('sembako_sales').update({
                paid_amount: newPaid,
                remaining_amount: newRem,
                payment_status: newStatus,
              }).eq('id', sale.id)
            }

            // Soft-delete payment entries linked to this return
            const retNum = returnObj.return_number || id
            await supabase.from('sembako_payments')
              .update({ is_deleted: true })
              .eq('sale_id', returnObj.sale_id)
              .ilike('notes', `%${retNum}%`)
          } catch (saleErr) {
            console.warn('[useDeleteSembakoReturn] Sale transaction reversal warning:', saleErr)
          }
        }
      }

      // 4. Update Local Storage
      const saved = localStorage.getItem('erp_retur_list')
      if (saved) {
        const list = JSON.parse(saved)
        const filtered = list.filter(r => r.id !== id)
        localStorage.setItem('erp_retur_list', JSON.stringify(filtered))
      }

      // 5. Record Audit Log for Retur Cancellation
      try {
        await recordAuditLog({
          action_type: 'RETUR_BATAL',
          product_name: typeof returnObj === 'object' ? returnObj.product_name : 'Produk',
          old_value: typeof returnObj === 'object' ? `${returnObj.quantity} ${returnObj.unit}` : '1',
          new_value: '0 (Dibatalkan)',
          notes: `Pembatalan retur produk (${typeof returnObj === 'object' ? returnObj.party_name : id})`,
        })
      } catch (logErr) {
        console.warn('[useDeleteSembakoReturn] Audit log warning:', logErr)
      }

      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sembako-returns'] })
      qc.invalidateQueries({ queryKey: ['sembako-products'] })
      qc.invalidateQueries({ queryKey: ['sembako-sales'] })
      qc.invalidateQueries({ queryKey: ['sembako-customers'] })
      qc.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      qc.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      qc.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      toast.success('Retur barang berhasil dibatalkan & transaksi diperbarui!')
    },
    onError: (err) => {
      toast.error(err.message || 'Gagal membatalkan retur')
    }
  })
}

export const useVoidSembakoSaleReturn = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sale_id, items }) => {
      // 1. Reverse stock: kembalikan qty ke batch masing-masing (FIFO Reversal)
      for (const item of items) {
        if (!item.batch_id) continue
        const { data: batch } = await supabase
          .from('sembako_stock_batches')
          .select('qty_sisa')
          .eq('id', item.batch_id)
          .single()

        if (batch) {
          await supabase.from('sembako_stock_batches')
            .update({ qty_sisa: (batch.qty_sisa || 0) + item.quantity })
            .eq('id', item.batch_id)
        }
      }

      // 2. Hapus stock_out records terkait sale ini
      //    (mencegah ghost movements di Kartu Stok & Riwayat Keluar)
      const { error: stockOutErr } = await supabase
        .from('sembako_stock_out')
        .delete()
        .eq('sale_id', sale_id)
      if (stockOutErr) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.return.stock_out_cleanup',
          error: stockOutErr,
          metadata: { table: 'sembako_stock_out', operation: 'delete', partial: true, step: 'stock_out_delete', sale_id },
        })
        throw stockOutErr
      }

      // 3. Hapus payment records terkait sale ini
      //    (mencegah orphan payments setelah retur)
      const { error: payErr } = await supabase
        .from('sembako_payments')
        .delete()
        .eq('sale_id', sale_id)
      if (payErr) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.return.payments_cleanup',
          error: payErr,
          metadata: { table: 'sembako_payments', operation: 'delete', partial: true, step: 'payments_delete', sale_id },
        })
        throw payErr
      }

      // 4. Soft delete: beri catatan retur di sales header
      const { error } = await supabase
        .from('sembako_sales')
        .update({
          is_deleted: true,
          notes: `[RETUR ${new Date().toLocaleDateString('id-ID')}] Barang dikembalikan & stok dipulihkan.`
        })
        .eq('id', sale_id)

      if (error) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.return.header',
          error,
          metadata: { table: 'sembako_sales', operation: 'update', partial: true, step: 'sale_soft_delete', sale_id },
        })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-stock-out'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-payments'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      toast.success('Nota Berhasil di-Retur')
    },
    onError: (err) => toast.error('Gagal proses retur: ' + normalizeSupabaseError(err).message),
  })
}

export const useVoidSembakoReturnsBySale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ saleId, invoiceNumber }) => {
      // 1. Soft delete all sembako_returns for this sale
      if (saleId) {
        await supabase.from('sembako_returns').update({ is_deleted: true }).eq('sale_id', saleId)
      }
      if (invoiceNumber) {
        await supabase.from('sembako_returns').update({ is_deleted: true }).eq('invoice_number', invoiceNumber)
      }

      // 2. Clean refund payments for this sale in sembako_payments
      if (saleId) {
        await supabase
          .from('sembako_payments')
          .delete()
          .eq('sale_id', saleId)
          .eq('payment_method', 'pengembalian_tunai_retur')
      }

      // 3. Clean up localStorage
      try {
        const saved = localStorage.getItem('erp_retur_list')
        if (saved) {
          const list = JSON.parse(saved)
          const filtered = list.filter(r =>
            (!saleId || (r.sale_id !== saleId && String(r.sale_id) !== String(saleId))) &&
            (!invoiceNumber || r.invoice_number !== invoiceNumber)
          )
          localStorage.setItem('erp_retur_list', JSON.stringify(filtered))
        }
      } catch (e) { }

      return { saleId }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sembako-sales'] })
      qc.invalidateQueries({ queryKey: ['sembako-returns'] })
      qc.invalidateQueries({ queryKey: ['sembako-products'] })
      qc.invalidateQueries({ queryKey: ['sembako-customers'] })
      qc.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      qc.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      qc.invalidateQueries({ queryKey: ['sembako-laporan'] })
      qc.invalidateQueries({ queryKey: ['sembako-audit-logs'] })
      toast.success('Retur & refund berhasil dibatalkan. Transaksi dipulihkan!')
    },
    onError: (err) => {
      toast.error(err.message || 'Gagal membatalkan retur')
    }
  })
}
