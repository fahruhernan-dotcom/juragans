import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspect() {
  console.log('Fetching raw materials...')
  const { data: raw, error: rawErr } = await supabase
    .from('sembako_raw_materials')
    .select('*')
    .eq('is_deleted', false)

  if (rawErr) console.error('Raw err:', rawErr)
  console.log('Raw Materials count:', raw?.length)
  raw?.forEach(r => {
    console.log(`[${r.id}] Name: "${r.material_name}", Cat: "${r.category}", Stock: ${r.current_stock}, UnitCost: ${r.unit_cost}, Spent: ${r.total_spent}, Supplier: "${r.supplier_name}"`)
  })

  console.log('\nFetching sales...')
  const { data: sales, error: salesErr } = await supabase
    .from('sembako_sales')
    .select('id, invoice_number, transaction_date, is_deleted, packing_details')
    .eq('is_deleted', false)

  console.log('Sales count:', sales?.length)
  sales?.forEach(s => {
    console.log(`Sale [${s.id}] Invoice: "${s.invoice_number}", Packing:`, JSON.stringify(s.packing_details))
  })

  console.log('\nFetching sale items...')
  const { data: saleItems, error: itemsErr } = await supabase
    .from('sembako_sale_items')
    .select('id, sale_id, product_id, product_name, quantity, use_custom_packaging, custom_packaging_id, custom_packaging_name, custom_packaging_cost, notes')

  console.log('Sale items count:', saleItems?.length)
  saleItems?.forEach(si => {
    console.log(`Item [${si.id}] Sale: ${si.sale_id}, Prod: "${si.product_name}", Qty: ${si.quantity}, Custom: ${si.use_custom_packaging}, CustomName: "${si.custom_packaging_name}", Notes: "${si.notes}"`)
  })

  console.log('\nFetching audit logs...')
  const { data: logs } = await supabase
    .from('sembako_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  console.log('Audit logs count:', logs?.length)
  logs?.forEach(l => {
    console.log(`Log [${l.id}] Action: "${l.action_type}", Prod: "${l.product_name}", Notes: "${l.notes}"`)
  })

  console.log('\nChecking sembako_inventory_mutations...')
  const { data: muts, error: mutErr } = await supabase
    .from('sembako_inventory_mutations')
    .select('*')

  if (mutErr) {
    console.log('sembako_inventory_mutations error (probably table not created yet):', mutErr.message)
  } else {
    console.log('sembako_inventory_mutations count:', muts?.length)
    muts?.forEach(m => {
      console.log(`Mutation [${m.id}] Material: "${m.material_name}", Type: ${m.mutation_type}/${m.action_type}, Qty: ${m.quantity}, Notes: "${m.notes}"`)
    })
  }
}

inspect()
