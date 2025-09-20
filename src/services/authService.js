import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

class AuthService {
  constructor() {
    this.user = null
    this.isConfigured = isSupabaseConfigured()
    if (this.isConfigured) {
      this.setupAuthListener()
    }
  }

  setupAuthListener() {
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      this.user = session?.user || null
      console.log('Auth state changed:', event, this.user?.id)
    })
    return subscription
  }

  async getCurrentUser() {
    if (!this.isConfigured || !supabase) return null
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    this.user = user
    return user
  }

  async signIn(email, password) {
    if (!this.isConfigured || !supabase) {
      throw new Error('Supabase not configured')
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    this.user = data.user
    return data
  }

  async signOut() {
    if (!this.isConfigured || !supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    this.user = null
  }

  isAuthenticated() {
    return this.isConfigured && !!this.user
  }

  getUserId() {
    return this.user?.id
  }

  onAuthStateChange(callback) {
    if (!this.isConfigured || !supabase) {
      // Return a mock subscription object when Supabase is not configured
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }
    }
    return supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()
