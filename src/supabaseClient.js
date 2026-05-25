import { createClient } from '@supabase/supabase-js'

// Supabase Panel > Settings > API kısmından al:
const supabaseUrl = 'https://bpyvdysxckrnozpmukad.supabase.co' 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJweXZkeXN4Y2tybm96cG11a2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjY2OTQsImV4cCI6MjA5MjcwMjY5NH0.aZGY61AWeAWABTB8MJcbWO3D3bXHnBiXJ5LncmXAgAY' 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)