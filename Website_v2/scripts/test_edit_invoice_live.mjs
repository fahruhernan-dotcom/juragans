import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEditLive() {
  console.log('Testing live check for Pak Anggi invoice SMB-20260831-0F5D...')
  const { data: sale } = await supabase
    .from('sembako_sales')
    .select('*, sembako_sale_items(*)')
    .eq('invoice_number', 'SMB-20260831-0F5D')
    .single()

  console.log('Sale found:', sale?.invoice_number, sale?.customer_name)
  console.log('Notes:', sale?.notes)
  console.log('Items:', sale?.sembako_sale_items)
}

testEditLive()
