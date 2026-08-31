import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function reseedAndBackfill() {
  console.log('1. Clearing old initial mutations...')
  const { error: delErr } = await supabase
    .from('sembako_inventory_mutations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // delete all

  if (delErr) console.error('Delete error:', delErr)

  console.log('2. Fetching all raw materials...')
  const { data: rawMaterials } = await supabase
    .from('sembako_raw_materials')
    .select('*')
    .eq('is_deleted', false)

  console.log('3. Fetching all BOM_DEDUCT audit logs...')
  const { data: bomLogs } = await supabase
    .from('sembako_audit_logs')
    .select('*')
    .eq('action_type', 'BOM_DEDUCT')
    .order('created_at', { ascending: true })

  console.log(`Found ${bomLogs?.length || 0} BOM_DEDUCT logs`)

  // Group deductions by material name
  const deductionsByMaterial = {}
  for (const log of (bomLogs || [])) {
    const pName = (log.product_name || '').trim()
    if (!deductionsByMaterial[pName]) deductionsByMaterial[pName] = []

    // Parse deduct quantity from log.new_value (e.g. "95 pcs (-5 pcs)")
    let deductQty = 1
    const match = (log.new_value || '').match(/\(-([0-9.]+)\s*([a-zA-Z]+)?\)/)
    if (match) {
      deductQty = parseFloat(match[1]) || 1
    }

    // Parse invoice from notes (e.g. "Pemakaian bahan untuk penjualan #SMB-20260831-9292 (Kemasan Polymailer #SMB-20260831-9292)")
    let invoiceNo = ''
    const invMatch = (log.notes || '').match(/penjualan\s*#([A-Za-z0-9-]+)/i)
    if (invMatch) {
      invoiceNo = invMatch[1]
    }

    deductionsByMaterial[pName].push({
      logId: log.id,
      timestamp: log.created_at,
      deductQty,
      invoiceNo: invoiceNo || 'Sale',
      notes: log.notes || 'Pemakaian bahan penjualan',
      created_by: log.user_name || 'Kasir / Sistem'
    })
  }

  const mutationsToInsert = []

  // 4. Create INITIAL mutations with accurate initial quantity
  for (const mat of (rawMaterials || [])) {
    const pName = mat.material_name.trim()
    const deductions = deductionsByMaterial[pName] || []
    const totalDeducted = deductions.reduce((s, d) => s + d.deductQty, 0)

    const spentQty = (Number(mat.total_spent) > 0 && Number(mat.unit_cost) > 0)
      ? Math.round(Number(mat.total_spent) / Number(mat.unit_cost))
      : 0

    const initialQty = Math.max(
      Number(mat.current_stock || 0) + totalDeducted,
      spentQty,
      Number(mat.initial_stock || 0),
      Number(mat.current_stock || 0)
    )

    const initialCost = Number(mat.total_spent) || (initialQty * Number(mat.unit_cost || 0))

    // A. Add IN / INITIAL mutation
    mutationsToInsert.push({
      tenant_id: mat.tenant_id,
      material_id: mat.id,
      material_name: mat.material_name,
      material_category: mat.category,
      mutation_type: 'IN',
      action_type: 'INITIAL',
      quantity: initialQty,
      unit: mat.unit || 'pcs',
      unit_cost: Number(mat.unit_cost) || 0,
      total_cost: initialCost,
      prev_stock: 0,
      new_stock: initialQty,
      ref_type: 'registration',
      party_name: mat.supplier_name || 'Shopee / Supplier',
      notes: 'Saldo Awal / Pembelian Terdaftar Pertama Kali',
      created_by: 'Pendaftaran Item',
      created_at: mat.created_at || new Date().toISOString()
    })

    // B. Add OUT / SALE mutations for each deduction
    let runningStock = initialQty
    for (const ded of deductions) {
      const prevStk = runningStock
      runningStock = Math.max(0, runningStock - ded.deductQty)

      mutationsToInsert.push({
        tenant_id: mat.tenant_id,
        material_id: mat.id,
        material_name: mat.material_name,
        material_category: mat.category,
        mutation_type: 'OUT',
        action_type: 'SALE',
        quantity: ded.deductQty,
        unit: mat.unit || 'pcs',
        unit_cost: Number(mat.unit_cost) || 0,
        total_cost: ded.deductQty * Number(mat.unit_cost || 0),
        prev_stock: prevStk,
        new_stock: runningStock,
        ref_type: 'sale',
        ref_number: ded.invoiceNo,
        party_name: 'Penjualan',
        notes: ded.notes,
        created_by: ded.created_by,
        created_at: ded.timestamp || new Date().toISOString()
      })
    }
  }

  // 5. Also insert OPNAME / ADJUST audit logs
  const { data: opnameLogs } = await supabase
    .from('sembako_audit_logs')
    .select('*')
    .eq('action_type', 'ADJUST_BAHAN')

  for (const opLog of (opnameLogs || [])) {
    const mat = (rawMaterials || []).find(r => r.material_name === opLog.product_name)
    let meta = {}
    try {
      meta = JSON.parse(opLog.notes)
    } catch {
      // ignore
    }

    const delta = meta.delta_qty !== undefined ? Number(meta.delta_qty) : 0
    if (mat && delta !== 0) {
      mutationsToInsert.push({
        tenant_id: mat.tenant_id,
        material_id: mat.id,
        material_name: mat.material_name,
        material_category: mat.category,
        mutation_type: 'ADJUST',
        action_type: 'OPNAME',
        quantity: delta,
        unit: mat.unit || 'pcs',
        unit_cost: Number(mat.unit_cost) || 0,
        total_cost: Math.abs(delta) * Number(mat.unit_cost || 0),
        prev_stock: meta.prev_stock || 0,
        new_stock: meta.new_stock || 0,
        ref_type: 'opname',
        party_name: 'Opname Gudang',
        notes: meta.reason || 'Penyesuaian stok opname fisik',
        created_by: opLog.user_name || 'Admin',
        created_at: opLog.created_at || new Date().toISOString()
      })
    }
  }

  console.log(`Inserting ${mutationsToInsert.length} total mutations to Supabase...`)
  const { data: inserted, error: insErr } = await supabase
    .from('sembako_inventory_mutations')
    .insert(mutationsToInsert)
    .select()

  if (insErr) {
    console.error('Insert error:', insErr)
  } else {
    console.log(`Successfully backfilled ${inserted?.length} mutations in sembako_inventory_mutations!`)
  }
}

reseedAndBackfill()
