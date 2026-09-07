import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { toast } from 'sonner'
import { useAuth } from '../useAuth'
import { STALE_5M, STALE_1M, sanitizeDBPayload, getTenantId } from './sembakoCommon'
import { recordAuditLog } from '@/lib/hooks/useSembakoAudit'
import { recordInventoryMutation } from './sembakoMutations'

/**
 * 1. Mengambil Saldo Stok per Lokasi / Pemegang (Gudang Utama vs Pegawai/Reyhan)
 */
export const useSembakoStockCustody = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-stock-custody', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_1M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sembako_stock_custody')
          .select('*')
          .eq('tenant_id', tenant.id)

        if (error) {
          console.warn('[useSembakoStockCustody] Warning/Fallback:', error.message)
          // Fallback ke localStorage jika tabel belum dimigrasikan di DB
          try {
            const cached = localStorage.getItem(`juragan_stock_custody_${tenant.id}`)
            return cached ? JSON.parse(cached) : []
          } catch (_) {
            return []
          }
        }
        return data || []
      } catch (e) {
        console.warn('[useSembakoStockCustody] Exception:', e)
        return []
      }
    }
  })
}

/**
 * 2. Mengambil Riwayat Aktivitas Combine / Racik Kemasan
 */
export const useSembakoPackagingLogs = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-packaging-logs', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_1M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sembako_packaging_logs')
          .select('*')
          .eq('tenant_id', tenant.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.warn('[useSembakoPackagingLogs] Warning/Fallback:', error.message)
          try {
            const cached = localStorage.getItem(`juragan_packaging_logs_${tenant.id}`)
            return cached ? JSON.parse(cached) : []
          } catch (_) {
            return []
          }
        }
        return data || []
      } catch (e) {
        console.warn('[useSembakoPackagingLogs] Exception:', e)
        return []
      }
    }
  })
}

/**
 * 3. Mengambil Riwayat Serah Terima & Bawa Stok (Handover Log)
 */
export const useSembakoStockTransfers = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-stock-transfers', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_1M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('sembako_stock_transfers')
          .select('*')
          .eq('tenant_id', tenant.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.warn('[useSembakoStockTransfers] Warning/Fallback:', error.message)
          try {
            const cached = localStorage.getItem(`juragan_stock_transfers_${tenant.id}`)
            return cached ? JSON.parse(cached) : []
          } catch (_) {
            return []
          }
        }
        return data || []
      } catch (e) {
        console.warn('[useSembakoStockTransfers] Exception:', e)
        return []
      }
    }
  })
}

/**
 * Helper: Simpan atau update custody di tabel / localStorage
 */
