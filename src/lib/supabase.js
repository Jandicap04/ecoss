import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const isSupabaseConfigured = Boolean(supabase)

export async function getCurrentPlatformAdmin() {
  if (!supabase) return { user: null, isAdmin: false }
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { user: null, isAdmin: false }
  const { data, error } = await supabase
    .from('platform_admins')
    .select('profile_id')
    .eq('profile_id', user.id)
    .eq('active', true)
    .maybeSingle()
  return { user, isAdmin: !error && Boolean(data) }
}
