import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testQuery() {
  console.log('=== Test Querying Mutations for Invoice ===')
  const { data: mutations, error } = await supabase
    .from('sembako_inventory_mutations')
    .select('*')
    .eq('ref_number', 'SMB-20260831-9292')

  console.log('Mutations for SMB-20260831-9292:', mutations?.length, 'rows')
  if (mutations) {
    mutations.forEach(m => console.log(` - ${m.material_name}: ${m.mutation_type} ${m.quantity} ${m.unit} (${m.action_type})`))
  }
}

testQuery()
