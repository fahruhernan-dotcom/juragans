import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
  const { data: polyMuts } = await supabase
    .from('sembako_inventory_mutations')
    .select('*')
    .ilike('material_name', '%polymailer%')
    .order('created_at', { ascending: false })

  console.log('=== Plastik Packing Polymailer Hitam Mutations ===')
  console.log('Count:', polyMuts?.length)
  let polyIn = 0, polyOut = 0
  polyMuts?.forEach(m => {
    console.log(`[${m.mutation_type}/${m.action_type}] Qty: ${m.quantity} ${m.unit} | Prev: ${m.prev_stock} -> New: ${m.new_stock} | Ref: ${m.ref_number || '-'} | Notes: "${m.notes}"`)
    if (m.mutation_type === 'IN') polyIn += Number(m.quantity)
    if (m.mutation_type === 'OUT') polyOut += Number(m.quantity)
  })
  console.log(`Summary: Total Masuk: +${polyIn}, Total Keluar: -${polyOut}, Sisa: ${polyIn - polyOut}`)

  const { data: pouchMuts } = await supabase
    .from('sembako_inventory_mutations')
    .select('*')
    .ilike('material_name', '%Pouch 100 Gram%')
    .order('created_at', { ascending: false })

  console.log('\n=== Pouch 100 Gram Mutations ===')
  console.log('Count:', pouchMuts?.length)
  let pIn = 0, pOut = 0
  pouchMuts?.forEach(m => {
    console.log(`[${m.mutation_type}/${m.action_type}] Qty: ${m.quantity} ${m.unit} | Prev: ${m.prev_stock} -> New: ${m.new_stock} | Ref: ${m.ref_number || '-'} | Notes: "${m.notes}"`)
    if (m.mutation_type === 'IN') pIn += Number(m.quantity)
    if (m.mutation_type === 'OUT') pOut += Number(m.quantity)
  })
  console.log(`Summary: Total Masuk: +${pIn}, Total Keluar: -${pOut}, Sisa: ${pIn - pOut}`)
}

verify()
