import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runAudit() {
  console.log('=== Comprehensive Database Audit ===\n')

  // 1. Raw Materials
  const { data: rawMats, error: rawErr } = await supabase
    .from('sembako_raw_materials')
    .select('*')
    .eq('is_deleted', false)
    .order('category')

  console.log(`📦 RAW MATERIALS (${rawMats?.length || 0} items):`)
  for (const r of (rawMats || [])) {
    console.log(` - [${r.category}] ${r.material_name}: Stok ${r.current_stock} ${r.unit} | HPP: Rp ${r.unit_cost}`)
  }

  // 2. Sales
  const { data: sales, error: salesErr } = await supabase
    .from('sembako_sales')
    .select('id, invoice_number, customer_name, transaction_date, notes, is_deleted, sembako_sale_items(*)')
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: true })

  console.log(`\n🧾 ACTIVE SALES (${sales?.length || 0} invoices):`)
  for (const s of (sales || [])) {
    const itemsStr = (s.sembako_sale_items || []).map(i => `${i.product_name} (${i.quantity} ${i.unit})`).join(', ')
    console.log(` - #${s.invoice_number} | ${s.customer_name} | ${s.transaction_date} | ${itemsStr} | Notes: ${s.notes || '-'}`)
  }

  // 3. Mutations
  const { data: mutations, error: mutErr } = await supabase
    .from('sembako_inventory_mutations')
    .select('*')
    .order('created_at', { ascending: true })

  console.log(`\n📋 MUTATIONS LEDGER (${mutations?.length || 0} entries):`)
  const mutByMaterial = {}
  for (const m of (mutations || [])) {
    mutByMaterial[m.material_name] = mutByMaterial[m.material_name] || []
    mutByMaterial[m.material_name].push(m)
  }

  for (const [matName, list] of Object.entries(mutByMaterial)) {
    const inQty = list.filter(m => m.mutation_type === 'IN').reduce((s, m) => s + Number(m.quantity || 0), 0)
    const outQty = list.filter(m => m.mutation_type === 'OUT').reduce((s, m) => s + Number(m.quantity || 0), 0)
    const opname = list.filter(m => m.mutation_type === 'OPNAME').reduce((s, m) => s + Number(m.quantity || 0), 0)
    console.log(` - ${matName}: IN +${inQty}, OUT -${outQty}, OPNAME +${opname} => Net ${inQty - outQty + opname} (Ledger Count: ${list.length})`)
  }

  // 4. Finished Goods Products
  const { data: prods, error: prodErr } = await supabase
    .from('sembako_products')
    .select('id, product_name, current_stock, unit, sell_price, avg_buy_price')
    .eq('is_deleted', false)

  console.log(`\n🏷️ FINISHED PRODUCTS (${prods?.length || 0} products):`)
  for (const p of (prods || [])) {
    console.log(` - ${p.product_name}: Stok ${p.current_stock} ${p.unit} | Jual: Rp ${p.sell_price} | HPP: Rp ${p.avg_buy_price}`)
  }
}

runAudit()
