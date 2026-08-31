import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function settleCashSales() {
  console.log('--- Settling 4 Cash Sales to LUNAS ---')
  const invoicesToSettle = [
    { inv: 'SMB-20260831-5815', customer: 'Hendri', total: 160000 },
    { inv: 'SMB-20260831-0F5D', customer: 'Pak Anggi', total: 175500 },
    { inv: 'SMB-20260831-9292', customer: 'Pak Bukit', total: 97000 },
    { inv: 'SMB-20260830-8828', customer: 'Amal', total: 97000 },
  ]

  for (const item of invoicesToSettle) {
    const { data: sale } = await supabase
      .from('sembako_sales')
      .select('*')
      .eq('invoice_number', item.inv)
      .single()

    if (sale) {
      console.log(`Updating #${sale.invoice_number} (${sale.customer_name}): paid ${sale.paid_amount} -> ${item.total}`)
      await supabase
        .from('sembako_sales')
        .update({
          paid_amount: item.total,
          remaining_amount: 0,
          payment_status: 'lunas'
        })
        .eq('id', sale.id)

      // Also upsert/update sembako_payments
      const { data: payments } = await supabase
        .from('sembako_payments')
        .select('*')
        .eq('sale_id', sale.id)

      if (payments && payments.length > 0) {
        await supabase
          .from('sembako_payments')
          .update({ amount: item.total })
          .eq('id', payments[0].id)
      } else {
        await supabase
          .from('sembako_payments')
          .insert({
            sale_id: sale.id,
            customer_id: sale.customer_id,
            amount: item.total,
            payment_date: sale.transaction_date,
            payment_method: 'cash',
            notes: 'Pelunasan otomatis (Cash)',
            tenant_id: sale.tenant_id
          })
      }
    }
  }

  console.log('✅ All 4 cash invoices successfully settled to LUNAS!')
}

settleCashSales()
