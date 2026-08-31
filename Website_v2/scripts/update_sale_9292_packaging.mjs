import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateSale9292() {
  console.log('Updating sale SMB-20260831-9292 notes with custom packaging tag...')
  const { data: sale, error: fetchErr } = await supabase
    .from('sembako_sales')
    .select('id, notes')
    .eq('invoice_number', 'SMB-20260831-9292')
    .single()

  if (fetchErr) {
    console.error('Fetch error:', fetchErr)
    return
  }

  const currentNotes = sale.notes || ''
  const newNotes = currentNotes.includes('[Kemasan:')
    ? currentNotes
    : `[Kemasan: Pouch Alumunium 250 Gram]\n${currentNotes}`.trim()

  const { error: updateErr } = await supabase
    .from('sembako_sales')
    .update({ notes: newNotes })
    .eq('id', sale.id)

  if (updateErr) {
    console.error('Update error:', updateErr)
  } else {
    console.log('Successfully updated sale SMB-20260831-9292 notes to:', newNotes)
  }
}

updateSale9292()
