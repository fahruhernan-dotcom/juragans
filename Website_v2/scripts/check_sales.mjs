import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: sales } = await supabase
    .from('sembako_sales')
    .select('id, invoice_number, customer_name, total_amount, created_at, sembako_sale_items(*)')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(10)
  console.log('RECENT SALES:')
  console.log(JSON.stringify(sales, null, 2))
}

check()
