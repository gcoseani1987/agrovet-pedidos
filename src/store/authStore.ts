import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session } from '@supabase/supabase-js'
import type { Vendedor } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  vendedor: Vendedor | null
  loading: boolean
  // Actions
  setSession: (session: Session | null) => void
  fetchVendedor: (userId: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      vendedor: null,
      loading: true,

      setSession: (session) => {
        set({ session, loading: false })
        if (session?.user) {
          get().fetchVendedor(session.user.id)
        } else {
          set({ vendedor: null })
        }
      },

      fetchVendedor: async (userId: string) => {
        const { data, error } = await supabase
          .from('vendedores')
          .select('*')
          .eq('id', userId)
          .single()

        if (!error && data) {
          set({ vendedor: data })
        }
      },

      signIn: async (email: string, password: string) => {
        set({ loading: true })
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
          set({ loading: false })
          // Traducir mensajes comunes al español
          if (error.message.includes('Invalid login credentials')) {
            return { error: 'Email o contraseña incorrectos' }
          }
          return { error: error.message }
        }

        set({ session: data.session, loading: false })
        if (data.session?.user) {
          await get().fetchVendedor(data.session.user.id)
        }
        return { error: null }
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ session: null, vendedor: null })
      },
    }),
    {
      name: 'agrovet-auth',
      // Solo persistir la sesión, no el loading state
      partialize: (state) => ({ session: state.session }),
    }
  )
)
