import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectTenant() {
  const { data: raw } = await supabase.from('sembako_raw_materials').select('id, material_name, tenant_id').limit(5)
  console.log('Raw materials sample:', raw)

  const { data: muts } = await supabase.from('sembako_inventory_mutations').select('id, material_id, material_name, tenant_id, mutation_type, action_type, quantity, created_at')
  console.log('Mutations in DB:', muts)
}

inspectTenant()
