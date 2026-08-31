import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAlu200() {
  console.log('=== POUCH ALUMUNIUM 200 GRAM AUDIT ===')
  
  const { data: rawMat } = await supabase
    .from('sembako_raw_materials')
    .select('*')
    .ilike('material_name', '%Alumunium 200%')
    .single()

  console.log('Raw Material in DB:', rawMat)

  const { data: mutations } = await supabase
    .from('sembako_inventory_mutations')
    .select('*')
    .eq('material_id', rawMat.id)
    .order('created_at', { ascending: true })

  console.log('\nMutations in DB (' + mutations?.length + '):')
  mutations?.forEach(m => {
    console.log(` - [${m.mutation_type}] ${m.action_type} ${m.quantity} ${m.unit} | ref: ${m.ref_number} (${m.party_name || '-'}) | notes: ${m.notes}`)
  })

  const { data: allSales } = await supabase
    .from('sembako_sales')
    .select('*, sembako_sale_items(*)')
    .eq('is_deleted', false)

  console.log('\nAll Active Sales:')
  allSales?.forEach(s => {
    const isAlu200 = (s.notes && s.notes.includes('Alumunium 200')) || s.sembako_sale_items?.some(i => i.notes && i.notes.includes('Alumunium 200'))
    if (isAlu200) {
      console.log(` - #${s.invoice_number} | ${s.customer_name} | notes: ${s.notes}`)
      s.sembako_sale_items?.forEach(i => console.log(`    item: ${i.product_name} qty: ${i.quantity}`))
    }
  })
}

checkAlu200()
