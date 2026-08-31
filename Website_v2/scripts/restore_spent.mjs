import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  // Pouch 250g original total_spent was 65450 (50 * 1309)
  await supabase
    .from('sembako_raw_materials')
    .update({ total_spent: 65450 })
    .eq('id', 'f5bb5bf2-4a32-434a-b2da-380baacdbc51')
  console.log('Restored Pouch 250g total_spent to 65450')
}

run()
