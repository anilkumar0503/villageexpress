'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Truck, PackageSearch, MapPin, ChevronRight, Camera, FileText, AlertCircle, Upload, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { CameraCapture } from '@/components/camera-capture'
import { FileUpload } from '@/components/file-upload'

type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFF_DUTY'
type BookingSegment = {
  id: string
  status: string
  sequenceOrder: number
  booking: {
    id: string
    bookingNumber: string
    status: string
    parcelWeight: number
    parcelType: string
    customer: { name: string; phone: string }
  }
  routeSegment: {
    fromLocation: { pointName: string; village: string }
    toLocation: { pointName: string; village: string }
  }
  pointManager: { id: string; name: string; phone: string } | null
}

const AVAILABILITY_COLORS: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  BUSY: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  OFF_DUTY: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const NEXT_STATUS: Record<string, string> = {
  ASSIGNED: 'PICKED_UP',
  PICKED_UP: 'IN_TRANSIT',
  IN_TRANSIT: 'OUT_FOR_DELIVERY',
}

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: 'Mark Picked Up',
  PICKED_UP: 'Mark In Transit',
  IN_TRANSIT: 'Mark Out for Delivery',
}

export default function CaptainPage() {
  const { accessToken } = useAuth()
  const [availability, setAvailability] = useState<AvailabilityStatus>('OFF_DUTY')
  const [segments, setSegments] = useState<BookingSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [advancing, setAdvancing] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 50
  const [total, setTotal] = useState(0)
  const [imageCaptureDialog, setImageCaptureDialog] = useState<{ segmentId: string; currentStatus: string } | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [kycDialog, setKycDialog] = useState<{ documentType: 'AADHAAR' | 'LICENSE' } | null>(null)
  const [resubmitting, setResubmitting] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [userStatus, setUserStatus] = useState<{ approvalStatus: string; isActive: boolean } | null>(null)

  async function fetchData() {
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) })
    const [profileRes, segmentsRes] = await Promise.all([
      fetch('/api/profile/me', { headers: { Authorization: `Bearer ${accessToken}` } }),
      fetch(`/api/bookings/segments/my?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
    ])

    const parseJson = async (res: Response, label: string) => {
      const text = await res.text()
      if (!res.ok || !text.startsWith('{')) {
        console.error(`[CAPTAIN] ${label} returned ${res.status}:`, text.slice(0, 200))
        return { success: false, error: `Server error ${res.status}` }
      }
      try {
        return JSON.parse(text)
      } catch (e) {
        console.error(`[CAPTAIN] ${label} invalid JSON:`, text.slice(0, 200))
        return { success: false, error: 'Invalid server response' }
      }
    }

    const [profileData, segmentsData] = await Promise.all([
      parseJson(profileRes, 'profile'),
      parseJson(segmentsRes, 'segments'),
    ])
    if (profileData.success) {
      if (profileData.data.captainProfile) {
        setAvailability(profileData.data.captainProfile.availabilityStatus)
        setProfile(profileData.data.captainProfile)
      }
      setUserStatus({
        approvalStatus: profileData.data.approvalStatus,
        isActive: profileData.data.isActive,
      })
    }
    if (segmentsData.success) {
      setSegments(segmentsData.data.items)
      setTotal(segmentsData.data.total)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [page])

  async function advanceStatus(segmentId: string, currentStatus: string) {
    const next = NEXT_STATUS[currentStatus]
    if (!next) return

    // Require image capture before marking as PICKED_UP
    if (next === 'PICKED_UP') {
      setImageCaptureDialog({ segmentId, currentStatus })
      return
    }

    setAdvancing(segmentId)
    await fetch(`/api/bookings/segments/${segmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ status: next }),
    })
    await fetchData()
    setAdvancing(null)
  }

  async function handleImageCapture(imageUrl: string) {
    if (!imageCaptureDialog) return
    setUploadingImage(true)

    try {
      // First get the segment to find the booking ID
      const segmentRes = await fetch(`/api/bookings/segments/${imageCaptureDialog.segmentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const segmentData = await segmentRes.json()

      if (!segmentData.success || !segmentData.data.booking) {
        alert('Failed to get booking information')
        setUploadingImage(false)
        return
      }

      const bookingId = segmentData.data.booking.id

      // Upload the validation image to the booking
      const res = await fetch(`/api/bookings/${bookingId}/upload-validation-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ imageUrl, imageType: 'PICKUP' }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          // Now advance the status after image is uploaded
          const next = NEXT_STATUS[imageCaptureDialog.currentStatus]
          setAdvancing(imageCaptureDialog.segmentId)
          await fetch(`/api/bookings/segments/${imageCaptureDialog.segmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ status: next }),
          })
          await fetchData()
          setAdvancing(null)
          setImageCaptureDialog(null)
        } else {
          alert(data.error || 'Failed to upload image')
        }
      } else {
        alert('Failed to upload image')
      }
    } catch (err) {
      console.error('Failed to upload image:', err)
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleAvailabilityChange(status: AvailabilityStatus) {
    setToggling(true)
    const res = await fetch('/api/profile/availability', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ availabilityStatus: status }),
    })
    const data = await res.json()
    if (data.success) {
      setAvailability(data.data.availabilityStatus)
    } else {
      if (data.bookings) {
        const segmentBookings = data.bookings.segments.map((b: any) => b.bookingNumber).join(', ')
        const directBookings = data.bookings.direct.map((b: any) => b.bookingNumber).join(', ')
        const allBookings = [segmentBookings, directBookings].filter(Boolean).join(', ')
        alert(`${data.error}\n\nActive bookings: ${allBookings}`)
      } else {
        alert(data.error || 'Failed to update availability')
      }
    }
    setToggling(false)
  }

  async function handleKycResubmit(documentType: 'AADHAAR' | 'LICENSE', documentNumber?: string, documentPhoto?: string) {
    setResubmitting(true)
    const res = await fetch('/api/profile/kyc/resubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ documentType, documentNumber, documentPhoto }),
    })
    const data = await res.json()
    if (data.success) {
      setProfile(data.data)
      setKycDialog(null)
      alert('Document submitted for verification')
    } else {
      alert(data.error || 'Failed to submit document')
    }
    setResubmitting(false)
  }

  const [earnings, setEarnings] = useState<{ pending: number; approved: number; paid: number } | null>(null)

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/commissions/my', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r: Response) => r.json())
      .then((d) => { if (d.success) setEarnings(d.data.summary) })
  }, [accessToken])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  const activeSegments = segments.filter((s) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status))
  const completedSegments = segments.filter((s) => s.status === 'DELIVERED')
  const regularSegments = activeSegments.filter((s: any) => s.booking.status !== 'CANCELLED')
  const cancelledSegments = activeSegments.filter((s: any) => s.booking.status === 'CANCELLED')
  const isAccountOk = userStatus?.approvalStatus === 'APPROVED' && userStatus?.isActive
  const kycIssues = profile ? [
    profile.aadhaarVerificationStatus === 'REJECTED' && { doc: 'AADHAAR' as const, label: 'Aadhaar Card', reason: profile.aadhaarRejectionReason },
    profile.licenseVerificationStatus === 'REJECTED' && { doc: 'LICENSE' as const, label: 'Driving License', reason: profile.licenseRejectionReason },
  ].filter(Boolean) as { doc: 'AADHAAR' | 'LICENSE'; label: string; reason: string }[] : []

  const STATUS_BORDER: Record<string, string> = {
    ASSIGNED:         'border-l-indigo-500',
    PICKED_UP:        'border-l-purple-500',
    IN_TRANSIT:       'border-l-orange-500',
    OUT_FOR_DELIVERY: 'border-l-cyan-500',
  }

  const renderAssignmentCard = (s: any, isCancelled: boolean) => (
    <Card key={s.id} className={`border-l-4 ${isCancelled ? 'border-l-destructive opacity-75' : STATUS_BORDER[s.status] ?? 'border-l-border'}`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold">{s.booking.bookingNumber}</span>
              <Badge variant="outline" className="text-xs">Seg {s.sequenceOrder}</Badge>
              <Badge variant={isCancelled ? 'destructive' : 'secondary'} className="text-xs">
                {isCancelled ? 'Booking Cancelled' : s.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{s.routeSegment.fromLocation.pointName}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{s.routeSegment.toLocation.pointName}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>{s.booking.customer.name} · {s.booking.customer.phone}</span>
              <span>{s.booking.parcelWeight}kg · {s.booking.parcelType}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:flex-col sm:items-stretch sm:w-36">
            {NEXT_STATUS[s.status] && !isCancelled && (
              <Button
                size="sm"
                className="flex-1 sm:flex-none"
                disabled={advancing === s.id}
                onClick={() => advanceStatus(s.id, s.status)}
              >
                {advancing === s.id ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <ChevronRight className="h-4 w-4 mr-1.5" />}
                {STATUS_LABEL[s.status]}
              </Button>
            )}
            <Link href={`/bookings/${s.booking.id}`}>
              <Button variant="outline" size="sm" className="w-full">Details</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* ── Header row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Captain Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your deliveries and availability</p>
        </div>
        <Card className={`border-2 ${availability === 'AVAILABLE' ? 'border-green-400' : availability === 'BUSY' ? 'border-orange-400' : 'border-border'}`}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${availability === 'AVAILABLE' ? 'bg-green-500 animate-pulse' : availability === 'BUSY' ? 'bg-orange-500' : 'bg-gray-400'}`} />
            <span className="text-sm font-semibold">{availability.replace(/_/g, ' ')}</span>
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin ml-1" />
            ) : availability === 'BUSY' ? (
              <Button size="sm" variant="outline" className="h-7 text-xs ml-1" onClick={() => handleAvailabilityChange('AVAILABLE')}>
                Reset
              </Button>
            ) : (
              <Select value={availability} onValueChange={(v) => handleAvailabilityChange(v as AvailabilityStatus)} disabled={toggling}>
                <SelectTrigger className="h-7 w-28 text-xs border-0 shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Set Available</SelectItem>
                  <SelectItem value="OFF_DUTY">Set Off Duty</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Account / KYC warnings ── */}
      {userStatus && !isAccountOk && (
        <div className={`flex items-start gap-3 rounded-lg border p-4 ${userStatus.approvalStatus === 'REJECTED' ? 'border-destructive/40 bg-destructive/5' : 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10'}`}>
          {userStatus.approvalStatus === 'REJECTED'
            ? <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            : <Loader2 className="h-5 w-5 text-yellow-600 animate-spin mt-0.5 shrink-0" />}
          <div>
            <p className="font-semibold text-sm">{userStatus.approvalStatus === 'REJECTED' ? 'Registration Rejected' : 'Pending Approval'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {userStatus.approvalStatus === 'REJECTED'
                ? 'Your registration was rejected. Contact support for details.'
                : 'Your account is under review. You will be notified once approved.'}
            </p>
          </div>
        </div>
      )}
      {kycIssues.map((issue) => (
        <div key={issue.doc} className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-destructive">{issue.label} Rejected</p>
              {issue.reason && <p className="text-xs text-muted-foreground truncate">{issue.reason}</p>}
            </div>
          </div>
          <Button size="sm" variant="destructive" className="shrink-0 h-7 text-xs" onClick={() => setKycDialog({ documentType: issue.doc })}>
            <Upload className="h-3 w-3 mr-1" /> Resubmit
          </Button>
        </div>
      ))}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-primary">{regularSegments.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Active Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{completedSegments.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Delivered Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-yellow-600">₹{earnings ? earnings.pending.toFixed(0) : '—'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pending Earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-600">₹{earnings ? earnings.paid.toFixed(0) : '—'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Paid Out</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Assignments (full width tabs) ── */}
      <Tabs defaultValue="active">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1 gap-1.5">
            Active
            {regularSegments.length > 0 && <Badge variant="secondary" className="text-xs px-1.5 py-0">{regularSegments.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 gap-1.5">
            Delivered
            {completedSegments.length > 0 && <Badge variant="outline" className="text-xs px-1.5 py-0 bg-green-50 text-green-700 border-green-200">{completedSegments.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1 gap-1.5">
            Cancelled
            {cancelledSegments.length > 0 && <Badge variant="destructive" className="text-xs px-1.5 py-0">{cancelledSegments.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          {regularSegments.length > 0 ? regularSegments.map((s: any) => renderAssignmentCard(s, false)) : (
            <Card><CardContent className="flex flex-col items-center py-16 text-center">
              <PackageSearch className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No active assignments</p>
              <p className="text-sm text-muted-foreground mt-1">Set yourself as Available to receive bookings</p>
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4 space-y-3">
          {completedSegments.length > 0 ? completedSegments.map((s: any) => (
            <Card key={s.id} className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold">{s.booking.bookingNumber}</span>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Seg {s.sequenceOrder}</Badge>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Delivered</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{s.routeSegment.fromLocation.pointName}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{s.routeSegment.toLocation.pointName}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{s.booking.customer.name} · {s.booking.customer.phone}</span>
                      <span>{s.booking.parcelWeight}kg · {s.booking.parcelType}</span>
                    </div>
                  </div>
                  <Link href={`/bookings/${s.booking.id}`}>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card><CardContent className="flex flex-col items-center py-16 text-center">
              <PackageSearch className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No completed deliveries yet</p>
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4 space-y-3">
          {cancelledSegments.length > 0 ? cancelledSegments.map((s: any) => renderAssignmentCard(s, true)) : (
            <Card><CardContent className="flex flex-col items-center py-16 text-center">
              <PackageSearch className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No cancelled orders</p>
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))} disabled={page === Math.ceil(total / pageSize)}>Next</Button>
          </div>
        </div>
      )}

      {/* Image Capture Dialog */}
      <Dialog open={!!imageCaptureDialog} onOpenChange={(open) => !open && setImageCaptureDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Capture Pickup Confirmation Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please capture a photo of the parcel before marking it as picked up for verification purposes.
            </p>
            <CameraCapture
              onCapture={handleImageCapture}
              onCancel={() => setImageCaptureDialog(null)}
            />
            <div className="text-sm text-muted-foreground text-center">
              Or upload an existing image
            </div>
            <FileUpload
              folder="validation-images"
              accept="image/jpeg,image/png,image/webp"
              onUploadComplete={handleImageCapture}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* KYC Resubmit Dialog */}
      <Dialog open={!!kycDialog} onOpenChange={(open) => !open && setKycDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Resubmit {kycDialog?.documentType === 'AADHAAR' ? 'Aadhaar Card' : 'Driving License'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 relative">
            {resubmitting && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm text-muted-foreground">Submitting...</p>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Please upload a clear photo of your {kycDialog?.documentType === 'AADHAAR' ? 'Aadhaar card' : 'driving license'} for verification.
            </p>
            <FileUpload
              folder="kyc-documents"
              accept="image/jpeg,image/png,image/webp"
              onUploadComplete={(url) => handleKycResubmit(kycDialog!.documentType, undefined, url)}
            />
            <div className="text-sm text-muted-foreground text-center">
              Or enter document number
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={kycDialog?.documentType === 'AADHAAR' ? 'Aadhaar Number' : 'License Number'}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
                id="kyc-number"
                disabled={resubmitting}
              />
              <Button
                size="sm"
                disabled={resubmitting}
                onClick={() => {
                  const number = (document.getElementById('kyc-number') as HTMLInputElement)?.value
                  if (number) handleKycResubmit(kycDialog!.documentType, number)
                }}
              >
                {resubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
