'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Search, PackageSearch, UserCheck, IndianRupee, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'

type Booking = {
  id: string
  bookingNumber: string
  status: string
  calculatedPrice: number
  paymentStatus: string
  paymentMethod: string
  createdAt: string
  customer: { name: string; phone: string }
  pickupLocation: { pointName: string; village: string }
  dropLocation: { pointName: string; village: string }
  pointManager: { name: string } | null
  captain: { name: string } | null
}

type Captain = { id: string; displayId: string; name: string; phone: string; captainProfile: { vehicleType: string; vehicleNumber: string; availabilityStatus: string } | null }

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-800',
  PICKED_UP: 'bg-purple-100 text-purple-800',
  IN_TRANSIT: 'bg-orange-100 text-orange-800',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'ASSIGNED',
  PICKED_UP: 'IN_TRANSIT',
  IN_TRANSIT: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
}

export default function AllBookingsPage() {
  const { accessToken } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [fromLocationFilter, setFromLocationFilter] = useState('ALL')
  const [toLocationFilter, setToLocationFilter] = useState('ALL')
  const [total, setTotal] = useState(0)
  const [assignBookingId, setAssignBookingId] = useState<string | null>(null)
  const [captains, setCaptains] = useState<Captain[]>([])
  const [captainsLoading, setCaptainsLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [locations, setLocations] = useState<{ id: string; pointName: string; village: string; district: string }[]>([])
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)
  const [paymentDialog, setPaymentDialog] = useState<{ bookingId: string; booking: Booking } | null>(null)

  async function fetchBookings() {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '50' })
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (fromLocationFilter !== 'ALL') params.set('fromLocationId', fromLocationFilter)
    if (toLocationFilter !== 'ALL') params.set('toLocationId', toLocationFilter)
    const res = await fetch(`/api/bookings?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } })
    const data = await res.json()
    if (data.success) { setBookings(data.data.items); setTotal(data.data.total) }
    setLoading(false)
  }

  useEffect(() => { fetchBookings() }, [statusFilter, fromLocationFilter, toLocationFilter])

  useEffect(() => {
    fetch('/api/locations?locationType=POINT&pageSize=200', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r: Response) => r.json())
      .then((d) => { if (d.success) setLocations(d.data.items) })
  }, [accessToken])

  async function openAssign(bookingId: string) {
    setAssignBookingId(bookingId)
    setCaptainsLoading(true)
    const res = await fetch('/api/users?role=CAPTAIN&approvalStatus=APPROVED&pageSize=50', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    if (data.success) setCaptains(data.data.items)
    setCaptainsLoading(false)
  }

  async function handleAssign(captainId: string) {
    if (!assignBookingId) return
    setAssigning(true)
    await fetch(`/api/bookings/${assignBookingId}/assign-captain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ captainId }),
    })
    setAssigning(false)
    setAssignBookingId(null)
    fetchBookings()
  }

  async function handleStatusChange(bookingId: string, status: string) {
    await fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ status }),
    })
    fetchBookings()
  }

  async function processPayment(bookingId: string, paymentMethod: 'WALLET' | 'COD') {
    setProcessingPayment(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ paymentMethod }),
      })
      const data = await res.json()
      if (data.success) {
        fetchBookings()
        setPaymentDialog(null)
      } else {
        alert(data.error || 'Failed to process payment')
      }
    } catch (err) {
      console.error('Error processing payment:', err)
      alert('Failed to process payment')
    } finally {
      setProcessingPayment(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} total booking{total !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.keys(STATUS_COLORS).map((s: string) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fromLocationFilter} onValueChange={setFromLocationFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="From Location" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All From</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>{loc.pointName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={toLocationFilter} onValueChange={setToLocationFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="To Location" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All To</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>{loc.pointName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        {loading ? (
          <CardContent className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : bookings.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PackageSearch className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No bookings found</p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Captain</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Link href={`/bookings/${b.id}`} className="font-mono text-sm font-semibold hover:text-primary">
                      {b.bookingNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleDateString('en-IN')}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{b.customer.name}</p>
                    <p className="text-xs text-muted-foreground">{b.customer.phone}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs">{b.pickupLocation.pointName}</p>
                    <p className="text-xs text-muted-foreground">&#8594; {b.dropLocation.pointName}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-sm">&#8377;{Number(b.calculatedPrice).toFixed(0)}</p>
                    <Badge variant="outline" className="text-xs mt-0.5">{b.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[b.status] ?? ''}`}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {b.captain ? (
                      <p className="text-sm">{b.captain.name}</p>
                    ) : (
                      <span className="text-muted-foreground text-xs">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {b.paymentStatus === 'PENDING_PAYMENT' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setPaymentDialog({ bookingId: b.id, booking: b })}>
                          <IndianRupee className="h-3 w-3" />Process Payment
                        </Button>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openAssign(b.id)}>
                          <UserCheck className="h-3 w-3" />Assign
                        </Button>
                      )}
                      {NEXT_STATUS[b.status] && b.status !== 'CONFIRMED' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(b.id, NEXT_STATUS[b.status])}>
                          {NEXT_STATUS[b.status].replace(/_/g, ' ')}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Assign Captain Dialog */}
      <Dialog open={!!assignBookingId} onOpenChange={(open) => !open && setAssignBookingId(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Assign Captain</DialogTitle></DialogHeader>
          {captainsLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : captains.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No approved captains available.</p>
          ) : (
            <div className="space-y-2">
              {captains.map((c: any) => {
                const isBusy = c.captainProfile?.availabilityStatus === 'BUSY'
                return (
                  <button
                    key={c.id}
                    disabled={isBusy || assigning}
                    onClick={() => handleAssign(c.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                  >
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.displayId} &middot; {c.phone}</p>
                      {c.captainProfile && (
                        <p className="text-xs text-muted-foreground">{c.captainProfile.vehicleType} &middot; {c.captainProfile.vehicleNumber}</p>
                      )}
                    </div>
                    <Badge variant={isBusy ? 'secondary' : 'default'} className="text-xs">
                      {c.captainProfile?.availabilityStatus ?? 'UNKNOWN'}
                    </Badge>
                  </button>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Processing Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={(open) => !open && setPaymentDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Process Payment</DialogTitle></DialogHeader>
          {paymentDialog && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Booking Number</span>
                  <span className="font-mono text-sm font-medium">{paymentDialog.booking.bookingNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Customer</span>
                  <span className="text-sm font-medium">{paymentDialog.booking.customer.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Payment Method</span>
                  <span className="text-sm font-medium">{paymentDialog.booking.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Amount</span>
                  <span className="text-2xl font-bold text-primary">&#8377;{Number(paymentDialog.booking.calculatedPrice).toFixed(2)}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Select payment method to process this booking payment.
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={processingPayment === paymentDialog.bookingId}
                  onClick={() => processPayment(paymentDialog.bookingId, 'WALLET')}
                >
                  {processingPayment === paymentDialog.bookingId ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Wallet className="h-4 w-4 mr-2" />
                  )}
                  Wallet
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={processingPayment === paymentDialog.bookingId}
                  onClick={() => processPayment(paymentDialog.bookingId, 'COD')}
                >
                  {processingPayment === paymentDialog.bookingId ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <IndianRupee className="h-4 w-4 mr-2" />
                  )}
                  COD
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
