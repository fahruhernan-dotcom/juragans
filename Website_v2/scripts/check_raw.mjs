import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: raw, error } = await supabase
    .from('sembako_raw_materials')
    .select('id, material_name, category, current_stock, unit, unit_cost, total_spent')
    .eq('is_deleted', false)
  if (error) console.error('ERROR:', error)
  console.log('ALL RAW MATERIALS (count:', raw?.length, '):')
  console.table(raw)

  const { data: prods } = await supabase
    .from('sembako_products')
    .select('id, product_name, category, current_stock, unit, avg_buy_price')
    .eq('is_deleted', false)
  console.log('ALL PRODUCTS (count:', prods?.length, '):')
  console.table(prods)
}

check()
