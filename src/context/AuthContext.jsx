import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const AuthContext = createContext()

// Session timeout in milliseconds (10 minutes)
const SESSION_TIMEOUT = 10 * 60 * 1000

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const timeoutRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  // Logout function - defined early so it can be used in resetInactivityTimer
  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('crown_user')
    localStorage.removeItem('crown_last_activity')
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    localStorage.setItem('crown_last_activity', Date.now().toString())
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    if (user) {
      timeoutRef.current = setTimeout(() => {
        console.log('Session expired due to inactivity')
        logout()
        alert(navigator.language.startsWith('es') 
          ? 'Sesión cerrada por inactividad (10 minutos)' 
          : 'Session closed due to inactivity (10 minutes)')
      }, SESSION_TIMEOUT)
    }
  }, [user, logout])

  // Check for session expiration on mount and restore session
  useEffect(() => {
    const stored = localStorage.getItem('crown_user')
    const lastActivity = localStorage.getItem('crown_last_activity')
    
    if (stored) {
      try {
        // Check if session has expired
        if (lastActivity) {
          const elapsed = Date.now() - parseInt(lastActivity)
          if (elapsed > SESSION_TIMEOUT) {
            // Session expired
            localStorage.removeItem('crown_user')
            localStorage.removeItem('crown_last_activity')
            setLoading(false)
            return
          }
        }
        setUser(JSON.parse(stored))
      } catch (e) {
        localStorage.removeItem('crown_user')
        localStorage.removeItem('crown_last_activity')
      }
    }
    setLoading(false)
  }, [])

  // Setup activity listeners when user is logged in
  useEffect(() => {
    if (!user) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      return
    }

    // Start inactivity timer
    resetInactivityTimer()

    // Activity events to track
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      resetInactivityTimer()
    }

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Check for activity in other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'crown_last_activity') {
        resetInactivityTimer()
      }
      if (e.key === 'crown_user' && !e.newValue) {
        // User logged out in another tab
        setUser(null)
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      window.removeEventListener('storage', handleStorageChange)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [user, resetInactivityTimer])

  const login = async (username, password) => {
    const API_BASE = import.meta.env.VITE_API_URL || '/api'
    
    try {
      // Get current language from localStorage or navigator
      const language = localStorage.getItem('crown_language') || 
                      (navigator.language.startsWith('es') ? 'es' : 'en')
      
      const res = await fetch(`${API_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, language })
      })
      
      const data = await res.json()
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Usuario o contraseña incorrectos')
      }
      
      // Double check user status if API doesn't include it
      if (!data.user.active && data.user.active !== undefined) {
        throw new Error('Usuario desactivado. Contacte al administrador.')
      }
      
      const session = {
        id: data.user.id,
        username: data.user.username,
        full_name: data.user.full_name,
        role: data.user.role,
        location_id: data.user.location_id,
        location_name: data.user.location_name,
        active: data.user.active,
        profile_photo: data.user.profile_photo
      }
      setUser(session)
      localStorage.setItem('crown_user', JSON.stringify(session))
      return session
    } catch (err) {
      // Re-throw the error - no fallback in production
      throw new Error(err.message || 'Usuario o contraseña incorrectos')
    }
  }

  const canEdit = () => user?.role === 'guard' || user?.role === 'inspector' || user?.role === 'admin'
  const canViewAll = () => user?.role === 'supervisor' || user?.role === 'admin'
  const canReconfirm = () => user?.role === 'guard' || user?.role === 'inspector' || user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, canEdit, canViewAll, canReconfirm }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
