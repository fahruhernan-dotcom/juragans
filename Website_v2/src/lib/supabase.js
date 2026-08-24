import { createClient } from '@supabase/supabase-js'
import { supabaseAuthStorage } from './supabaseStorage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kqbxzokrpcwuxrfjshuf.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYnh6b2tycGN3dXhyZmpzaHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzY1NTYsImV4cCI6MjEwMTM1MjU1Nn0.alDDENQKoFQY67tCk7s0CG2dl-OrIa8IHTMwhTHb_1A'

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
