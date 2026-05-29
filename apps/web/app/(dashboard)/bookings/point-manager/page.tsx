'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, PackageSearch, MapPin, CheckCircle, Truck, ArrowRight, Package, User, RefreshCw, X, IndianRupee, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'

type JourneyStop = {
  id: string
  sequenceOrder: number
  status: string
  routeSegment: {
    fromLocation: { id: string; pointName: string }
    toLocation: { id: string; pointName: string }
  }
}

type BookingSegment = {
  id: string
  status: string
  sequenceOrder: number
  pmRole: 'INCOMING' | 'OUTGOING'
  codCollectedAt: string | null
  vehicleType: string | null
  booking: {
    id: string
    bookingNumber: string
    status: string
    parcelWeight: number
    parcelType: string
    deliveryPriority: string
    calculatedPrice: number
    paymentStatus: string
    paymentMethod: string
    codCollectedAt: string | null
    customer: { name: string; phone: string }
    segments: JourneyStop[]
  }
  routeSegment: {
    fromLocation: { id: string; pointName: string; village: string }
    toLocation: { id: string; pointName: string; village: string }
  }
  pointManager: { id: string; name: string; phone: string } | null
  captain: { id: string; name: string; phone: string; captainProfile?: { vehicleType: string; vehicleNumber: string } } | null
}

