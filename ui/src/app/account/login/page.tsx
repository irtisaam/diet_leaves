'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/context/AuthContext'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/account'
  const isAdminLogin = redirectTo.startsWith('/admin')
  const { login, adminLogin, user } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  // If already logged in, redirect
  if (user && !loginSuccess) {
    router.replace(redirectTo)
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isAdminLogin) {
        await adminLogin(identifier, password)
      } else {
        await login(identifier, password)
      }
      setLoginSuccess(true)
      // Small delay to let auth context propagate before navigating
      await new Promise(r => setTimeout(r, 100))
      router.replace(redirectTo)
    } catch (err: any) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-white">
            Diet<span className="text-primary">Leaves</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6">{isAdminLogin ? 'Admin Sign In' : 'Sign In'}</h1>
          <p className="text-gray-400 mt-2">
            {isAdminLogin ? 'Sign in with your admin credentials.' : 'Welcome back! Sign in to your account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-100 rounded-xl p-8 border border-dark-200 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email or Phone</label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              placeholder="email@example.com or 03001234567"
              className="w-full px-4 py-3 rounded-lg bg-dark border border-dark-200 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-dark border border-dark-200 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="text-right">
            <Link href="/account/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {!isAdminLogin && (
            <p className="text-center text-gray-400 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/account/register" className="text-primary hover:underline">
                Create one
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