async function syncCustodyRecord(tenantId, holderType, employeeId, productId, productName, newQty, unit) {
  // 1. Cari apakah row custody sudah ada
  let query = supabase
    .from('sembako_stock_custody')
    .select('id, quantity')
    .eq('tenant_id', tenantId)
    .eq('holder_type', holderType)
    .eq('product_id', productId)

  if (holderType === 'employee') {
    query = query.eq('employee_id', employeeId)
  } else {
    query = query.is('employee_id', null)
  }

  const { data: existing, error: fetchErr } = await query.maybeSingle()

  if (fetchErr) {
    console.error('[syncCustodyRecord] Gagal fetch custody row:', {
      error: fetchErr.message, holderType, productId, employeeId
    })
    throw new Error(`[syncCustodyRecord] Gagal fetch: ${fetchErr.message}`)
  }

  if (existing) {
    const { error: updateErr } = await supabase
      .from('sembako_stock_custody')
      .update({
        quantity: Math.max(0, Number(newQty)),
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)

    if (updateErr) {
      console.error('[syncCustodyRecord] Gagal update custody:', {
        error: updateErr.message, id: existing.id, newQty
      })
      throw new Error(`[syncCustodyRecord] Gagal update custody: ${updateErr.message}`)
    }
  } else {
    const { error: insertErr } = await supabase
      .from('sembako_stock_custody')
      .insert({
        tenant_id: tenantId,
        holder_type: holderType,
        employee_id: holderType === 'employee' ? employeeId : null,
        product_id: productId,
        product_name: productName,
        quantity: Math.max(0, Number(newQty)),
        unit: unit || 'pcs',
        updated_at: new Date().toISOString()
      })

    if (insertErr) {
      console.error('[syncCustodyRecord] Gagal insert custody baru:', {
        error: insertErr.message, holderType, productId, newQty
      })
      throw new Error(`[syncCustodyRecord] Gagal insert custody: ${insertErr.message}`)
    }
  }

  // Backup ke LocalStorage (non-fatal)
  try {
    const key = `juragan_stock_custody_${tenantId}`
    const raw = localStorage.getItem(key)
    let list = raw ? JSON.parse(raw) : []
    const idx = list.findIndex(c =>
      c.holder_type === holderType &&
      c.product_id === productId &&
      (holderType === 'employee' ? c.employee_id === employeeId : true)
    )
    if (idx >= 0) {
      list[idx].quantity = Math.max(0, Number(newQty))
      list[idx].updated_at = new Date().toISOString()
    } else {
      list.push({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tenant_id: tenantId,
        holder_type: holderType,
        employee_id: holderType === 'employee' ? employeeId : null,
        product_id: productId,
        product_name: productName,
        quantity: Math.max(0, Number(newQty)),
        unit: unit || 'pcs',
        updated_at: new Date().toISOString()
      })
    }
    localStorage.setItem(key, JSON.stringify(list))
  } catch (localErr) {
    console.warn('[syncCustodyRecord] localStorage backup gagal (non-fatal):', localErr.message)
  }
}

/**
 * 4. Engine Combine / Crafting Produk (Bahan Baku Mentah -> Produk Jadi di Gudang)
 */
export const useExecuteCombineProduct = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ product, output_qty, materials = [], notes = '' }) => {
      const tenantId = await getTenantId()
      const qtyToMake = Number(output_qty) || 0
      if (qtyToMake <= 0) throw new Error('Jumlah produk yang dibuat harus lebih dari 0')
      if (!product?.id) throw new Error('Produk target tidak valid')

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const randStr = Math.random().toString(36).slice(2, 6).toUpperCase()
      const packNumber = `COMBINE-${dateStr}-${randStr}`

      let totalCogsCalculated = 0
      const materialsDeductedSummary = []

      // 1. Potong setiap bahan baku yang dipakai dari sembako_raw_materials
      for (const mat of materials) {
        const deductQty = Number(mat.deduct_qty) || 0
        if (deductQty <= 0) {
          console.warn('[Combine] Melewati material karena deduct_qty = 0:', mat)
          continue
        }

        console.log('[Combine] Mencoba potong bahan:', {
          material_id: mat.material_id,
          material_name: mat.material_name,
          deduct_qty: deductQty
        })

        const { data: rawRow, error: fetchErr } = await supabase
          .from('sembako_raw_materials')
          .select('*')
          .eq('id', mat.material_id)
          .single()

        if (fetchErr || !rawRow) {
          console.error('[Combine] GAGAL fetch raw material! ID tidak ditemukan:', {
            material_id: mat.material_id,
            error: fetchErr?.message
          })
          throw new Error(`Bahan baku "${mat.material_name}" (ID: ${mat.material_id}) tidak ditemukan di database. Pastikan data bahan baku sudah benar.`)
        }

        const curStock = Number(rawRow.current_stock) || 0
        const unitCost = Number(rawRow.unit_cost) || 0
        const newStock = Math.max(0, curStock - deductQty)
        const lineCost = deductQty * unitCost
        totalCogsCalculated += lineCost

        console.log('[Combine] Memotong stok bahan:', {
          material_name: rawRow.material_name,
          current_stock: curStock,
          deduct_qty: deductQty,
          new_stock: newStock,
          unit: rawRow.unit
        })

        // Update stok bahan
        const { error: updateErr } = await supabase
          .from('sembako_raw_materials')
          .update({ current_stock: newStock })
          .eq('id', mat.material_id)

        if (updateErr) {
          console.error('[Combine] GAGAL update stok bahan:', {
            material_id: mat.material_id,
            error: updateErr.message
          })
          throw new Error(`Gagal memotong stok "${rawRow.material_name}": ${updateErr.message}`)
        }

        console.log('[Combine] Berhasil potong stok', rawRow.material_name, ':', curStock, '->', newStock, rawRow.unit)

        // Catat kartu mutasi inventaris
        await recordInventoryMutation({
          tenant_id: tenantId,
          material_id: mat.material_id,
          material_name: rawRow.material_name,
          material_category: rawRow.category,
          mutation_type: 'OUT',
          action_type: 'OPNAME',
          quantity: deductQty,
          unit: rawRow.unit || 'pcs',
          unit_cost: unitCost,
          total_cost: lineCost,
          prev_stock: curStock,
          new_stock: newStock,
          ref_type: 'combine',
          ref_number: packNumber,
          party_name: `Combine ${product.product_name}`,
          notes: `Digunakan untuk kemas ${qtyToMake} ${product.unit || 'pcs'} ${product.product_name}`,
          created_by: user?.email || 'Admin'
        })

        materialsDeductedSummary.push({
          material_id: mat.material_id,
          material_name: rawRow.material_name,
          qty: deductQty,
          unit: rawRow.unit || 'pcs',
          unit_cost: unitCost,
          total_cost: lineCost
        })
      }

      // Pastikan ada bahan yang berhasil dipotong
      if (materialsDeductedSummary.length === 0 && materials.length > 0) {
        console.error('[Combine] TIDAK ADA bahan yang berhasil dipotong! Materials payload:', materials)
        throw new Error('Tidak ada bahan baku yang berhasil dipotong. Periksa data materials payload.')
      }

      const cogsPerUnit = qtyToMake > 0 ? Math.round(totalCogsCalculated / qtyToMake) : 0

      // 2. Tambah stok produk jadi di Gudang Utama (sembako_products.current_stock)
      const { data: prodRow, error: prodFetchErr } = await supabase
        .from('sembako_products')
        .select('current_stock, avg_buy_price')
        .eq('id', product.id)
        .single()

      if (prodFetchErr) {
        console.error('[Combine] Gagal fetch data produk:', prodFetchErr.message)
        throw new Error(`Gagal membaca data produk: ${prodFetchErr.message}`)
      }

      const currentProdStock = Number(prodRow?.current_stock) || 0
      const newProdStock = currentProdStock + qtyToMake

      const { error: prodUpdateErr } = await supabase
        .from('sembako_products')
        .update({
          current_stock: newProdStock,
          avg_buy_price: cogsPerUnit > 0 ? cogsPerUnit : prodRow?.avg_buy_price || 0
        })
        .eq('id', product.id)

      if (prodUpdateErr) {
        console.error('[Combine] Gagal update stok produk:', prodUpdateErr.message)
        throw new Error(`Gagal menambah stok produk jadi: ${prodUpdateErr.message}`)
      }

      // 3. Sinkronkan saldo di sembako_stock_custody untuk Gudang Utama
      const { data: whCustody, error: whCustodyErr } = await supabase
        .from('sembako_stock_custody')
        .select('quantity')
        .eq('tenant_id', tenantId)
        .eq('holder_type', 'warehouse')
        .eq('product_id', product.id)
        .maybeSingle()

      if (whCustodyErr) {
        console.error('[Combine] Gagal fetch saldo custody gudang:', whCustodyErr.message)
        throw new Error(`Gagal membaca saldo custody gudang: ${whCustodyErr.message}`)
      }

      const curWhQty = Number(whCustody?.quantity || 0)
      const newWhQty = curWhQty + qtyToMake
      await syncCustodyRecord(tenantId, 'warehouse', null, product.id, product.product_name, newWhQty, product.unit)

      // 4. Catat ke sembako_packaging_logs
      try {
        await supabase
          .from('sembako_packaging_logs')
          .insert({
            tenant_id: tenantId,
            pack_number: packNumber,
            product_id: product.id,
            product_name: product.product_name,
            output_qty: qtyToMake,
            unit: product.unit || 'pcs',
            cogs_per_unit: cogsPerUnit,
            total_cogs: totalCogsCalculated,
            materials_deducted: materialsDeductedSummary,
            notes: notes || `Combine ${qtyToMake} ${product.unit || 'pcs'}`,
            created_by: user?.email || 'Admin',
            created_at: new Date().toISOString()
          })
      } catch (logErr) {
        console.warn('[useExecuteCombineProduct] Log warning:', logErr)
      }

      // Backup logs to localStorage
      try {
        const key = `juragan_packaging_logs_${tenantId}`
        const raw = localStorage.getItem(key)
        const list = raw ? JSON.parse(raw) : []
        list.unshift({
          id: `pack-${Date.now()}`,
          tenant_id: tenantId,
          pack_number: packNumber,
          product_id: product.id,
          product_name: product.product_name,
          output_qty: qtyToMake,
          unit: product.unit || 'pcs',
          cogs_per_unit: cogsPerUnit,
          total_cogs: totalCogsCalculated,
          materials_deducted: materialsDeductedSummary,
          notes: notes || `Combine ${qtyToMake} ${product.unit || 'pcs'}`,
          created_by: user?.email || 'Admin',
          created_at: new Date().toISOString()
        })
        localStorage.setItem(key, JSON.stringify(list.slice(0, 100)))
      } catch (localErr) {
        console.warn('[useExecuteCombineProduct] localStorage packaging log backup gagal (non-fatal):', localErr.message)
      }

      // 5. Catat ke audit log
      await recordAuditLog({
        table: 'sembako_products',
        record_id: product.id,
        operation: 'COMBINE',
        notes: `Berhasil meracik & mengemas ${qtyToMake} ${product.unit || 'pcs'} ${product.product_name} (#${packNumber})`,
        created_by: user?.email || 'Admin'
      })

      return {
        packNumber,
        output_qty: qtyToMake,
        product_name: product.product_name,
        new_stock: newProdStock
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-raw-materials'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-stock-custody'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-packaging-logs'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-inventory-mutations'] })
      toast.success(`🎉 Berhasil combine! +${res.output_qty} pcs ${res.product_name} masuk ke Gudang!`, {
        description: `Kode Batch: ${res.packNumber} · Total stok sekarang: ${res.new_stock} pcs`
      })
    },
    onError: (err) => {
      console.error('[useExecuteCombineProduct]', err)
      toast.error('Gagal melakukan combine produk', { description: err.message })
    }
  })
}

