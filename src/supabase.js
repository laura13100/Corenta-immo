import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://rinotvlhnvgrszcdpkcw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbm90dmxobnZncnN6Y2Rwa2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzgxMjcsImV4cCI6MjA5MzMxNDEyN30.lWC-IACQNs3zNU6WhW7M99m0lWOTfGXJYS0JM8NHQ8U'
)
