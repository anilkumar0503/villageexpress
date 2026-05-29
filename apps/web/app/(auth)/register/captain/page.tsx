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

export default function CaptainRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [states, setStates] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [points, setPoints] = useState<any[]>([])

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    aadhaarNumber: '', drivingLicense: '',
    vehicleType: '', vehicleNumber: '', districtIds: [] as string[],
    aadhaarFileUrl: '', licenseFileUrl: '',
    selectedPoints: [] as string[],
  })

  useEffect(() => {
    fetch('/api/locations/cascading')
      .then((r) => r.json())
      .then((d) => { if (d.success) setStates(d.data.states) })
  }, [])

  async function loadDistricts(state: string) {
    setSelectedState(state)
    setDistricts([])
    setPoints([])
    setForm((f) => ({ ...f, districtIds: [], selectedPoints: [] }))
    const res = await fetch(`/api/locations/cascading?state=${encodeURIComponent(state)}`)
    const data = await res.json()
    if (data.success) setDistricts(data.data.districts)
  }

  function toggleDistrict(district: string) {
    setForm((f) => {
      const districtIds = f.districtIds.includes(district)
        ? f.districtIds.filter((id) => id !== district)
        : [...f.districtIds, district]
      // Clear points when districts change
      return { ...f, districtIds, selectedPoints: [] }
    })
    loadPointsForDistricts()
  }

  async function loadPointsForDistricts() {
    if (form.districtIds.length === 0) {
      setPoints([])
      return
    }
    // Load points from all selected districts
    const promises = form.districtIds.map((district) =>
      fetch(`/api/locations?district=${encodeURIComponent(district)}&public=true`)
    )
    const responses = await Promise.all(promises)
    const allPoints = []
    for (const res of responses) {
      const data = await res.json()
      if (data.success) allPoints.push(...data.data.items)
    }
    setPoints(allPoints)
  }

  function togglePoint(pointId: string) {
    setForm((f) => ({
      ...f,
      selectedPoints: f.selectedPoints.includes(pointId)
        ? f.selectedPoints.filter((id) => id !== pointId)
        : [...f.selectedPoints, pointId],
    }))
  }

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    setError('')
    const { name, email, phone, password, confirmPassword, aadhaarNumber, drivingLicense, vehicleType, vehicleNumber, districtIds, selectedPoints } = form
    if (!name || !email || !phone || !password || !aadhaarNumber || !drivingLicense || !vehicleType || !vehicleNumber) {
      return setError('All fields are required')
    }
    if (districtIds.length === 0) return setError('Please select at least one operating district')
    if (selectedPoints.length === 0) return setError('Please select at least one operating point')
    if (phone.length !== 10) return setError('Enter a valid 10-digit phone number')
    if (aadhaarNumber.length !== 12) return setError('Aadhaar number must be 12 digits')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirmPassword) return setError('Passwords do not match')

    setLoading(true)
    try {
      const res = await fetch('/api/users/register/captain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, aadhaarNumber, drivingLicense, vehicleType, vehicleNumber, districtIds, selectedPoints }),
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
            <h2 className="text-xl font-bold">KYC Submitted!</h2>
            <p className="text-sm text-muted-foreground">
              Your documents are under review. Once verified and approved, you will receive a confirmation email and can start accepting deliveries.
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
            <h1 className="text-xl font-bold">Captain Registration</h1>
            <p className="text-sm text-muted-foreground">Submit your KYC to become a delivery partner</p>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">KYC Documents</CardTitle>
            <CardDescription>Required for identity and eligibility verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Aadhaar Number</Label>
                <Input maxLength={12} placeholder="12-digit number" value={form.aadhaarNumber} onChange={(e) => set('aadhaarNumber', e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className="space-y-1.5">
                <Label>Driving License No.</Label>
                <Input placeholder="e.g. AP0120230012345" value={form.drivingLicense} onChange={(e) => set('drivingLicense', e.target.value.toUpperCase())} />
              </div>
              <div className="col-span-2">
                <FileUpload folder="aadhaar" accept="image/jpeg,image/png,application/pdf" label="Aadhaar Card (photo/scan)" onUploadComplete={(url) => set('aadhaarFileUrl', url)} />
              </div>
              <div className="col-span-2">
                <FileUpload folder="driving-license" accept="image/jpeg,image/png,application/pdf" label="Driving License (photo/scan)" onUploadComplete={(url) => set('licenseFileUrl', url)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vehicle Details</CardTitle>
            <CardDescription>The vehicle you will use for deliveries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vehicle Type</Label>
                <Select onValueChange={(v) => set('vehicleType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BIKE">Bike</SelectItem>
                    <SelectItem value="AUTO">Auto</SelectItem>
                    <SelectItem value="MINI_VAN">Mini Van</SelectItem>
                    <SelectItem value="VAN">Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle Number</Label>
                <Input placeholder="e.g. AP16AB1234" value={form.vehicleNumber} onChange={(e) => set('vehicleNumber', e.target.value.toUpperCase())} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Operating State</Label>
                <Select onValueChange={loadDistricts}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Operating Districts (select multiple)</Label>
                {districts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Select a state first to see available districts</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                    {districts.map((district) => (
                      <label key={district} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded">
                        <input
                          type="checkbox"
                          checked={form.districtIds.includes(district)}
                          onChange={() => toggleDistrict(district)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{district}</span>
                      </label>
                    ))}
                  </div>
                )}
                {form.districtIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.districtIds.length} district{form.districtIds.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operating Points</CardTitle>
            <CardDescription>Select the points where you can operate (at least one required)</CardDescription>
          </CardHeader>
          <CardContent>
            {points.length === 0 ? (
              <p className="text-sm text-muted-foreground">Select a district first to see available points</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {points.map((point) => (
                  <label key={point.id} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                    <input
                      type="checkbox"
                      checked={form.selectedPoints.includes(point.id)}
                      onChange={() => togglePoint(point.id)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{point.pointName}</p>
                      <p className="text-xs text-muted-foreground">{point.village}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {form.selectedPoints.length > 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                {form.selectedPoints.length} point{form.selectedPoints.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="w-full" size="lg" disabled={loading} onClick={handleSubmit}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Submit KYC
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Your Aadhaar and license details are stored securely and used only for verification purposes.
        </p>
      </div>
    </div>
  )
}
