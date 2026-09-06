import { createClient } from '@supabase/supabase-js'
import { supabaseAuthStorage } from './supabaseStorage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rezbfduwtpiyclvjqrlj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemJmZHV3dHBpeWNsdmpxcmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTI1MjgsImV4cCI6MjEwMTg2ODUyOH0.frKi63jrfbskqzhlVoNuhlUwqPb6IBFlb2ZE3IH25C4'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Bypass Web Locks API — browser ini tidak follow LockManager spec
      lock: (_name, _acquireTimeout, fn) => fn(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: supabaseAuthStorage,
    },
  }
)
