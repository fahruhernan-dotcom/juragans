import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectSalesAndCustomers() {
  console.log('=== CUSTOMER & SALES AUDIT ===')

  const { data: customers, error: cErr } = await supabase.from('sembako_customers').select('*')
  if (cErr) console.error('Customer Error:', cErr)
  else {
    console.log('\n--- Customers in DB (' + customers?.length + ') ---')
    customers?.forEach(c => {
      console.log(`ID: ${c.id} | Name: ${c.name} | Current Balance: ${c.current_balance}`)
    })
  }

  const { data: sales, error: sErr } = await supabase
    .from('sembako_sales')
    .select('*')
    .eq('is_deleted', false)
  if (sErr) console.error('Sales Error:', sErr)
  else {
    console.log('\n--- Active Sales in DB (' + sales?.length + ') ---')
    sales?.forEach(s => {
      const sisa = (Number(s.total_amount) || 0) - (Number(s.paid_amount) || 0)
      console.log(`Invoice: ${s.invoice_number} | Customer: ${s.customer_name} | Total: ${s.total_amount} | Paid: ${s.paid_amount} | Status: ${s.payment_status} | Method: ${s.payment_method} | Sisa: ${sisa} | DeliveryCost: ${s.delivery_cost} | Notes: ${s.notes?.replace(/\n/g, ' ')}`)
    })
  }
}

inspectSalesAndCustomers()
