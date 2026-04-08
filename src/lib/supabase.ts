import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno de Supabase.\n' +
    'Copiá .env.example como .env.local y completá los valores.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persistir sesión en localStorage para que sobreviva al cierre del browser
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

// Helper para obtener la URL pública de una imagen en Storage
export function getImageUrl(path: string | null): string | null {
  if (!path) return null
  const { data } = supabase.storage.from('productos').getPublicUrl(path)
  return data.publicUrl
}