/**
 * 5. Mutasi Serah Terima & Bawa Stok Pegawai (Handover & Return)
 * - handover_to_staff: Gudang Utama -> Reyhan (Pegawai bawa keliling/kanvas)
 * - return_to_warehouse: Reyhan -> Gudang Utama (Kembalikan sisa belum laku)
 */
export const useTransferStockCustody = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      transfer_type,
      employee_id,
      employee_name,
      product_id,
      product_name,
      quantity,
      unit = 'pcs',
      notes = ''
    }) => {
      const tenantId = await getTenantId()
      const qty = Number(quantity) || 0
      if (qty <= 0) throw new Error('Jumlah barang yang diserahkan harus lebih dari 0')
      if (!product_id) throw new Error('Pilih produk yang valid')
      if (!employee_id) throw new Error('Pilih pegawai / staf penerima yang valid')

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const randStr = Math.random().toString(36).slice(2, 6).toUpperCase()
      const transferNumber = `TRF-${dateStr}-${randStr}`

      // Ambil saldo Gudang & saldo Pegawai saat ini
      const { data: whRow, error: whFetchErr } = await supabase
        .from('sembako_stock_custody')
        .select('quantity')
        .eq('tenant_id', tenantId)
        .eq('holder_type', 'warehouse')
        .eq('product_id', product_id)
        .maybeSingle()

      if (whFetchErr) {
        console.error('[useTransferStockCustody] Gagal fetch stok gudang:', whFetchErr.message)
        throw new Error(`Gagal membaca stok gudang: ${whFetchErr.message}`)
      }

      const { data: empRow, error: empFetchErr } = await supabase
        .from('sembako_stock_custody')
        .select('quantity')
        .eq('tenant_id', tenantId)
        .eq('holder_type', 'employee')
        .eq('employee_id', employee_id)
        .eq('product_id', product_id)
        .maybeSingle()

      if (empFetchErr) {
        console.error('[useTransferStockCustody] Gagal fetch stok pegawai:', empFetchErr.message)
        throw new Error(`Gagal membaca stok pegawai: ${empFetchErr.message}`)
      }

      // Fallback ke master sembako_products jika Gudang belum tercatat
      let curWhStock = whRow ? Number(whRow.quantity || 0) : 0
      if (!whRow) {
        const { data: prodData, error: prodFetchErr } = await supabase
          .from('sembako_products')
          .select('current_stock')
          .eq('id', product_id)
          .single()
        if (prodFetchErr) {
          console.error('[useTransferStockCustody] Gagal fetch produk fallback:', prodFetchErr.message)
          throw new Error(`Gagal membaca stok produk: ${prodFetchErr.message}`)
        }
        curWhStock = Number(prodData?.current_stock || 0)
      }

      const curEmpStock = Number(empRow?.quantity || 0)

      let newWhStock = curWhStock
      let newEmpStock = curEmpStock

      if (transfer_type === 'handover_to_staff') {
        // Gudang -> Pegawai
        if (curWhStock < qty) {
          throw new Error(`Stok di Gudang Utama tidak mencukupi! Tersedia: ${curWhStock} ${unit}, diminta: ${qty} ${unit}`)
        }
        newWhStock = curWhStock - qty
        newEmpStock = curEmpStock + qty
      } else if (transfer_type === 'return_to_warehouse') {
        // Pegawai -> Gudang
        if (curEmpStock < qty) {
          throw new Error(`Stok yang dibawa ${employee_name} kurang dari ${qty} ${unit}! Saat ini hanya membawa: ${curEmpStock} ${unit}`)
        }
        newWhStock = curWhStock + qty
        newEmpStock = curEmpStock - qty
      }

      // Update tabel custody
      await syncCustodyRecord(tenantId, 'warehouse', null, product_id, product_name, newWhStock, unit)
      await syncCustodyRecord(tenantId, 'employee', employee_id, product_id, product_name, newEmpStock, unit)

      // Sync physical warehouse stock in sembako_products
      const { error: prodSyncErr } = await supabase
        .from('sembako_products')
        .update({ current_stock: Math.max(0, newWhStock) })
        .eq('id', product_id)

      if (prodSyncErr) {
        console.error('[useTransferStockCustody] Gagal sync stok produk utama:', {
          error: prodSyncErr.message, product_id, newWhStock
        })
        // Non-fatal: custody sudah berhasil diupdate, produk sync adalah redundan
        console.warn('[useTransferStockCustody] Stok custody berhasil diupdate, tapi sync ke sembako_products gagal.')
      }

      // Catat ke sembako_stock_transfers
      const { error: trfErr } = await supabase
        .from('sembako_stock_transfers')
        .insert({
          tenant_id: tenantId,
          transfer_number: transferNumber,
          transfer_type,
          from_holder_type: transfer_type === 'handover_to_staff' ? 'warehouse' : 'employee',
          from_employee_id: transfer_type === 'handover_to_staff' ? null : employee_id,
          to_holder_type: transfer_type === 'handover_to_staff' ? 'employee' : 'warehouse',
          to_employee_id: transfer_type === 'handover_to_staff' ? employee_id : null,
          employee_name,
          product_id,
          product_name,
          quantity: qty,
          unit,
          notes: notes || (transfer_type === 'handover_to_staff' ? `Bawa kanvas oleh ${employee_name}` : `Pengembalian sisa bawaan oleh ${employee_name}`),
          created_by: user?.email || 'Admin',
          created_at: new Date().toISOString()
        })

      if (trfErr) {
        // Non-fatal: transaksi custody sudah berhasil, log transfer gagal bisa diabaikan
        console.error('[useTransferStockCustody] Gagal insert transfer log:', trfErr.message)
      }

      // Backup transfer log to localStorage (non-fatal)
      try {
        const key = `juragan_stock_transfers_${tenantId}`
        const raw = localStorage.getItem(key)
        const list = raw ? JSON.parse(raw) : []
        list.unshift({
          id: `trf-${Date.now()}`,
          tenant_id: tenantId,
          transfer_number: transferNumber,
          transfer_type,
          from_holder_type: transfer_type === 'handover_to_staff' ? 'warehouse' : 'employee',
          from_employee_id: transfer_type === 'handover_to_staff' ? null : employee_id,
          to_holder_type: transfer_type === 'handover_to_staff' ? 'employee' : 'warehouse',
          to_employee_id: transfer_type === 'handover_to_staff' ? employee_id : null,
          employee_name,
          product_id,
          product_name,
          quantity: qty,
          unit,
          notes,
          created_by: user?.email || 'Admin',
          created_at: new Date().toISOString()
        })
        localStorage.setItem(key, JSON.stringify(list.slice(0, 100)))
      } catch (localErr) {
        console.warn('[useTransferStockCustody] localStorage backup gagal (non-fatal):', localErr.message)
      }

      // Catat ke audit log
      await recordAuditLog({
        table: 'sembako_stock_custody',
        record_id: employee_id,
        operation: 'TRANSFER',
        notes: transfer_type === 'handover_to_staff'
          ? `Serah terima: ${qty} ${unit} ${product_name} dibawa oleh ${employee_name}`
          : `Pengembalian: ${qty} ${unit} ${product_name} dikembalikan oleh ${employee_name} ke Gudang`,
        created_by: user?.email || 'Admin'
      })

      return {
        transfer_type,
        employee_name,
        product_name,
        quantity: qty,
        unit,
        newEmpStock,
        newWhStock
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['sembako-stock-custody'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-stock-transfers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })

      if (res.transfer_type === 'handover_to_staff') {
        toast.success(`🚚 Berhasil serah terima! ${res.quantity} ${res.unit} ${res.product_name} sekarang dibawa oleh ${res.employee_name}!`, {
          description: `Sisa di Gudang: ${res.newWhStock} ${res.unit} · Total dipegang ${res.employee_name}: ${res.newEmpStock} ${res.unit}`
        })
      } else {
        toast.success(`↩️ Berhasil dikembalikan! ${res.quantity} ${res.unit} ${res.product_name} masuk kembali ke Gudang Utama!`, {
          description: `Total di Gudang: ${res.newWhStock} ${res.unit} · Sisa dipegang ${res.employee_name}: ${res.newEmpStock} ${res.unit}`
        })
      }
    },
    onError: (err) => {
      console.error('[useTransferStockCustody]', err)
      toast.error('Gagal memproses serah terima stok', { description: err.message })
    }
  })
}

