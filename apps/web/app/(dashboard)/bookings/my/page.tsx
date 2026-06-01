'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import Link from 'next/link'
import { PackageSearch, Plus, Loader2, MapPin, Clock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'

type Booking = {
  id: string
  bookingNumber: string
  status: string
  parcelType: string
  deliveryPriority: string
  calculatedPrice: number
  estimatedDeliveryDate: string
  paymentStatus: string
  paymentMethod: string
  createdAt: string
  pickupLocation: { pointName: string; village: string; district: string }
  dropLocation: { pointName: string; village: string; district: string }
  captain: { displayId: string; name: string; phone: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500 text-white',
  CONFIRMED: 'bg-blue-500 text-white',
  ASSIGNED: 'bg-indigo-500 text-white',
  PICKED_UP: 'bg-purple-500 text-white',
  IN_TRANSIT: 'bg-orange-500 text-white',
  OUT_FOR_DELIVERY: 'bg-cyan-500 text-white',
  DELIVERED: 'bg-green-500 text-white',
  CANCELLED: 'bg-red-500 text-white',
  RETURN_INITIATED: 'bg-pink-500 text-white',
  RETURNED: 'bg-gray-500 text-white',
}

export default function MyBookingsPage() {
  const { accessToken } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL')
  const [parcelTypeFilter, setParcelTypeFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) })
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (paymentStatusFilter !== 'ALL') params.set('paymentStatus', paymentStatusFilter)
    if (paymentMethodFilter !== 'ALL') params.set('paymentMethod', paymentMethodFilter)
    if (parcelTypeFilter !== 'ALL') params.set('parcelType', parcelTypeFilter)
    if (priorityFilter !== 'ALL') params.set('deliveryPriority', priorityFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)

    fetch(`/api/bookings/my?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r: Response) => r.json())
      .then((d) => {
        if (d.success) { setBookings(d.data.items); setTotal(d.data.total) }
      })
      .finally(() => setLoading(false))
  }, [statusFilter, paymentStatusFilter, paymentMethodFilter, parcelTypeFilter, priorityFilter, dateFrom, dateTo, page, accessToken])

  return (
    <div className="space-y-6" data-testid="my-bookings-page">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-title">My Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="total-count">{total} total booking{total !== 1 ? 's' : ''}</p>
        </div>
        <Button asChild data-testid="new-booking-btn">
          <Link href="/bookings/new">
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap" data-testid="filters">
        <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="status-filter">
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.keys(STATUS_COLORS).map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Payment Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Payment</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Payment Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Methods</SelectItem>
            <SelectItem value="COD">COD</SelectItem>
            <SelectItem value="ONLINE">Online</SelectItem>
          </SelectContent>
        </Select>
        <Select value={parcelTypeFilter} onValueChange={setParcelTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Parcel Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="DOCUMENTS">Documents</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
            <SelectItem value="FRAGILE">Fragile</SelectItem>
            <SelectItem value="PERISHABLE">Perishable</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            <SelectItem value="STANDARD">Standard</SelectItem>
            <SelectItem value="EXPRESS">Express</SelectItem>
            <SelectItem value="OVERNIGHT">Overnight</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" />
          </div>
          {(dateFrom || dateTo || paymentStatusFilter !== 'ALL' || paymentMethodFilter !== 'ALL' || parcelTypeFilter !== 'ALL' || priorityFilter !== 'ALL') && (
            <Button variant="ghost" size="sm" onClick={() => {
              setDateFrom('')
              setDateTo('')
              setPaymentStatusFilter('ALL')
              setPaymentMethodFilter('ALL')
              setParcelTypeFilter('ALL')
              setPriorityFilter('ALL')
            }} className="mt-4">
              Clear
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48" data-testid="loading-state">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : bookings.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PackageSearch className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No bookings yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first booking to get started</p>
            <Button asChild size="sm">
              <Link href="/bookings/new"><Plus className="h-4 w-4 mr-2" />New Booking</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" data-testid="bookings-list">
          {bookings.map((booking) => (
            <Link key={booking.id} href={`/bookings/${booking.id}`}>
              <Card className="hover:border-primary/40 transition-colors cursor-pointer" data-testid={`booking-card-${booking.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold">{booking.bookingNumber}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[booking.status] ?? ''}`}>
                          {booking.status.replace(/_/g, ' ')}
                        </span>
                        <Badge variant="outline" className="text-xs">{booking.parcelType}</Badge>
                      </div>

                      <div className="flex items-start gap-4 text-sm">
                        <div className="flex items-start gap-1.5 flex-1 min-w-0">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-muted-foreground text-xs">Pickup</p>
                            <p className="font-medium truncate">{booking.pickupLocation.pointName}</p>
                            <p className="text-xs text-muted-foreground">{booking.pickupLocation.village}, {booking.pickupLocation.district}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-1.5 flex-1 min-w-0">
                          <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-muted-foreground text-xs">Drop</p>
                            <p className="font-medium truncate">{booking.dropLocation.pointName}</p>
                            <p className="text-xs text-muted-foreground">{booking.dropLocation.village}, {booking.dropLocation.district}</p>
                          </div>
                        </div>
                      </div>

                      {booking.captain && (
                        <p className="text-xs text-muted-foreground">
                          Captain: <span className="text-foreground">{booking.captain.name}</span> &middot; {booking.captain.phone}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-lg font-bold text-primary">&#8377;{Number(booking.calculatedPrice).toFixed(2)}</p>
                      <Badge variant={booking.paymentStatus === 'PAID' ? 'default' : 'secondary'} className="text-xs">
                        {booking.paymentStatus}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                        <Clock className="h-3 w-3" />
                        {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} bookings
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
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1)
                .filter(p => p === 1 || p === Math.ceil(total / pageSize) || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <span className="text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={page === p ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(p)}
                      className="w-8 h-8 p-0"
                    >
                      {p}
                    </Button>
                  </React.Fragment>
                ))}
            </div>
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
    </div>
  )
}
