import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rinotvlhnvgrszdpkcw.supabase.co'
const SUPABASE_KEY = 'sb_publishable_txSvyD7f6jisZE3huKbWRg__uf5m9AX'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
