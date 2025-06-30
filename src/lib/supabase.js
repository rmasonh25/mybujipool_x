import { createClient } from '@supabase/supabase-js'

// ✅ Hardcoded for Bolt.new preview
const supabaseUrl = 'https://nsqqlgaljskhiclpgafv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zcXFsZ2FsanNraGljbHBnYWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NDk5MTMsImV4cCI6MjA2NjUyNTkxM30.nmpgfjqmG6aQ2SWtZiloAQFrhOwBo2swKXethT8X6Sc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export a flag to check if we're using real Supabase
export const isSupabaseConfigured = true