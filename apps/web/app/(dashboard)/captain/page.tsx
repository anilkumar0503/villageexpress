'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Truck, PackageSearch, MapPin, ChevronRight, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

  async function fetchData() {
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) })
    const [profileRes, segmentsRes] = await Promise.all([
      fetch('/api/profile/me', { headers: { Authorization: `Bearer ${accessToken}` } }),
      fetch(`/api/bookings/segments/my?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
    ])
    const [profileData, segmentsData] = await Promise.all([profileRes.json(), segmentsRes.json()])
    if (profileData.success && profileData.data.captainProfile) {
      setAvailability(profileData.data.captainProfile.availabilityStatus)
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

  const [earnings, setEarnings] = useState<{ pending: number; approved: number; paid: number } | null>(null)

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/commissions/my', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success) setEarnings(d.data.summary) })
  }, [accessToken])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  const activeSegments = segments.filter((s) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status))
  const completedSegments = segments.filter((s) => s.status === 'DELIVERED')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Captain Dashboard</h1>

     

      {/* Two-column layout: Left (Stats + Availability + Active), Right (Completed) */}
      <div className="grid gap-6 sm:grid-cols-5">
        {/* Left column: Stats + Availability + Active Assignments */}
        <div className="sm:col-span-3 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-primary">{activeSegments.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Active Segments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-green-600">{completedSegments.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Delivered Today</p>
              </CardContent>
            </Card>
          </div>

          {/* Earnings summary */}
          {earnings && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">My Earnings</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-6">
                <div>
                  <p className="text-lg font-bold text-yellow-600">₹{earnings.pending.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">₹{earnings.approved.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">₹{earnings.paid.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Paid</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Availability Toggle */}
          <Card className="border-2" style={{ borderColor: availability === 'AVAILABLE' ? 'var(--color-primary)' : undefined }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-5 w-5" />
                Availability Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${AVAILABILITY_COLORS[availability]}`}>
                  {availability.replace(/_/g, ' ')}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {availability === 'AVAILABLE' && 'You are visible for new assignments'}
                  {availability === 'BUSY' && 'You are assigned to an active booking'}
                  {availability === 'OFF_DUTY' && 'You are not accepting new bookings'}
                </p>
              </div>
              {availability === 'BUSY' ? (
                <Button
                  size="sm"
                  onClick={() => handleAvailabilityChange('AVAILABLE')}
                  disabled={toggling}
                  variant="outline"
                >
                  {toggling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Reset to Available
                </Button>
              ) : (
                <Select
                  value={availability}
                  onValueChange={(v) => handleAvailabilityChange(v as AvailabilityStatus)}
                  disabled={toggling}
                >
                  <SelectTrigger className="w-40">
                    {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Active Assignments */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Active Assignments</h2>
            {activeSegments.length > 0 ? (
              <div className="space-y-3">
                {activeSegments.map((s) => (
                  <Card key={s.id} className="border-primary/20">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold">{s.booking.bookingNumber}</span>
                            <Badge variant="secondary" className="text-xs">Seg {s.sequenceOrder}</Badge>
                            <Badge variant="outline" className="text-xs">{s.status.replace(/_/g, ' ')}</Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{s.routeSegment.fromLocation.pointName} → {s.routeSegment.toLocation.pointName}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{s.booking.customer.name} &middot; {s.booking.customer.phone}</p>
                          <p className="text-xs text-muted-foreground">{s.booking.parcelWeight}kg • {s.booking.parcelType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {NEXT_STATUS[s.status] && (
                          <Button
                            size="sm"
                            className="flex-1"
                            disabled={advancing === s.id}
                            onClick={() => advanceStatus(s.id, s.status)}
                          >
                            {advancing === s.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                            {STATUS_LABEL[s.status]}
                          </Button>
                        )}
                        <Link href={`/bookings/${s.booking.id}`}>
                          <Button variant="outline" size="sm">Details</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <PackageSearch className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-medium">No active assignments</p>
                  <p className="text-sm text-muted-foreground">Set yourself as Available to receive bookings</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right column: Completed Deliveries */}
        <div className="sm:col-span-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Completed Deliveries</h2>
          {completedSegments.length > 0 ? (
            <div className="space-y-3 max-h-[95vh] overflow-y-auto pr-2">
              {completedSegments.map((s) => (
                <Card key={s.id} className="border-green-200 dark:border-green-900/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">{s.booking.bookingNumber}</span>
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">Seg {s.sequenceOrder}</Badge>
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">{s.status.replace(/_/g, ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{s.routeSegment.fromLocation.pointName} → {s.routeSegment.toLocation.pointName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.booking.customer.name} &middot; {s.booking.customer.phone}</p>
                        <p className="text-xs text-muted-foreground">{s.booking.parcelWeight}kg • {s.booking.parcelType}</p>
                        <p className="text-xs text-muted-foreground mt-1">Delivered today</p>
                      </div>
                    </div>
                    <Link href={`/bookings/${s.booking.id}`}>
                      <Button variant="outline" size="sm" className="w-full">View Details</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <PackageSearch className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="font-medium">No completed deliveries today</p>
                <p className="text-sm text-muted-foreground">Completed deliveries will appear here</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} assignments
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
              disabled={page === Math.ceil(total / pageSize)}
            >
              Next
            </Button>
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
    </div>
  )
}
