'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, AuthResponse } from '@/types'
import { authAPI } from '@/lib/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (identifier: string, password: string) => Promise<void>
  adminLogin: (identifier: string, password: string) => Promise<void>
  signup: (data: { email?: string; phone?: string; password: string; full_name?: string }) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      const profile = await authAPI.getProfile() as User
      setUser(profile)
    } catch {
      // Token invalid/expired – clear it
      localStorage.removeItem('auth_token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  const login = async (identifier: string, password: string) => {
    const res = await authAPI.login(identifier, password) as AuthResponse
    localStorage.setItem('auth_token', res.access_token)
    setUser(res.user)
  }

  const adminLogin = async (identifier: string, password: string) => {
    const res = await authAPI.adminLogin(identifier, password) as AuthResponse
    localStorage.setItem('auth_token', res.access_token)
    setUser(res.user)
  }

  const signup = async (data: { email?: string; phone?: string; password: string; full_name?: string }) => {
    const res = await authAPI.signup(data) as AuthResponse
    localStorage.setItem('auth_token', res.access_token)
    setUser(res.user)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    authAPI.logout().catch(() => {})
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        adminLogin,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
