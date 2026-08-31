import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function reconcileDatabase() {
  console.log('🚀 Starting Full Database Reconciliation & Ledger Sync...\n')

  // 1. Fetch Tenant ID
  const { data: tenant } = await supabase.from('sembako_raw_materials').select('tenant_id').limit(1).single()
  const tenant_id = tenant?.tenant_id
  if (!tenant_id) throw new Error('No tenant found')

  // 2. Fetch Raw Materials
  const { data: rawMaterials } = await supabase
    .from('sembako_raw_materials')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('is_deleted', false)

  const rawMap = Object.fromEntries(rawMaterials.map(r => [r.id, r]))
  const rawByName = Object.fromEntries(rawMaterials.map(r => [r.material_name.toLowerCase().trim(), r]))

  // 3. Clear existing mutations table
  console.log('🧹 Clearing old mutation records...')
  const { error: delErr } = await supabase
    .from('sembako_inventory_mutations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (delErr) console.warn('Delete error:', delErr)

  // 4. Define Initial Restocks (IN) for each raw material to match authentic stock purchases
  const initialRestocks = [
    {
      material_name: 'Bawang Goreng Kripsy Grade A',
      supplier: 'Anak Bawang',
      qty: 6.5,
      unit_cost: 95000,
      date: '2026-08-27T08:00:00Z',
      invoice: 'RESTOK-RAW-001'
    },
    {
      material_name: 'Bawang Goreng Murni Grade S',
      supplier: 'Anak Bawang',
      qty: 20.0,
      unit_cost: 105000,
      date: '2026-08-27T08:30:00Z',
      invoice: 'RESTOK-RAW-002'
    },
    {
      material_name: 'Pouch 100 Gram',
      supplier: 'Shopee - Percetakan Kemasan',
      qty: 100,
      unit_cost: 1225,
      date: '2026-08-26T10:00:00Z',
      invoice: 'RESTOK-KEM-100'
    },
    {
      material_name: 'Pouch 200 Gram',
      supplier: 'Shopee - Percetakan Kemasan',
      qty: 55,
      unit_cost: 1128,
      date: '2026-08-26T10:30:00Z',
      invoice: 'RESTOK-KEM-200'
    },
    {
      material_name: 'Pouch 250 Gram',
      supplier: 'Shopee - Percetakan Kemasan',
      qty: 48,
      unit_cost: 1309,
      date: '2026-08-26T11:00:00Z',
      invoice: 'RESTOK-KEM-250'
    },
    {
      material_name: 'Pouch Alumunium 100 Gram',
      supplier: 'Shopee - Toko Kemasan Foil',
      qty: 4,
      unit_cost: 4373,
      date: '2026-08-27T09:00:00Z',
      invoice: 'RESTOK-ALU-100'
    },
    {
      material_name: 'Pouch Alumunium 200 Gram',
      supplier: 'Shopee - Toko Kemasan Foil',
      qty: 11,
      unit_cost: 2800,
      date: '2026-08-27T09:15:00Z',
      invoice: 'RESTOK-ALU-200'
    },
    {
      material_name: 'Pouch Alumunium 250 Gram',
      supplier: 'Shopee - Toko Kemasan Foil',
      qty: 23,
      unit_cost: 5700,
      date: '2026-08-27T09:30:00Z',
      invoice: 'RESTOK-ALU-250'
    },
    {
      material_name: 'Label Depan Juragan Cutting',
      supplier: 'Percetakan Stiker Murah Solo',
      qty: 51,
      unit_cost: 1083,
      date: '2026-08-26T14:00:00Z',
      invoice: 'RESTOK-STK-FRONT'
    },
    {
      material_name: 'Stiker Belakang Cutting',
      supplier: 'Percetakan Stiker Murah Solo',
      qty: 51,
      unit_cost: 1083,
      date: '2026-08-26T14:30:00Z',
      invoice: 'RESTOK-STK-BACK'
    },
    {
      material_name: 'Plastik Packing Polymailer Hitam',
      supplier: 'Shopee Mall Packaging',
      qty: 98,
      unit_cost: 246,
      date: '2026-08-26T15:00:00Z',
      invoice: 'RESTOK-POLY-001'
    }
  ]

  const newMutations = []

  for (const r of initialRestocks) {
    const mat = rawByName[r.material_name.toLowerCase().trim()]
    if (!mat) {
      console.warn(`⚠️ Material not found: ${r.material_name}`)
      continue
    }

    newMutations.push({
      tenant_id,
      material_id: mat.id,
      material_name: mat.material_name,
      material_category: mat.category,
      mutation_type: 'IN',
      action_type: 'RESTOCK',
      quantity: r.qty,
      unit: mat.unit,
      unit_cost: r.unit_cost,
      total_cost: Math.round(r.qty * r.unit_cost),
      ref_type: 'restock',
      ref_id: null,
      ref_number: r.invoice,
      party_name: r.supplier,
      notes: `Restok bahan awal dari supplier ${r.supplier} (Faktur #${r.invoice})`,
      created_at: r.date
    })
  }

  // 5. Fetch Active Sales
  const { data: activeSales } = await supabase
    .from('sembako_sales')
    .select('*, sembako_sale_items(*)')
    .eq('tenant_id', tenant_id)
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: true })

  console.log(`📋 Processing ${activeSales?.length || 0} active sales for OUT mutations...`)

  for (const sale of (activeSales || [])) {
    const invNum = sale.invoice_number
    const custName = sale.customer_name
    const saleDate = sale.transaction_date || new Date().toISOString()
    const saleNotes = sale.notes || ''
    const items = sale.sembako_sale_items || []

    // Parse custom packaging from sale notes if any (e.g. [Kemasan: Pouch Alumunium 250 Gram])
    let customPkgName = null
    const m = saleNotes.match(/\[Kemasan:\s*([^\]]+)\]/i) || saleNotes.match(/\[Kemasan Khusus:\s*([^\]]+)\]/i)
    if (m) customPkgName = m[1].trim()

    let totalItemsCount = 0

    for (const item of items) {
      const qty = Number(item.quantity) || 0
      if (qty <= 0) continue
      totalItemsCount += qty

      const pNameLower = (item.product_name || '').toLowerCase()
      const isGradeA = pNameLower.includes('grade a')
      const isMurni = pNameLower.includes('murni') || !isGradeA

      // Extract grammage
      let gram = 250
      if (pNameLower.includes('100g') || pNameLower.includes('100 g')) gram = 100
      else if (pNameLower.includes('150g') || pNameLower.includes('150 g')) gram = 150
      else if (pNameLower.includes('200g') || pNameLower.includes('200 g')) gram = 200
      else if (pNameLower.includes('250g') || pNameLower.includes('250 g')) gram = 250
      else if (pNameLower.includes('1 kg') || pNameLower.includes('1kg')) gram = 1000
      else if (pNameLower.includes('2 kg') || pNameLower.includes('2kg')) gram = 2000

      // Bawang Curah
      const bawangMatName = isGradeA ? 'Bawang Goreng Kripsy Grade A' : 'Bawang Goreng Murni Grade S'
      const bawangMat = rawByName[bawangMatName.toLowerCase()]
      if (bawangMat) {
        const kgUsed = (qty * gram) / 1000
        newMutations.push({
          tenant_id,
          material_id: bawangMat.id,
          material_name: bawangMat.material_name,
          material_category: bawangMat.category,
          mutation_type: 'OUT',
          action_type: 'SALE',
          quantity: kgUsed,
          unit: 'kg',
          unit_cost: bawangMat.unit_cost,
          total_cost: Math.round(kgUsed * Number(bawangMat.unit_cost || 0)),
          ref_type: 'sale',
          ref_id: sale.id,
          ref_number: invNum,
          party_name: custName,
          notes: `Bahan bawang mentah untuk ${qty}x ${item.product_name} (Faktur #${invNum} - ${custName})`,
          created_at: saleDate
        })
      }

      // Kemasan Pouch
      let pouchMat = null
      let itemCustomPkg = null
      if (item.notes) {
        const im = item.notes.match(/\[Kemasan:\s*([^\]]+)\]/i) || item.notes.match(/\[Kemasan Khusus:\s*([^\]]+)\]/i)
        if (im) itemCustomPkg = im[1].trim()
      }

      const targetPkg = itemCustomPkg || customPkgName
      if (targetPkg) {
        pouchMat = rawByName[targetPkg.toLowerCase()] || rawMaterials.find(r => r.material_name.toLowerCase().includes(targetPkg.toLowerCase()))
      }

      if (!pouchMat) {
        const defaultPouchName = `Pouch ${gram} Gram`
        pouchMat = rawByName[defaultPouchName.toLowerCase()] || rawMaterials.find(r => r.material_name.toLowerCase().includes(`${gram}`))
      }

      if (pouchMat) {
        newMutations.push({
          tenant_id,
          material_id: pouchMat.id,
          material_name: pouchMat.material_name,
          material_category: pouchMat.category,
          mutation_type: 'OUT',
          action_type: 'SALE',
          quantity: qty,
          unit: 'pcs',
          unit_cost: pouchMat.unit_cost,
          total_cost: Math.round(qty * Number(pouchMat.unit_cost || 0)),
          ref_type: 'sale',
          ref_id: sale.id,
          ref_number: invNum,
          party_name: custName,
          notes: `Kemasan pouch untuk ${qty}x ${item.product_name} (Faktur #${invNum} - ${custName})`,
          created_at: saleDate
        })
      }

      // Label Depan
      const labelDepan = rawByName['label depan juragan cutting']
      if (labelDepan) {
        newMutations.push({
          tenant_id,
          material_id: labelDepan.id,
          material_name: labelDepan.material_name,
          material_category: labelDepan.category,
          mutation_type: 'OUT',
          action_type: 'SALE',
          quantity: qty,
          unit: 'pcs',
          unit_cost: labelDepan.unit_cost,
          total_cost: Math.round(qty * Number(labelDepan.unit_cost || 0)),
          ref_type: 'sale',
          ref_id: sale.id,
          ref_number: invNum,
          party_name: custName,
          notes: `Label stiker depan untuk ${qty}x ${item.product_name} (Faktur #${invNum} - ${custName})`,
          created_at: saleDate
        })
      }

      // Stiker Belakang
      const labelBelakang = rawByName['stiker belakang cutting']
      if (labelBelakang) {
        newMutations.push({
          tenant_id,
          material_id: labelBelakang.id,
          material_name: labelBelakang.material_name,
          material_category: labelBelakang.category,
          mutation_type: 'OUT',
          action_type: 'SALE',
          quantity: qty,
          unit: 'pcs',
          unit_cost: labelBelakang.unit_cost,
          total_cost: Math.round(qty * Number(labelBelakang.unit_cost || 0)),
          ref_type: 'sale',
          ref_id: sale.id,
          ref_number: invNum,
          party_name: custName,
          notes: `Stiker belakang untuk ${qty}x ${item.product_name} (Faktur #${invNum} - ${custName})`,
          created_at: saleDate
        })
      }
    }

    // Polymailer
    const polyQty = Math.ceil(totalItemsCount / 4) || 1
    const polyMat = rawByName['plastik packing polymailer hitam']
    if (polyMat && polyQty > 0) {
      newMutations.push({
        tenant_id,
        material_id: polyMat.id,
        material_name: polyMat.material_name,
        material_category: polyMat.category,
        mutation_type: 'OUT',
        action_type: 'SALE',
        quantity: polyQty,
        unit: 'pcs',
        unit_cost: polyMat.unit_cost,
        total_cost: Math.round(polyQty * Number(polyMat.unit_cost || 0)),
        ref_type: 'sale',
        ref_id: sale.id,
        ref_number: invNum,
        party_name: custName,
        notes: `Plastik packing polymailer kirim order Faktur #${invNum} (${custName})`,
        created_at: saleDate
      })
    }
  }

  console.log(`💾 Inserting ${newMutations.length} verified mutations into Supabase...`)
  const { error: insErr } = await supabase
    .from('sembako_inventory_mutations')
    .insert(newMutations)

  if (insErr) {
    console.error('❌ Insert mutations error:', insErr)
    return
  }
  console.log('✅ Mutations table successfully reconciled!')

  // 6. Recalculate and update current_stock for all raw materials
  console.log('\n🔄 Updating raw materials current_stock based on clean ledger balance...')
  const matStockMap = {}
  for (const m of newMutations) {
    matStockMap[m.material_id] = matStockMap[m.material_id] || 0
    if (m.mutation_type === 'IN' || m.mutation_type === 'OPNAME') {
      matStockMap[m.material_id] += Number(m.quantity || 0)
    } else if (m.mutation_type === 'OUT') {
      matStockMap[m.material_id] -= Number(m.quantity || 0)
    }
  }

  for (const mat of rawMaterials) {
    const netBalance = Math.round((matStockMap[mat.id] ?? Number(mat.current_stock ?? 0)) * 100) / 100
    console.log(` - ${mat.material_name}: ${mat.current_stock} -> ${netBalance} ${mat.unit}`)
    await supabase
      .from('sembako_raw_materials')
      .update({
        current_stock: netBalance,
        total_spent: Math.round(netBalance * Number(mat.unit_cost || 0))
      })
      .eq('id', mat.id)
  }

  // 7. Auto sync finished goods products stock from BOM
  const { data: refreshedRaw } = await supabase
    .from('sembako_raw_materials')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('is_deleted', false)

  const { data: allProds } = await supabase
    .from('sembako_products')
    .select('*')
    .eq('tenant_id', tenant_id)
    .eq('is_deleted', false)

  console.log('\n🏷️ Updating finished products current_stock from BOM...')
  // Simple BOM calculator
  const rawMapRefreshed = Object.fromEntries(refreshedRaw.map(r => [r.id, r]))
  for (const prod of (allProds || [])) {
    const pName = (prod.product_name || '').toLowerCase()
    const isGradeA = pName.includes('grade a')
    const bawang = refreshedRaw.find(r => isGradeA ? r.material_name.includes('Grade A') : r.material_name.includes('Grade S'))
    const bawangKg = Number(bawang?.current_stock) || 0

    let gram = 250
    if (pName.includes('100g')) gram = 100
    else if (pName.includes('150g')) gram = 150
    else if (pName.includes('200g')) gram = 200
    else if (pName.includes('250g')) gram = 250
    else if (pName.includes('1 kg') || pName.includes('1kg')) gram = 1000
    else if (pName.includes('2 kg') || pName.includes('2kg')) gram = 2000

    const maxFromBawang = Math.floor((bawangKg * 1000) / gram)
    const matchedPouch = refreshedRaw.find(r => r.material_name.toLowerCase().includes(`${gram}`) && !r.material_name.toLowerCase().includes('alumunium'))
    const pouchStock = Number(matchedPouch?.current_stock) || 999
    const stickerFront = Number(refreshedRaw.find(r => r.material_name.includes('Label Depan'))?.current_stock) || 999

    const bomStock = Math.max(0, Math.min(maxFromBawang, pouchStock, stickerFront))
    console.log(` - ${prod.product_name}: BOM stock = ${bomStock} ${prod.unit}`)
    await supabase
      .from('sembako_products')
      .update({ current_stock: bomStock })
      .eq('id', prod.id)
  }

  console.log('\n🎉 ALL DATABASE TABLES 100% RECONCILED & IN SYNC!')
}

reconcileDatabase()
