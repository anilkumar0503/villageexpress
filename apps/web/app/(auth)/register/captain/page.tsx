'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function CaptainRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  })

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    setError('')
    const { name, email, phone, password, confirmPassword } = form
    if (!name || !email || !phone || !password) {
      return setError('All fields are required')
    }
    if (phone.length !== 10) return setError('Enter a valid 10-digit phone number')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirmPassword) return setError('Passwords do not match')

    setLoading(true)
    try {
      const res = await fetch('/api/users/register/captain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      })
      const data = await res.json()
      if (!data.success) return setError(data.error ?? 'Registration failed')
      setStep('success')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold">Registration Successful!</h2>
            <p className="text-sm text-muted-foreground">
              Your account has been created. Please complete your onboarding to start accepting deliveries.
            </p>
            <Button className="w-full mt-4" onClick={() => router.push('/login')}>
              Continue to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="w-full max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/register">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">Captain Registration</h1>
            <p className="text-sm text-muted-foreground">Create your account to get started</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Personal Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Full Name</Label>
                <Input placeholder="As on Aadhaar" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input type="email" placeholder="your@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input type="tel" maxLength={10} placeholder="10-digit number" value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" placeholder="Min. 8 characters" value={form.password} onChange={(e) => set('password', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm Password</Label>
                <Input type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="w-full" size="lg" disabled={loading} onClick={handleSubmit}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Create Account
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          You will complete your KYC and vehicle details after registration.
        </p>
      </div>
    </div>
  )
}
