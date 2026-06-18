import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { jwtDecode } from 'jwt-decode'
import { login as apiLogin, logout as apiLogout, refresh as apiRefresh } from '../api/auth'
import { setAccessToken } from '../api/axios'

type Role = 'ADMIN' | 'MANAGER' | 'OPERATOR'

interface AuthContextValue {
  isAuthenticated: boolean
  role: Role | null
  username: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface JwtPayload { sub: string; role: Role; exp: number }

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role | null>(() => localStorage.getItem('user_role') as Role | null)
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'))
  const [isLoading, setIsLoading] = useState(true)

  const handleLogout = useCallback(async () => {
    const rt = localStorage.getItem('refresh_token')
    setRole(null)
    setUsername(null)
    setAccessToken(null)
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('username')
    if (rt) {
      try { await apiLogout(rt) } catch { /* best effort */ }
    }
  }, [])

  // Restore session on mount via stored refresh token
  useEffect(() => {
    const rt = localStorage.getItem('refresh_token')
    if (!rt) { setIsLoading(false); return }

    apiRefresh(rt)
      .then(data => {
        setAccessToken(data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        const decoded = jwtDecode<JwtPayload>(data.access_token)
        setRole(decoded.role)
        setUsername(decoded.sub)
        localStorage.setItem('user_role', decoded.role)
        localStorage.setItem('username', decoded.sub)
      })
      .catch(() => {
        localStorage.removeItem('refresh_token')
        setRole(null)
        setUsername(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  // Listen for forced logout from axios interceptor
  useEffect(() => {
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [handleLogout])

  const login = useCallback(async (u: string, p: string) => {
    const data = await apiLogin(u, p)
    setAccessToken(data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    const decoded = jwtDecode<JwtPayload>(data.access_token)
    setRole(decoded.role)
    setUsername(decoded.sub)
    localStorage.setItem('user_role', decoded.role)
    localStorage.setItem('username', decoded.sub)
  }, [])

  const logout = useCallback(async () => {
    await handleLogout()
  }, [handleLogout])

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!role,
      role,
      username,
      login,
      logout,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
