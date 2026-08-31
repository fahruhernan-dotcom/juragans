import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSales() {
  const { data } = await supabase.from('sembako_sales').select('id, invoice_number, customer_name, is_deleted, sembako_sale_items(*)').eq('is_deleted', false)
  console.log('Active sales:', data?.length)
  data?.forEach(s => {
    console.log(`#${s.invoice_number} (${s.customer_name}):`, s.sembako_sale_items?.map(i => `${i.product_name} x${i.quantity}`))
  })
}

checkSales()
