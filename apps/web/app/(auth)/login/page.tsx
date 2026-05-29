'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

type Mode = 'select' | 'otp-email' | 'otp-code' | 'password' | 'google'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuth()
  const [mode, setMode] = useState<Mode>('select')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const expired = new URLSearchParams(window.location.search).get('expired')
    if (expired === 'true') {
      setError('Your session has expired. Please sign in again.')
    }
  }, [])

  async function handleSendOtp() {
    if (!email) return setError('Enter your email address')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!data.success) return setError(data.error)
      setMode('otp-code')
    } catch {
      setError('Failed to send OTP. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    if (!otp || otp.length !== 6) return setError('Enter the 6-digit OTP')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      })
      const data = await res.json()
      if (!data.success) return setError(data.error)
      setAuth({ ...data.data.user, roles: ['CUSTOMER'] }, data.data.accessToken)
      
      // Check for stored locations from landing page
      const pickupLocationId = sessionStorage.getItem('pickupLocationId')
      const dropLocationId = sessionStorage.getItem('dropLocationId')
      
      if (pickupLocationId && dropLocationId) {
        sessionStorage.removeItem('pickupLocationId')
        sessionStorage.removeItem('dropLocationId')
        sessionStorage.removeItem('pickupLocation')
        sessionStorage.removeItem('dropLocation')
        router.push(`/bookings/new?pickupLocationId=${pickupLocationId}&dropLocationId=${dropLocationId}`)
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Verification failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordLogin() {
    if (!email || !password) return setError('Enter email and password')
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!data.success) return setError(data.error)
      setAuth(data.data.user, data.data.accessToken)
      
      // Check for stored locations from landing page
      const pickupLocationId = sessionStorage.getItem('pickupLocationId')
      const dropLocationId = sessionStorage.getItem('dropLocationId')
      
      if (pickupLocationId && dropLocationId) {
        sessionStorage.removeItem('pickupLocationId')
        sessionStorage.removeItem('dropLocationId')
        sessionStorage.removeItem('pickupLocation')
        sessionStorage.removeItem('dropLocation')
        router.push(`/bookings/new?pickupLocationId=${pickupLocationId}&dropLocationId=${dropLocationId}`)
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleLogin() {
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo.jpeg" alt="Village Express" className="w-12 h-12 rounded-xl" />
          <h1 className="text-2xl font-bold tracking-tight">Village Express</h1>
          <p className="text-sm text-muted-foreground">Courier management platform</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {mode === 'select' && 'Sign in'}
              {mode === 'otp-email' && 'Email OTP Login'}
              {mode === 'otp-code' && 'Enter OTP'}
              {mode === 'password' && 'Password Login'}
              {mode === 'google' && 'Google Login'}
            </CardTitle>
            <CardDescription>
              {mode === 'select' && 'Choose how you want to sign in'}
              {mode === 'otp-email' && "We'll send a one-time password to your email"}
              {mode === 'otp-code' && `OTP sent to ${email}`}
              {mode === 'password' && 'Sign in with your email and password'}
              {mode === 'google' && 'Sign in with your Google account'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {mode === 'select' && (
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="h-14 flex-col gap-1"
                  onClick={() => setMode('otp-email')}
                >
                  <Mail className="h-5 w-5" />
                  <span className="text-sm font-medium">Email OTP</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-14 flex-col gap-1"
                  onClick={() => setMode('password')}
                  data-testid="password-login-button"
                >
                  <Lock className="h-5 w-5" />
                  <span className="text-sm font-medium">Email &amp; Password</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-14 flex-col gap-1"
                  onClick={() => setMode('google')}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm font-medium">Continue with Google</span>
                </Button>
              </div>
            )}

            {(mode === 'otp-email' || mode === 'otp-code') && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={mode === 'otp-code'}
                    onKeyDown={(e) => e.key === 'Enter' && mode === 'otp-email' && handleSendOtp()}
                  />
                </div>

                {mode === 'otp-code' && (
                  <div className="space-y-2">
                    <Label htmlFor="otp">6-digit OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                      className="text-center text-2xl tracking-widest font-mono"
                    />
                  </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                {mode === 'otp-email' ? (
                  <Button onClick={handleSendOtp} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Send OTP <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button onClick={handleVerifyOtp} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Verify & Sign In
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => { setMode('otp-email'); setOtp(''); setError('') }}>
                      Resend OTP
                    </Button>
                  </div>
                )}
              </div>
            )}

            {mode === 'password' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email address</Label>
                  <Input
                    id="staff-email"
                    data-testid="email-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    data-testid="password-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button 
                  onClick={handlePasswordLogin} 
                  disabled={loading} 
                  className="w-full"
                  data-testid="submit-button"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>

                <div className="text-center">
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
            )}

            {mode === 'google' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  You will be redirected to Google to sign in.
                </p>
                <Button onClick={handleGoogleLogin} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Continue with Google
                </Button>
              </div>
            )}

            {mode !== 'select' && (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { setMode('select'); setError('') }}>
                ← Back
              </Button>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          New Point Manager or Captain?{' '}
          <a href="/register" className="text-primary underline underline-offset-4">
            Register here
          </a>
        </p>
      </div>
    </div>
  )
}
