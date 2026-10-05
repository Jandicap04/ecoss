import { getCurrentPlatformAdmin, supabase } from '../lib/supabase.js'

export async function getSessionContext() {
  if (!supabase) return { user: null, isAdmin: false, error: 'Supabase no está configurado.' }
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) return { user: null, isAdmin: false, error: error.message }
  if (!session?.user) return { user: null, isAdmin: false, error: null }
  const { isAdmin } = await getCurrentPlatformAdmin()
  return { user: session.user, isAdmin, error: null }
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('El inicio de sesión no está configurado en este entorno.')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUp({ name, email, password }) {
  if (!supabase) throw new Error('El registro no está configurado en este entorno.')
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })
  if (error) throw error
  return data
}

export async function requestPasswordReset(email) {
  if (!supabase) throw new Error('La recuperación de contraseña no está configurada en este entorno.')
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  })
  if (error) throw error
}

export async function updatePassword(password) {
  if (!supabase) throw new Error('La actualización de contraseña no está configurada en este entorno.')
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
