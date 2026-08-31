import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCustomerTerms() {
  const { data: sales } = await supabase
    .from('sembako_sales')
    .select('*, customer:sembako_customers(*)')
    .in('customer_name', ['Amal', 'Hendri', 'Pak Anggi', 'Pak Bukit'])

  sales?.forEach(s => {
    console.log(`\nCustomer: ${s.customer_name} (Terms: ${s.customer?.payment_terms || '-'})`)
    console.log(`Invoice #${s.invoice_number} | Total: ${s.total_amount} | Paid: ${s.paid_amount} | Delivery: ${s.delivery_cost}`)
    console.log(`Notes: ${s.notes}`)
  })
}

checkCustomerTerms()
