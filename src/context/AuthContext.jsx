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
    // TODO: Replace with real API call
    const mockUsers = [
      // Guardias
      { id: 101, username: 'guardia01', password: '1234', full_name: 'Carlos Mendoza', role: 'guard', location_id: 1, location_name: 'Yard A - Laredo' },
      { id: 102, username: 'guardia02', password: '1234', full_name: 'Luis Hernandez', role: 'guard', location_id: 1, location_name: 'Yard A - Laredo' },
      { id: 103, username: 'guardia03', password: '1234', full_name: 'Miguel Torres', role: 'guard', location_id: 2, location_name: 'Yard B - El Paso' },
      { id: 104, username: 'guardia04', password: '1234', full_name: 'Pedro Ramirez', role: 'guard', location_id: 2, location_name: 'Yard B - El Paso' },
      { id: 105, username: 'guardia05', password: '1234', full_name: 'Juan Lopez', role: 'guard', location_id: 3, location_name: 'Yard C - Dallas' },
      // Inspectores
      { id: 201, username: 'inspector01', password: '1234', full_name: 'Alberto Vargas', role: 'inspector', location_id: 1, location_name: 'Yard A - Laredo' },
      { id: 202, username: 'inspector02', password: '1234', full_name: 'Daniel Castro', role: 'inspector', location_id: 2, location_name: 'Yard B - El Paso' },
      // Auditores
      { id: 301, username: 'auditor01', password: '1234', full_name: 'Roberto Sanchez', role: 'auditor', location_id: 1, location_name: 'Yard A - Laredo' },
      { id: 302, username: 'auditor02', password: '1234', full_name: 'Guillermo Ortiz', role: 'auditor', location_id: 1, location_name: 'Yard A - Laredo' },
      // Admin
      { id: 401, username: 'admin', password: 'admin', full_name: 'Admin Crown', role: 'admin', location_id: 1, location_name: 'Yard A - Laredo' },
    ]

    const found = mockUsers.find(u => u.username === username && u.password === password)
    if (!found) throw new Error('Usuario o contraseña incorrectos')

    const session = {
      id: found.id,
      username: found.username,
      full_name: found.full_name,
      role: found.role,
      location_id: found.location_id,
      location_name: found.location_name,
    }
    setUser(session)
    localStorage.setItem('crown_user', JSON.stringify(session))
    return session
  }

  const canEdit = () => user?.role === 'guard' || user?.role === 'inspector' || user?.role === 'admin'
  const canViewAll = () => user?.role === 'auditor' || user?.role === 'admin'
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
