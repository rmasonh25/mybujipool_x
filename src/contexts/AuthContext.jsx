import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user || null)
      setIsInitialized(true)

      // Listen for auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setUser(session?.user || null)
        }
      )

      return () => {
        authListener.subscription.unsubscribe()
      }
    }

    initializeAuth()
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data
  }

  const register = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    
    // Create user profile in users table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([{ id: data.user.id, email: data.user.email }])
      
      if (profileError) throw profileError
    }
    
    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    
    // Don't throw error if session is already missing/invalid
    // This allows logout to complete gracefully on the client side
    if (error && !error.message?.includes('session_not_found') && !error.message?.includes('Auth session missing')) {
      throw error
    }
  }

  const value = {
    user,
    isInitialized,
    login,
    register,
    logout,
    isLoggedIn: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}