'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const interceptorSet = useRef(false)

  // Intercept all fetch calls to inject Bearer token for API requests
  useEffect(() => {
    if (interceptorSet.current) return
    interceptorSet.current = true

    const originalFetch = window.fetch.bind(window)
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url
      if (url.startsWith(API_URL) || url.startsWith('http://localhost:8000')) {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const headers = new Headers(init?.headers)
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`)
          }
          init = { ...init, headers }
        }
      }
      return originalFetch(input, init)
    }
    return () => {
      window.fetch = originalFetch
      interceptorSet.current = false
    }
  }, [])

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      const currentPath = window.location.pathname
      router.replace(`/account/login?redirect=${encodeURIComponent(currentPath)}`)
      return
    }

    if (user && user.role !== 'admin' && !user.is_admin) {
      router.replace('/')
      return
    }

    setChecked(true)
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading || !checked) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto mb-4" />
          <p className="text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
