import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/supabase'

interface AuthState {
  user: User | null
  profile: Tables<'users'> | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Tables<'users'>>) => Promise<{ error?: string }>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        if (profileError) console.error('Error fetching profile:', profileError)
        set({ user, profile, loading: false })
      } else {
        set({ user: null, profile: null, loading: false })
      }
    } catch (err) {
      console.error('Auth initialization error:', err)
      set({ loading: false })
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle()
        if (profileError) console.error('Error fetching profile:', profileError)
        set({ user: data.user, profile })
      }

      return {}
    } catch {
      return { error: 'Une erreur est survenue lors de la connexion' }
    }
  },

  signUp: async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: error.message }

      if (data.user) {
        const role = email === 'laurent.habib@gmail.com' ? 'admin' : 'customer'
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          phone: phone || null,
          role,
        })
        if (profileError) console.error('Profile creation error:', profileError)
      }

      return {}
    } catch {
      return { error: 'Une erreur est survenue lors de l\'inscription' }
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut()
      set({ user: null, profile: null })
      // Redirection immédiate pour éviter boucle infinie
      window.location.href = '/'
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err)
    }
  },

  updateProfile: async (data: Partial<Tables<'users'>>) => {
    try {
      const { user } = get()
      if (!user) return { error: 'Non connecté' }

      const { error } = await supabase
        .from('users')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      if (error) return { error: error.message }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      if (profileError) console.error('Error refreshing profile:', profileError)

      set({ profile })
      return {}
    } catch {
      return { error: 'Erreur lors de la mise à jour du profil' }
    }
  },
}))

// Gestion sécurisée de l'état Supabase
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    // Déconnexion directe sans relancer useEffect
    useAuthStore.setState({ user: null, profile: null })
  }
})
