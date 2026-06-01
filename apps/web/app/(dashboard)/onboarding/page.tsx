'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, ArrowRight, ArrowLeft, Truck, FileText, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileUpload } from '@/components/file-upload'
import { useAuth } from '@/hooks/use-auth'

type Step = 'kyc' | 'vehicle' | 'areas' | 'success'

export default function OnboardingPage() {
  const router = useRouter()
  const { accessToken } = useAuth()
  const [step, setStep] = useState<Step>('kyc')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [states, setStates] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [points, setPoints] = useState<any[]>([])

  const [form, setForm] = useState({
    aadhaarNumber: '', aadhaarFileUrl: '',
    drivingLicense: '', licenseFileUrl: '',
    vehicleType: '', vehicleNumber: '',
    districtIds: [] as string[],
    selectedPoints: [] as string[],
  })

  useEffect(() => {
    fetch('/api/locations/cascading')
      .then((r: Response) => r.json())
      .then((d) => { if (d.success) setStates(d.data.states) })
  }, [])

  async function loadDistricts(state: string) {
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
      return { ...f, districtIds, selectedPoints: [] }
    })
    loadPointsForDistricts()
  }

  async function loadPointsForDistricts() {
    if (form.districtIds.length === 0) {
      setPoints([])
      return
    }
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

  async function handleNext() {
    setError('')
    if (step === 'kyc') {
      if (!form.aadhaarNumber || !form.drivingLicense) {
        return setError('Please fill all required fields')
      }
      if (form.aadhaarNumber.length !== 12) return setError('Aadhaar number must be 12 digits')
      setStep('vehicle')
    } else if (step === 'vehicle') {
      if (!form.vehicleType || !form.vehicleNumber) {
        return setError('Please fill all required fields')
      }
      setStep('areas')
    } else if (step === 'areas') {
      if (form.districtIds.length === 0) return setError('Please select at least one operating district')
      if (form.selectedPoints.length === 0) return setError('Please select at least one operating point')
      await handleSubmit()
    }
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) return setError(data.error ?? 'Onboarding failed')
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
          <p className="text-sm text-muted-foreground mt-1">Step {step === 'kyc' ? 1 : step === 'vehicle' ? 2 : 3} of 3</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-2 rounded-full ${step === 'kyc' || step === 'vehicle' || step === 'areas' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex-1 h-2 rounded-full ${step === 'vehicle' || step === 'areas' ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex-1 h-2 rounded-full ${step === 'areas' ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        {step === 'kyc' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                KYC Documents
              </CardTitle>
              <CardDescription>Upload your identity documents for verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Aadhaar Number *</Label>
                  <Input maxLength={12} placeholder="12-digit number" value={form.aadhaarNumber} onChange={(e) => set('aadhaarNumber', e.target.value.replace(/\D/g, ''))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Driving License No. *</Label>
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
        )}

        {step === 'vehicle' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Vehicle Details
              </CardTitle>
              <CardDescription>Tell us about the vehicle you'll use for deliveries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Vehicle Type *</Label>
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
                  <Label>Vehicle Number *</Label>
                  <Input placeholder="e.g. AP16AB1234" value={form.vehicleNumber} onChange={(e) => set('vehicleNumber', e.target.value.toUpperCase())} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'areas' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Operating Areas
              </CardTitle>
              <CardDescription>Select where you want to operate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Operating State</Label>
                <Select onValueChange={loadDistricts}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
                <Label>Operating Points (at least one required)</Label>
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
              </div>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          {step !== 'kyc' && (
            <Button variant="outline" onClick={() => setStep(step === 'vehicle' ? 'kyc' : 'vehicle')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button className="flex-1" disabled={loading} onClick={handleNext}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {step === 'areas' ? 'Complete Onboarding' : 'Next'}
            {step !== 'areas' && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
