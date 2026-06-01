'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save, User, Truck, MapPin, Store, Lock, CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/file-upload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'

type Profile = {
  id: string; displayId: string; name: string; email: string | null; phone: string
  pointManagerProfile: { shopName: string; shopPhoto: string | null; shopLocation: { pointName: string; village: string; district: string } | null } | null
  captainProfile: { vehicleType: string; vehicleNumber: string; availabilityStatus: string; districtId: string; pointAssignments?: { locationId: string; location: { pointName: string; village: string; district: string } }[] } | null
  userRoles: { isPrimary: boolean; role: { name: string } }[]
}

export default function ProfilePage() {
  const { accessToken } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [captainForm, setCaptainForm] = useState({ vehicleType: '', vehicleNumber: '' })
  const [pmForm, setPmForm] = useState({ shopName: '', shopPhoto: '' })
  const [availablePoints, setAvailablePoints] = useState<any[]>([])
  const [selectedPoints, setSelectedPoints] = useState<string[]>([])
  const [selectedPointsDetails, setSelectedPointsDetails] = useState<any[]>([])
  const [states, setStates] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [activeTab, setActiveTab] = useState('personal')

  useEffect(() => {
    // Load states for district selection
    fetch('/api/locations/cascading')
      .then((r: Response) => r.json())
      .then((d) => { if (d.success) setStates(d.data.states) })
  }, [])

  useEffect(() => {
    fetch('/api/profile/me', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r: Response) => r.json())
      .then((d) => {
        if (d.success) {
          const p: Profile = d.data
          setProfile(p)
          setForm({ name: p.name, email: p.email ?? '', phone: p.phone })
          if (p.captainProfile) {
            setCaptainForm({ vehicleType: p.captainProfile.vehicleType, vehicleNumber: p.captainProfile.vehicleNumber })
            // Get district from point assignments if available, otherwise use districtId
            let districtToUse = p.captainProfile.districtId
            if (p.captainProfile.pointAssignments && p.captainProfile.pointAssignments.length > 0) {
              districtToUse = p.captainProfile.pointAssignments[0].location.district
            }
            setSelectedDistrict(districtToUse)
            if (p.captainProfile.pointAssignments) {
              setSelectedPoints(p.captainProfile.pointAssignments.map((pa) => pa.locationId))
              setSelectedPointsDetails(p.captainProfile.pointAssignments.map((pa) => pa.location))
            }
            // Load available points from captain's district (only active)
            fetch(`/api/locations?district=${encodeURIComponent(districtToUse)}&isActive=true`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
              .then((r: Response) => r.json())
              .then((ld) => { if (ld.success) setAvailablePoints(ld.data.items) })
          }
          if (p.pointManagerProfile) setPmForm({ shopName: p.pointManagerProfile.shopName, shopPhoto: p.pointManagerProfile.shopPhoto ?? '' })
        }
      })
      .finally(() => setLoading(false))
  }, [accessToken])

  async function save(body: Record<string, unknown>) {
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) return setError(data.error ?? 'Save failed')
      setSuccess('Saved successfully')
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  async function handleProfile() {
    await save({ name: form.name, email: form.email, phone: form.phone })
  }

  async function handlePassword() {
    if (pwForm.newPassword !== pwForm.confirmPassword) return setError('Passwords do not match')
    await save({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
    if (!error) setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  async function handleCaptain() {
    await save({ vehicleType: captainForm.vehicleType, vehicleNumber: captainForm.vehicleNumber, selectedPoints, districtId: selectedDistrict })
    // Refresh profile to get updated point details
    const res = await fetch('/api/profile/me', { headers: { Authorization: `Bearer ${accessToken}` } })
    const data = await res.json()
    if (data.success && data.data.captainProfile?.pointAssignments) {
      setSelectedPointsDetails(data.data.captainProfile.pointAssignments.map((pa: any) => pa.location))
    }
  }

  function togglePoint(pointId: string) {
    setSelectedPoints((prev) =>
      prev.includes(pointId) ? prev.filter((id) => id !== pointId) : [...prev, pointId]
    )
  }

  async function loadDistricts(state: string) {
    setSelectedState(state)
    setDistricts([])
    setSelectedDistrict('')
    setAvailablePoints([])
    // Don't clear selectedPoints - preserve them for filtering later
    const res = await fetch(`/api/locations/cascading?state=${encodeURIComponent(state)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    if (data.success) setDistricts(data.data.districts)
  }

  async function loadPoints(district: string) {
    setSelectedDistrict(district)
    // Load points for the selected district (only active points)
    const res = await fetch(`/api/locations?district=${encodeURIComponent(district)}&isActive=true`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    if (data.success) {
      const newPoints = data.data.items
      setAvailablePoints(newPoints)
      // Preserve selected points - keep them checked if they exist in the new district
      // Points not in the new district will remain selected but won't be visible
    }
  }

  async function handlePM() {
    await save({ shopName: pmForm.shopName, shopPhoto: pmForm.shopPhoto })
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (!profile) return null

  const roles = profile.userRoles.map((ur: any) => ur.role.name)
  const isCaptain = roles.includes('CAPTAIN')
  const isPM = roles.includes('POINT_MANAGER')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-2xl border">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
          <User className="h-8 w-8 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">{profile.displayId}</span>
            {roles.map((r) => (
              <Badge key={r} variant="default" className="text-xs font-medium">
                {r.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <Info className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          {isCaptain && (
            <TabsTrigger value="vehicle" className="gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Vehicle</span>
            </TabsTrigger>
          )}
          {isCaptain && (
            <TabsTrigger value="points" className="gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Points</span>
            </TabsTrigger>
          )}
          {isPM && (
            <TabsTrigger value="shop" className="gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Shop</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                    placeholder="10-digit number"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicle Tab */}
        {isCaptain && (
          <TabsContent value="vehicle" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Details</CardTitle>
                <CardDescription>Update your vehicle information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                    <Select value={captainForm.vehicleType} onValueChange={(v) => setCaptainForm((f) => ({ ...f, vehicleType: v }))}>
                      <SelectTrigger id="vehicleType"><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                      <SelectContent>
                        {['BIKE', 'AUTO', 'MINI_VAN', 'VAN'].map((v) => (
                          <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                    <Input
                      id="vehicleNumber"
                      value={captainForm.vehicleNumber}
                      onChange={(e) => setCaptainForm((f) => ({ ...f, vehicleNumber: e.target.value.toUpperCase() }))}
                      placeholder="TS00AB1234"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleCaptain} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Vehicle Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Points Tab */}
        {isCaptain && (
          <TabsContent value="points" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Operating District & Points</CardTitle>
                <CardDescription>Select your preferred district and the points where you can operate. You must be assigned to both pickup and drop points to receive bookings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select onValueChange={loadDistricts}>
                      <SelectTrigger id="state"><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>{states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Select disabled={!selectedState} value={selectedDistrict} onValueChange={loadPoints}>
                      <SelectTrigger id="district"><SelectValue placeholder="Select district" /></SelectTrigger>
                      <SelectContent>{districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {!selectedState || !selectedDistrict ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">Select a state and district to see available points</p>
                  </div>
                ) : availablePoints.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No active points found in this district</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
                      {availablePoints.map((point) => (
                        <label
                          key={point.id}
                          className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-accent ${
                            selectedPoints.includes(point.id) ? 'bg-primary/10 border-primary' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPoints.includes(point.id)}
                            onChange={() => togglePoint(point.id)}
                            className="h-4 w-4 mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{point.pointName}</p>
                            <p className="text-xs text-muted-foreground truncate">{point.village}, {point.district}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {selectedPoints.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>{selectedPoints.length} point{selectedPoints.length !== 1 ? 's' : ''} selected</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={handleCaptain} disabled={saving || !selectedDistrict || selectedPoints.length === 0}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save District & Points
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Points Tab - Saved Points Card */}
        {isCaptain && selectedPointsDetails.length > 0 && (
          <TabsContent value="points" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Saved Points</CardTitle>
                <CardDescription>Points you are currently assigned to operate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedPointsDetails.map((point, index) => (
                    <div key={point.id || index} className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{point.pointName}</p>
                        <p className="text-xs text-muted-foreground">{point.village}, {point.district}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Shop Tab */}
        {isPM && (
          <TabsContent value="shop" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Shop Details</CardTitle>
                <CardDescription>Update your shop information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input
                    id="shopName"
                    value={pmForm.shopName}
                    onChange={(e) => setPmForm((f) => ({ ...f, shopName: e.target.value }))}
                    placeholder="Enter shop name"
                  />
                </div>
                {profile.pointManagerProfile?.shopLocation && (
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.pointManagerProfile.shopLocation.pointName} — {profile.pointManagerProfile.shopLocation.village}, {profile.pointManagerProfile.shopLocation.district}
                      </p>
                    </div>
                  </div>
                )}
                <Separator />
                <div className="space-y-2">
                  <Label>Shop Photo</Label>
                  <FileUpload
                    folder="shop-photos"
                    accept="image/jpeg,image/png,image/webp"
                    label="Upload shop photo"
                    currentUrl={pmForm.shopPhoto}
                    onUploadComplete={(url) => setPmForm((f) => ({ ...f, shopPhoto: url }))}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handlePM} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Shop Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password (not available for OTP-only accounts)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handlePassword} disabled={saving || !pwForm.currentPassword || !pwForm.newPassword}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