/**
 * 6. Mengurangi Saldo Stok Pemegang (Gudang atau Pegawai Kanvas) saat Penjualan
 */
export async function deductCustodyStockOnSale({
  tenant_id,
  items = [],
  stock_source = 'warehouse',
  employee_id = null,
  invoice_number = ''
}) {
  if (!tenant_id || !Array.isArray(items) || items.length === 0) return

  for (const item of items) {
    if (!item.product_id) continue
    const qty = Number(item.quantity) || 0
    if (qty <= 0) continue

    const isEmployee = (stock_source === 'employee' && employee_id)
    const holderType = isEmployee ? 'employee' : 'warehouse'
    const empId = isEmployee ? employee_id : null

    try {
      let query = supabase
        .from('sembako_stock_custody')
        .select('quantity')
        .eq('tenant_id', tenant_id)
        .eq('holder_type', holderType)
        .eq('product_id', item.product_id)

      if (empId) {
        query = query.eq('employee_id', empId)
      }

      const { data: row, error: rowErr } = await query.maybeSingle()

      if (rowErr) {
        console.error('[deductCustodyStockOnSale] Gagal fetch stok custody:', {
          error: rowErr.message,
          product_id: item.product_id,
          holderType,
          invoice_number
        })
        // Tetap lanjut ke item berikutnya agar tidak block semua penjualan
        continue
      }

      const curStock = Number(row?.quantity || 0)
      const newStock = Math.max(0, curStock - qty)

      console.log('[deductCustodyStockOnSale] Memotong stok custody:', {
        product_name: item.product_name,
        holderType,
        curStock,
        qty,
        newStock,
        invoice_number
      })

      await syncCustodyRecord(
        tenant_id,
        holderType,
        empId,
        item.product_id,
        item.product_name || '',
        newStock,
        item.unit || 'pcs'
      )
    } catch (err) {
      console.error('[deductCustodyStockOnSale] Error untuk item:', {
        product_name: item.product_name,
        product_id: item.product_id,
        error: err.message,
        invoice_number
      })
    }
  }
}
