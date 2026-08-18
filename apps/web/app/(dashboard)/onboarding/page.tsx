'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Truck, FileText, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileUpload } from '@/components/file-upload'
import { useAuth } from '@/hooks/use-auth'

export default function OnboardingPage() {
  const router = useRouter()
  const { accessToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const [states, setStates] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [points, setPoints] = useState<any[]>([])
  const [loadingPoints, setLoadingPoints] = useState(false)

  const [form, setForm] = useState({
    aadhaarNumber: '',
    aadhaarFileUrl: '',
    drivingLicense: '',
    licenseFileUrl: '',
    vehicleType: '',
    vehicleNumber: '',
    selectedState: '',
    districtIds: [] as string[],
    selectedPoints: [] as string[],
  })

  useEffect(() => {
    fetch('/api/locations/cascading')
      .then((r: Response) => r.json())
      .then((d) => { if (d.success) setStates(d.data.states) })
  }, [])

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function loadDistricts(state: string) {
    set('selectedState', state)
    setDistricts([])
    setPoints([])
    setForm((f) => ({ ...f, selectedState: state, districtIds: [], selectedPoints: [] }))
    const res = await fetch(`/api/locations/cascading?state=${encodeURIComponent(state)}`)
    const data = await res.json()
    if (data.success) setDistricts(data.data.districts)
  }

  async function loadPointsForDistricts(districtIds: string[]) {
    if (districtIds.length === 0) { setPoints([]); return }
    setLoadingPoints(true)
    try {
      const responses = await Promise.all(
        districtIds.map((d) => fetch(`/api/locations?district=${encodeURIComponent(d)}&public=true`))
      )
      const allPoints: any[] = []
      for (const res of responses) {
        const data = await res.json()
        if (data.success) allPoints.push(...data.data.items)
      }
      setPoints(allPoints)
    } finally {
      setLoadingPoints(false)
    }
  }

  function toggleDistrict(district: string) {
    setForm((f) => {
      const districtIds = f.districtIds.includes(district)
        ? f.districtIds.filter((id) => id !== district)
        : [...f.districtIds, district]
      loadPointsForDistricts(districtIds)
      return { ...f, districtIds, selectedPoints: [] }
    })
  }

  function togglePoint(pointId: string) {
    setForm((f) => ({
      ...f,
      selectedPoints: f.selectedPoints.includes(pointId)
        ? f.selectedPoints.filter((id) => id !== pointId)
        : [...f.selectedPoints, pointId],
    }))
  }

  async function handleSubmit() {
    setError('')

    if (form.aadhaarNumber && form.aadhaarNumber.length !== 12)
      return setError('Aadhaar number must be 12 digits')
    if (!form.vehicleType || !form.vehicleNumber)
      return setError('Vehicle type and vehicle number are required')
    if (form.districtIds.length === 0)
      return setError('Please select at least one operating district')
    if (form.selectedPoints.length === 0)
      return setError('Please select at least one operating point')

    setLoading(true)
    try {
      const res = await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          aadhaarNumber: form.aadhaarNumber || undefined,
          aadhaarFileUrl: form.aadhaarFileUrl || undefined,
          drivingLicense: form.drivingLicense || undefined,
          licenseFileUrl: form.licenseFileUrl || undefined,
          vehicleType: form.vehicleType,
          vehicleNumber: form.vehicleNumber,
          districtIds: form.districtIds,
          selectedPoints: form.selectedPoints,
        }),
      })
      const data = await res.json()
      if (!data.success) return setError(data.error ?? 'Onboarding failed')
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold">Onboarding Complete!</h2>
            <p className="text-sm text-muted-foreground">
              Your documents are under review. Once verified and approved, you can start accepting deliveries.
            </p>
            <Button className="w-full mt-4" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Complete Your Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-1">Fill in all details below and submit once.</p>
        </div>

        {/* Section 1: KYC Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              KYC Documents
              <span className="text-xs font-normal text-muted-foreground ml-1">(optional — can be added later)</span>
            </CardTitle>
            <CardDescription>Upload your identity documents for verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Aadhaar Number <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                <Input
                  maxLength={12}
                  placeholder="12-digit number"
                  value={form.aadhaarNumber}
                  onChange={(e) => set('aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Driving License No. <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                <Input
                  placeholder="e.g. AP0120230012345"
                  value={form.drivingLicense}
                  onChange={(e) => set('drivingLicense', e.target.value.toUpperCase())}
                />
              </div>
              <div className="col-span-2">
                <FileUpload
                  folder="aadhaar"
                  accept="image/jpeg,image/png,application/pdf"
                  label="Aadhaar Card photo/scan (optional)"
                  onUploadComplete={(url) => set('aadhaarFileUrl', url)}
                />
              </div>
              <div className="col-span-2">
                <FileUpload
                  folder="driving-license"
                  accept="image/jpeg,image/png,application/pdf"
                  label="Driving License photo/scan (optional)"
                  onUploadComplete={(url) => set('licenseFileUrl', url)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Vehicle Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-5 w-5" />
              Vehicle Details <span className="text-destructive">*</span>
            </CardTitle>
            <CardDescription>Tell us about the vehicle you&apos;ll use for deliveries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vehicle Type <span className="text-destructive">*</span></Label>
                <Select value={form.vehicleType} onValueChange={(v) => set('vehicleType', v)}>
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
                <Label>Vehicle Number <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g. AP16AB1234"
                  maxLength={10}
                  value={form.vehicleNumber}
                  onChange={(e) => set('vehicleNumber', e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Operating Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5" />
              Operating Areas <span className="text-destructive">*</span>
            </CardTitle>
            <CardDescription>Select where you want to operate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>State <span className="text-destructive">*</span></Label>
              <Select value={form.selectedState} onValueChange={loadDistricts}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {states.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {districts.length > 0 && (
              <div className="space-y-1.5">
                <Label>Operating Districts <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal">(select one or more)</span></Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2 border rounded-lg">
                  {districts.map((district) => (
                    <label key={district} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded">
                      <input
                        type="checkbox"
                        checked={form.districtIds.includes(district)}
                        onChange={() => toggleDistrict(district)}
                        className="h-4 w-4"
                      />
                      <span className="text-xs">{district}</span>
                    </label>
                  ))}
                </div>
                {form.districtIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">{form.districtIds.length} district{form.districtIds.length !== 1 ? 's' : ''} selected</p>
                )}
              </div>
            )}

            {form.districtIds.length > 0 && (
              <div className="space-y-1.5">
                <Label>Operating Points <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal">(select one or more)</span></Label>
                {loadingPoints ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading points…
                  </div>
                ) : points.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No points found for selected districts.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 border rounded-lg">
                    {points.map((point) => (
                      <label key={point.id} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded">
                        <input
                          type="checkbox"
                          checked={form.selectedPoints.includes(point.id)}
                          onChange={() => togglePoint(point.id)}
                          className="h-4 w-4"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{point.pointName}</p>
                          <p className="text-xs text-muted-foreground truncate">{point.village}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {form.selectedPoints.length > 0 && (
                  <p className="text-xs text-muted-foreground">{form.selectedPoints.length} point{form.selectedPoints.length !== 1 ? 's' : ''} selected</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button className="w-full" size="lg" disabled={loading} onClick={handleSubmit}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : 'Submit Onboarding'}
        </Button>
      </div>
    </div>
  )
}
