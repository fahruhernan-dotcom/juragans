import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDetails() {
  const { data } = await supabase.from('sembako_sales').select('*, sembako_sale_items(*)').in('customer_name', ['Hendri', 'Renny', 'Pak Anggi'])
  data?.forEach(s => {
    console.log(`\n=== #${s.invoice_number} - ${s.customer_name} ===`)
    console.log('Sale Notes:', s.notes)
    console.log('Items:', s.sembako_sale_items)
  })
}

checkDetails()