type Captain = {
  id: string
  name: string
  phone: string
  vehicleType: string
  vehicleNumber: string
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:           { label: 'Pending',          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',  dot: 'bg-yellow-500' },
  RECEIVED_AT_POINT: { label: 'Received at Point', color: 'bg-teal-100 text-teal-800 border-teal-200',       dot: 'bg-teal-500' },
  ASSIGNED:          { label: 'Captain Assigned',  color: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
  PICKED_UP:         { label: 'Picked Up',         color: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
  IN_TRANSIT:        { label: 'In Transit',        color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
  OUT_FOR_DELIVERY:  { label: 'Out for Delivery',  color: 'bg-cyan-100 text-cyan-800 border-cyan-200',       dot: 'bg-cyan-500' },
  DELIVERED:         { label: 'Delivered',         color: 'bg-green-100 text-green-800 border-green-200',    dot: 'bg-green-500' },
  CANCELLED:         { label: 'Cancelled',         color: 'bg-red-100 text-red-800 border-red-200',          dot: 'bg-red-500' },
}

const PRIORITY_COLOR: Record<string, string> = {
  STANDARD:  'bg-slate-100 text-slate-700',
  EXPRESS:   'bg-blue-100 text-blue-700',
  OVERNIGHT: 'bg-purple-100 text-purple-700',
}

const TABS = ['NEEDS_ACTION', 'ALL', 'PENDING', 'RECEIVED_AT_POINT', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']

function MetricCard({ label, value, icon: Icon, color, highlight }: { label: string; value: string | number; icon: any; color: string; highlight?: boolean }) {
  return (
    <Card className={`${highlight ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </div>
          <Icon className={`h-5 w-5 ${color} opacity-70`} />
        </div>
      </CardContent>
    </Card>
  )
}

export default function PMQueuePage() {
  const { accessToken, handleAuthError } = useAuth()
  const [allSegments, setAllSegments] = useState<BookingSegment[]>([])
  const [allSegmentsForMetrics, setAllSegmentsForMetrics] = useState<BookingSegment[]>([])
  const [captains, setCaptains] = useState<Captain[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('NEEDS_ACTION')
  const [page, setPage] = useState(1)
  const pageSize = 50
  const [total, setTotal] = useState(0)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [selectedCaptains, setSelectedCaptains] = useState<Record<string, string>>({})
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [cancelDialog, setCancelDialog] = useState<{ segmentId: string; bookingId: string } | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [collectingCod, setCollectingCod] = useState<string | null>(null)
  const [codDialog, setCodDialog] = useState<{ segmentId: string; booking: any; location: string } | null>(null)
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)
  const [paymentDialog, setPaymentDialog] = useState<{ bookingId: string; booking: any } | null>(null)
  const [settlementDialog, setSettlementDialog] = useState(false)
  const [settlementData, setSettlementData] = useState<any>(null)
  const [settlementLoading, setSettlementLoading] = useState(false)
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [submittingSettlement, setSubmittingSettlement] = useState(false)
  const [bankReferenceNumber, setBankReferenceNumber] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [metrics, setMetrics] = useState({
    todayPickups: 0,
    todayDeliveries: 0,
    todayCODCollected: 0,
    pendingCOD: 0,
    totalCommission: 0,
    paidCommission: 0,
  })

  useEffect(() => {
    fetchData()
    fetchAllSegmentsForMetrics()
    fetchCaptains()
    fetchMetrics()
  }, [accessToken, statusFilter, page])

  async function fetchData() {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) })
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    const res = await fetch(`/api/bookings/segments?${params}`, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (res.status === 401) {
      handleAuthError()
      return
    }
    const d = await res.json()
    console.log('API Response:', d)
    if (d.success) {
      console.log('Segments data:', d.data.items)
      setAllSegments(d.data.items); setTotal(d.data.total)
    } else {
      console.error('API Error:', d.error)
      alert(d.error || 'Failed to fetch segments')
    }
    setLoading(false)
  }

  async function fetchAllSegmentsForMetrics() {
    const res = await fetch(`/api/bookings/segments?pageSize=1000`, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (res.status === 401) {
      handleAuthError()
      return
    }
    const d = await res.json()
    if (d.success) {
      setAllSegmentsForMetrics(d.data.items)
    }
  }

  async function openSettlementDialog() {
    setSettlementLoading(true)
    setSettlementDialog(true)
    const res = await fetch('/api/cod-settlement', { headers: { Authorization: `Bearer ${accessToken}` } })
    if (res.status === 401) {
      handleAuthError()
      setSettlementDialog(false)
      setSettlementLoading(false)
      return
    }
    const d = await res.json()
    if (d.success) {
      setSettlementData(d.data)
    } else {
      alert(d.error || 'Failed to fetch settlement data')
      setSettlementDialog(false)
    }
    setSettlementLoading(false)
  }

  async function submitSettlement() {
    if (selectedCollections.length === 0) {
      alert('Please select at least one collection to settle')
      return
    }

    setSubmittingSettlement(true)
    const res = await fetch('/api/cod-settlement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        collectionIds: selectedCollections,
        remittanceMethod: 'MANUAL',
        bankReferenceNumber,
        notes: 'Point manager COD settlement',
      }),
    })

    if (res.status === 401) {
      handleAuthError()
      setSubmittingSettlement(false)
      return
    }

    const data = await res.json()
    if (data.success) {
      alert(`Settlement submitted successfully for ₹${data.data.totalAmount}`)
      setSettlementDialog(false)
      setSelectedCollections([])
      setBankReferenceNumber('')
      await openSettlementDialog()
    } else {
      alert(data.error || 'Failed to submit settlement')
    }
    setSubmittingSettlement(false)
  }

  async function fetchCaptains() {
    const res = await fetch('/api/captains/available', { headers: { Authorization: `Bearer ${accessToken}` } })
    if (res.status === 401) {
      handleAuthError()
      return
    }
    const d = await res.json()
    if (d.success) setCaptains(d.data)
  }

  async function fetchMetrics() {
    try {
      // Fetch COD collections for metrics
      const codRes = await fetch('/api/cod-settlement', { headers: { Authorization: `Bearer ${accessToken}` } })
      if (codRes.status === 401) {
        handleAuthError()
        return
      }
      const codData = await codRes.json()

      // Fetch commission ledger for metrics
      const commissionRes = await fetch('/api/commissions/my', { headers: { Authorization: `Bearer ${accessToken}` } })
      let commissionSummary = { pending: 0, approved: 0, paid: 0 }
      if (commissionRes.ok) {
        const d = await commissionRes.json()
        if (d.success) {
          commissionSummary = d.data.summary
        }
      }

      // Calculate metrics from segments
      const pendingReceipts = allSegmentsForMetrics.filter(s => s.status === 'PENDING').length
      const awaitingCaptain = allSegmentsForMetrics.filter(s => s.status === 'RECEIVED_AT_POINT').length
      const inTransit = allSegmentsForMetrics.filter(s => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(s.status)).length
      const delivered = allSegmentsForMetrics.filter(s => s.status === 'DELIVERED').length

      const codCollected = allSegmentsForMetrics.filter(s => s.codCollectedAt).reduce((sum, s) => sum + Number(s.booking.calculatedPrice), 0)

      const pendingCOD = codData.success ? codData.data.totalPending : 0

      setMetrics({
        todayPickups: pendingReceipts,
        todayDeliveries: delivered,
        todayCODCollected: codCollected,
        pendingCOD,
        totalCommission: commissionSummary.pending + commissionSummary.approved + commissionSummary.paid,
        paidCommission: commissionSummary.paid,
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  async function confirmReceipt(segmentId: string) {
    setConfirming(segmentId)
    const res = await fetch(`/api/bookings/segments/${segmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ status: 'RECEIVED_AT_POINT' }),
    })
    if (res.status === 401) {
      handleAuthError()
      setConfirming(null)
      return
    }
    await fetchData()
    await fetchAllSegmentsForMetrics()
    setConfirming(null)
  }

  async function assignCaptain(segmentId: string) {
    const captainId = selectedCaptains[segmentId]
    if (!captainId) return
    setAssigning(segmentId)
    const res = await fetch(`/api/bookings/segments/${segmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ assignedCaptainId: captainId, status: 'ASSIGNED' }),
    })
    if (res.status === 401) {
      handleAuthError()
      setAssigning(null)
      return
    }
    await fetchData()
    await fetchAllSegmentsForMetrics()
    setAssigning(null)
    setSelectedCaptains((prev) => ({ ...prev, [segmentId]: '' }))
  }

  async function cancelBooking(bookingId: string) {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation')
      return
    }
    setCancelling(bookingId)
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ reason: cancelReason }),
    })
    if (res.status === 401) {
      handleAuthError()
      setCancelling(null)
      return
    }
    await fetchData()
    await fetchAllSegmentsForMetrics()
    setCancelling(null)
    setCancelDialog(null)
    setCancelReason('')
  }

  async function collectCod(segmentId: string) {
    setCollectingCod(segmentId)
    const res = await fetch(`/api/bookings/segments/${segmentId}/collect-cod`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.status === 401) {
      handleAuthError()
      setCollectingCod(null)
      return
    }
    const data = await res.json()
    if (data.success) {
      await fetchData()
      await fetchAllSegmentsForMetrics()
      setCodDialog(null)
    }
    setCollectingCod(null)
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
      if (res.status === 401) {
        handleAuthError()
        return
      }
      const data = await res.json()
      if (data.success) {
        await fetchData()
        await fetchAllSegmentsForMetrics()
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

  const segments = statusFilter === 'ALL' || statusFilter === 'NEEDS_ACTION'
    ? allSegments.filter((s) => !searchQuery || s.booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    : allSegments.filter((s) => s.status === statusFilter && (!searchQuery || s.booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase())))

  const counts = Object.fromEntries(
    Object.keys(STATUS_META).map((k) => [k, allSegmentsForMetrics.filter((s) => s.status === k).length])
  )
  const actionNeeded = (counts['PENDING'] ?? 0) + (counts['RECEIVED_AT_POINT'] ?? 0)
  counts['NEEDS_ACTION'] = actionNeeded

  return (
    <div className="space-y-5 " data-testid="point-manager-page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-title">Point Manager Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5" data-testid="total-segments">{allSegmentsForMetrics.length} total segment{allSegmentsForMetrics.length !== 1 ? 's' : ''} at your location</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openSettlementDialog} disabled={loading} data-testid="cod-settlement-button">
            <Wallet className="h-3.5 w-3.5 mr-1.5" />
            COD Settlement
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} data-testid="refresh-button">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="metrics-cards">
          <MetricCard label="Pending Receipt" value={metrics.todayPickups} icon={Package} color="text-blue-600" />
          <MetricCard label="In Transit" value={(counts['IN_TRANSIT'] ?? 0) + (counts['ASSIGNED'] ?? 0) + (counts['PICKED_UP'] ?? 0)} icon={Truck} color="text-orange-600" />
          <MetricCard label="Delivered" value={metrics.todayDeliveries} icon={CheckCircle} color="text-green-600" />
          <MetricCard label="COD Collected" value={`₹${metrics.todayCODCollected.toFixed(0)}`} icon={IndianRupee} color="text-purple-600" />
          <MetricCard label="Pending COD" value={`₹${metrics.pendingCOD.toFixed(0)}`} icon={Wallet} color="text-amber-600" highlight={metrics.pendingCOD > 0} />
          <MetricCard label="Commission" value={`₹${metrics.totalCommission.toFixed(0)}`} icon={Wallet} color="text-teal-600" />
        </div>
      )}

      {/* Activity Timeline */}
      {!loading && allSegmentsForMetrics.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {allSegmentsForMetrics.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <div className={`h-2 w-2 rounded-full ${
                    s.status === 'DELIVERED' ? 'bg-green-500' :
                    s.status === 'IN_TRANSIT' ? 'bg-orange-500' :
                    s.status === 'PENDING' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium">{s.booking.bookingNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.routeSegment.fromLocation.pointName} → {s.routeSegment.toLocation.pointName}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {STATUS_META[s.status]?.label || s.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by booking number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 flex-wrap" data-testid="status-tabs">
        {TABS.map((tab) => {
          const count = tab === 'ALL' ? allSegmentsForMetrics.length : (counts[tab] ?? 0)
          const isActive = statusFilter === tab
          return (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              data-testid={`tab-${tab.toLowerCase()}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-accent'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab === 'NEEDS_ACTION' ? 'Needs Action' : STATUS_META[tab]?.label ?? tab}
              {count > 0 && <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-primary-foreground/20' : 'bg-muted'}`}>{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48" data-testid="loading-state">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : segments.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PackageSearch className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No segments found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter === 'ALL' ? 'Booking segments assigned to your point will appear here.' : `No segments with status "${STATUS_META[statusFilter]?.label ?? statusFilter}".`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" data-testid="segments-list">
          {segments.map((s) => {
            const displayStatus = s.booking.status === 'CANCELLED' ? 'CANCELLED' : s.status
            const meta = STATUS_META[displayStatus]
            const needsReceipt = s.status === 'PENDING' && s.booking.status !== 'CANCELLED'
            const needsCaptain = s.status === 'RECEIVED_AT_POINT' && !s.captain && s.booking.status !== 'CANCELLED'
            return (
              <Card key={s.id} className={`overflow-hidden transition-shadow hover:shadow-md ${needsReceipt || needsCaptain ? 'border-primary/30' : ''}`} data-testid={`segment-card-${s.id}`}>
                {(needsReceipt || needsCaptain) && (
                  <div className="h-0.5 bg-primary w-full" />
                )}
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                    {/* Left: booking info */}
                    <div className="flex-1 space-y-3">
                      {/* Top row */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/bookings/${s.booking.id}`} className="font-mono font-bold text-sm hover:text-primary transition-colors">
                            {s.booking.bookingNumber}
                          </Link>
                          <Badge variant="outline" className="text-xs">Seg {s.sequenceOrder}</Badge>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
                            s.pmRole === 'INCOMING'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {s.pmRole === 'INCOMING' ? '↓ Incoming' : '↑ Outgoing'}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta?.color ?? ''}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta?.dot ?? ''}`} />
                          {meta?.label ?? displayStatus}
                        </span>
                      </div>

                      {/* Full journey strip */}
                      {s.booking.segments.length > 0 && (() => {
                        // Build stop nodes: fromLocation of each seg + final toLocation
                        const stops = [
                          ...s.booking.segments.map((seg) => seg.routeSegment.fromLocation.pointName),
                          s.booking.segments[s.booking.segments.length - 1].routeSegment.toLocation.pointName,
                        ]
                        // My stop index:
                        // OUTGOING → fromLocation of my segment (sequenceOrder - 1)
                        // INCOMING → toLocation of my segment (sequenceOrder)
                        const myStopIdx = s.pmRole === 'OUTGOING'
                          ? s.sequenceOrder - 1
                          : s.sequenceOrder
                        return (
                          <div className="bg-muted/40 rounded-lg px-3 py-2">
                            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Full Journey</p>
                            <div className="flex items-center flex-wrap gap-0">
                              {stops.map((stop, idx) => (
                                <div key={idx} className="flex items-center gap-0">
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    idx === myStopIdx
                                      ? 'bg-primary/10 text-primary font-semibold'
                                      : 'text-muted-foreground'
                                  }`}>
                                    {stop}
                                  </span>
                                  {idx < stops.length - 1 && (
                                    <ArrowRight className="h-3 w-3 text-muted-foreground mx-0.5" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}

                      {/* My segment */}
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium">{s.routeSegment.fromLocation.pointName}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium">{s.routeSegment.toLocation.pointName}</span>
                        <span className="text-xs text-muted-foreground">(your segment)</span>
                      </div>

                      {/* Parcel + Customer */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Package className="h-3.5 w-3.5" />
                          <span>{s.booking.parcelWeight}kg · {s.booking.parcelType}</span>
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${PRIORITY_COLOR[s.booking.deliveryPriority] ?? ''}`}>
                            {s.booking.deliveryPriority}
                          </span>
                        </div>
                        {s.vehicleType && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Truck className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">{s.vehicleType}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          <span>{s.booking.customer.name}</span>
                          <span className="text-xs">· {s.booking.customer.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={s.booking.paymentStatus === 'PAID' ? 'default' : 'secondary'} className="text-xs">
                            {s.booking.paymentStatus}
                          </Badge>
                          <span className="text-xs text-muted-foreground">· {s.booking.paymentMethod}</span>
                        </div>
                      </div>

                      {/* Captain info (if assigned) */}
                      {s.captain && (
                        <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                          <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="font-medium">{s.captain.name}</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span>{s.captain.phone}</span>
                              {s.captain.captainProfile && (
                                <>
                                  <span>·</span>
                                  <span>{s.captain.captainProfile.vehicleType}</span>
                                  <span>·</span>
                                  <span>{s.captain.captainProfile.vehicleNumber}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: action area */}
                    {(needsReceipt || needsCaptain || (s.booking.paymentMethod === 'COD' && !s.codCollectedAt && s.booking.paymentStatus !== 'PAID') || (s.booking.paymentStatus === 'PENDING_PAYMENT')) && (
                      <>
                        <Separator orientation="vertical" className="hidden sm:block h-auto self-stretch" />
                        <div className="sm:w-52 flex flex-col justify-center gap-2">
                          {needsReceipt && (
                            <>
                              <p className="text-xs font-medium text-muted-foreground">Parcel arrived at your point?</p>
                              <Button
                                size="sm"
                                className="w-full"
                                disabled={confirming === s.id}
                                onClick={() => confirmReceipt(s.id)}
                              >
                                {confirming === s.id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                  : <CheckCircle className="h-3.5 w-3.5 mr-2" />}
                                Confirm Receipt
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={cancelling === s.booking.id}
                                onClick={() => setCancelDialog({ segmentId: s.id, bookingId: s.booking.id })}
                              >
                                {cancelling === s.booking.id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                  : <X className="h-3.5 w-3.5 mr-2" />}
                                Cancel Booking
                              </Button>
                            </>
                          )}
                          {needsCaptain && (
                            <>
                              <p className="text-xs font-medium text-muted-foreground">Assign a captain for pickup</p>
                              <Select
                                value={selectedCaptains[s.id] || ''}
                                onValueChange={(v) => setSelectedCaptains((prev) => ({ ...prev, [s.id]: v }))}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Choose captain…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {captains.length === 0 && (
                                    <div className="px-3 py-2 text-xs text-muted-foreground">No captains available</div>
                                  )}
                                  {captains.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      <div className="flex flex-col">
                                        <span>{c.name}</span>
                                        <span className="text-xs text-muted-foreground">{c.vehicleNumber} · {c.vehicleType}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                className="w-full"
                                disabled={!selectedCaptains[s.id] || assigning === s.id}
                                onClick={() => assignCaptain(s.id)}
                              >
                                {assigning === s.id
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                  : <Truck className="h-3.5 w-3.5 mr-2" />}
                                Assign Captain
                              </Button>
                            </>
                          )}
                          {s.booking.paymentMethod === 'COD' && !s.codCollectedAt && !s.booking.codCollectedAt && s.booking.paymentStatus !== 'PAID' && (
                            <>
                              <p className="text-xs font-medium text-muted-foreground">Collect COD payment?</p>
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() => setCodDialog({
                                  segmentId: s.id,
                                  booking: s.booking,
                                  location: s.pmRole === 'INCOMING' ? s.routeSegment.toLocation.pointName : s.routeSegment.fromLocation.pointName
                                })}
                              >
                                <IndianRupee className="h-3.5 w-3.5 mr-2" />
                                Collect COD
                              </Button>
                            </>
                          )}
                          {s.booking.paymentMethod === 'COD' && (s.codCollectedAt || s.booking.codCollectedAt || s.booking.paymentStatus === 'PAID') && (
                            <div className="text-xs space-y-1.5">
                              <div className="flex items-center gap-1.5 text-green-600 font-medium">
                                <CheckCircle className="h-3.5 w-3.5" />
                                COD Collected
                              </div>
                              <div className="font-medium text-primary">
                                &#8377;{Number(s.booking.calculatedPrice).toFixed(2)}
                              </div>
                              <div className="text-muted-foreground">
                                {(s.codCollectedAt || s.booking.codCollectedAt) ? new Date(s.codCollectedAt || s.booking.codCollectedAt || '').toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Collected'}
                              </div>
                            </div>
                          )}
                          {s.booking.paymentStatus === 'PENDING_PAYMENT' && (
                            <>
                              <p className="text-xs font-medium text-muted-foreground">Process Payment</p>
                              <div className="space-y-2">
                                <Button
                                  size="sm"
                                  className="w-full"
                                  disabled={processingPayment === s.booking.id}
                                  onClick={() => setPaymentDialog({ bookingId: s.booking.id, booking: s.booking })}
                                >
                                  {processingPayment === s.booking.id
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                    : <IndianRupee className="h-3.5 w-3.5 mr-2" />}
                                  Process Payment
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={(open) => !open && setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select a reason</option>
                <option value="Customer not available">Customer not available</option>
                <option value="Wrong address">Wrong address</option>
                <option value="Parcel damaged">Parcel damaged</option>
                <option value="Customer refused">Customer refused</option>
                <option value="Size issue">Size issue</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCancelDialog(null); setCancelReason('') }}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelDialog && cancelBooking(cancelDialog.bookingId)}
              disabled={cancelling === cancelDialog?.bookingId || !cancelReason.trim()}
            >
              {cancelling === cancelDialog?.bookingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COD Collection Confirmation Dialog */}
      <Dialog open={!!codDialog} onOpenChange={(open) => !open && setCodDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect COD Payment</DialogTitle>
          </DialogHeader>
          {codDialog && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Booking Number</span>
                  <span className="font-mono text-sm font-medium">{codDialog.booking.bookingNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Customer</span>
                  <span className="text-sm font-medium">{codDialog.booking.customer.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Collection Location</span>
                  <span className="text-sm font-medium">{codDialog.location}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Amount to Collect</span>
                  <span className="text-2xl font-bold text-primary">&#8377;{Number(codDialog.booking.calculatedPrice).toFixed(2)}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Please confirm you have collected the cash payment from the customer before proceeding.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCodDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => codDialog && collectCod(codDialog.segmentId)}
              disabled={collectingCod === codDialog?.segmentId}
            >
              {collectingCod === codDialog?.segmentId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <IndianRupee className="h-4 w-4 mr-2" />
                  Confirm Collection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Processing Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={(open) => !open && setPaymentDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
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
                <Separator />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COD Settlement Dialog */}
      <Dialog open={settlementDialog} onOpenChange={setSettlementDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>COD Settlement</DialogTitle>
          </DialogHeader>
          {settlementLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : settlementData ? (
            <div className="space-y-4">
              {/* Admin Payment Details */}
              {settlementData.paymentSettings && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Admin Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {settlementData.paymentSettings.bankName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank Name:</span>
                        <span className="font-medium">{settlementData.paymentSettings.bankName}</span>
                      </div>
                    )}
                    {settlementData.paymentSettings.accountNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Number:</span>
                        <span className="font-medium">{settlementData.paymentSettings.accountNumber}</span>
                      </div>
                    )}
                    {settlementData.paymentSettings.ifscCode && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IFSC Code:</span>
                        <span className="font-medium">{settlementData.paymentSettings.ifscCode}</span>
                      </div>
                    )}
                    {settlementData.paymentSettings.accountHolderName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Holder:</span>
                        <span className="font-medium">{settlementData.paymentSettings.accountHolderName}</span>
                      </div>
                    )}
                    {settlementData.paymentSettings.upiId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">UPI ID:</span>
                        <span className="font-medium">{settlementData.paymentSettings.upiId}</span>
                      </div>
                    )}
                    {settlementData.paymentSettings.qrCodeUrl && (
                      <div className="mt-3">
                        <span className="text-muted-foreground text-xs">QR Code:</span>
                        <img src={settlementData.paymentSettings.qrCodeUrl} alt="QR Code" className="mt-2 w-32 h-32 object-contain border rounded" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Pending Collections */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Pending COD Collections</CardTitle>
                    <Badge variant="secondary">₹{settlementData.totalPending.toFixed(2)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {settlementData.pendingCollections.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending collections</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {settlementData.pendingCollections.map((collection: any) => (
                        <div
                          key={collection.id}
                          className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            setSelectedCollections((prev) =>
                              prev.includes(collection.id)
                                ? prev.filter((id) => id !== collection.id)
                                : [...prev, collection.id]
                            )
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedCollections.includes(collection.id)}
                              onChange={() => {}}
                              className="h-4 w-4"
                            />
                            <div>
                              <p className="text-sm font-medium">{collection.booking.bookingNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(collection.collectionDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium">₹{Number(collection.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Amount */}
              {selectedCollections.length > 0 && (
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">Selected Amount:</span>
                    <span className="text-lg font-bold text-primary">
                      ₹{settlementData.pendingCollections
                          .filter((c: any) => selectedCollections.includes(c.id))
                          .reduce((sum: number, c: any) => sum + Number(c.amount), 0)
                          .toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankReferenceNumber">Bank Reference Number (if applicable)</Label>
                    <Input
                      id="bankReferenceNumber"
                      placeholder="Enter bank transfer reference number"
                      value={bankReferenceNumber}
                      onChange={(e) => setBankReferenceNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Remittance History */}
              {settlementData.remittances.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Recent Remittances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {settlementData.remittances.map((remittance: any) => (
                        <div key={remittance.id} className="flex items-center justify-between text-sm p-2 border rounded">
                          <div>
                            <p className="font-medium">₹{Number(remittance.amount).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(remittance.remittanceDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              remittance.status === 'COMPLETED'
                                ? 'default'
                                : remittance.status === 'PENDING'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {remittance.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettlementDialog(false)}>
              Close
            </Button>
            <Button
              onClick={submitSettlement}
              disabled={selectedCollections.length === 0 || submittingSettlement}
            >
              {submittingSettlement ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Wallet className="h-4 w-4 mr-2" />
              )}
              Submit Settlement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} segments
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
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={highlight && value > 0 ? 'border-primary/40 bg-primary/5' : ''}>
      <CardContent className="py-3 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${highlight && value > 0 ? 'text-primary' : ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
