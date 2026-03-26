import { createClient } from '@supabase/supabase-js'

// Supabase Panel > Settings > API kısmından al:
const supabaseUrl = 'https://xtcseuofflhsnzmzgyft.supabase.co' 
const supabaseAnonKey = 'sb_publishable_BuqJ6MOVHfl5S9koFoXdzA_alrya8rV' 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)