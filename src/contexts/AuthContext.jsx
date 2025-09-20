import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabaseConfigured = isSupabaseConfigured()

  useEffect(() => {
    // If Supabase is not configured, skip authentication
    if (!supabaseConfigured) {
      setUser(null)
      setLoading(false)
      return
    }

    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.log('No user logged in')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth state changes
    const authStateResult = authService.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    // Handle both configured and unconfigured cases
    const subscription = authStateResult?.data?.subscription
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
    }
  }, [supabaseConfigured])

  const signIn = async (email, password) => {
    if (!supabaseConfigured) {
      return { success: false, error: 'Supabase not configured' }
    }
    
    try {
      setLoading(true)
      const { user } = await authService.signIn(email, password)
      setUser(user)
      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!supabaseConfigured) return
    
    try {
      setLoading(true)
      await authService.signOut()
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: supabaseConfigured ? !!user : true // Always authenticated if Supabase not configured
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
