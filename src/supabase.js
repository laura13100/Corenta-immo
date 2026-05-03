import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://rinotvlhnvgrszdpkcw.supabase.co',
  'sb_publishable_txSvyD7f6jisZE3huKbWRg__uf5m9AX',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)
