'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileUpload } from '@/components/file-upload'

type LocationOption = { id: string; pointName: string; village: string; district: string }

export default function PointManagerRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [states, setStates] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    shopName: '', pointName: '', village: '', district: '', state: '', pincode: '', shopPhoto: '',
  })

  useEffect(() => {
    fetch('/api/locations/cascading')
      .then((r: Response) => r.json())
      .then((d) => { if (d.success) setStates(d.data.states) })
  }, [])

  async function loadDistricts(state: string) {
    setSelectedState(state)
    setSelectedDistrict('')
    setLocations([])
    setForm((f) => ({ ...f, shopLocationId: '' }))
    const res = await fetch(`/api/locations/cascading?state=${encodeURIComponent(state)}`)
    const data = await res.json()
    if (data.success) setDistricts(data.data.districts)
  }

  async function loadLocations(district: string) {
    setSelectedDistrict(district)
    setLocations([])
    setForm((f) => ({ ...f, shopLocationId: '' }))
    const res = await fetch(`/api/locations/cascading?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(district)}`)
    const data = await res.json()
    if (data.success) setLocations(data.data.locations)
  }

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    setError('')
    const { name, email, phone, password, confirmPassword, shopName, pointName, village, district, state, pincode } = form
    if (!name || !email || !phone || !password || !shopName || !pointName || !village || !district || !state || !pincode) {
      return setError('All fields are required')
    }
    if (phone.length !== 10) return setError('Enter a valid 10-digit phone number')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirmPassword) return setError('Passwords do not match')

    setLoading(true)
    try {
      const res = await fetch('/api/users/register/point-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, email, phone, password, 
          shopName, 
          location: { pointName, village, district, state, pincode },
          shopPhoto: form.shopPhoto 
        }),
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
            <h2 className="text-xl font-bold">Registration Submitted!</h2>
            <p className="text-sm text-muted-foreground">
              Your application has been received. Our admin team will review and approve your account within 24–48 hours. You will be notified by email.
            </p>
            <Button className="w-full mt-4" onClick={() => router.push('/login')}>
              Back to Sign In
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
            <h1 className="text-xl font-bold">Point Manager Registration</h1>
            <p className="text-sm text-muted-foreground">Fill in your details to apply</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Personal Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Full Name</Label>
                <Input placeholder="e.g. Ravi Kumar" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input type="email" placeholder="ravi@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shop Details</CardTitle>
            <CardDescription>Enter your shop information to create a new collection point</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Shop Name</Label>
              <Input placeholder="e.g. Ravi General Store" value={form.shopName} onChange={(e) => set('shopName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Point Name</Label>
              <Input placeholder="e.g. Ravi Store Point" value={form.pointName} onChange={(e) => set('pointName', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Village</Label>
                <Input placeholder="e.g. Shivaji Nagar" value={form.village} onChange={(e) => set('village', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>District</Label>
                <Input placeholder="e.g. Pune" value={form.district} onChange={(e) => set('district', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>State</Label>
                <Select onValueChange={(v) => set('state', v)}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Pincode</Label>
                <Input placeholder="e.g. 411045" value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} maxLength={6} />
              </div>
            </div>
            <FileUpload
              folder="shop-photos"
              accept="image/jpeg,image/png,image/webp"
              label="Shop Photo (required)"
              onUploadComplete={(url) => set('shopPhoto', url)}
            />
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="w-full" size="lg" disabled={loading} onClick={handleSubmit}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Submit Application
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By registering, you agree to our terms of service. Your account will be reviewed before activation.
        </p>
      </div>
    </div>
  )
}
