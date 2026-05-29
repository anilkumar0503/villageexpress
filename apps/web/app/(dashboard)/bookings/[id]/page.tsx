'use client'

import { useEffect, useState, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { ArrowLeft, MapPin, Package, User, Truck, IndianRupee, Loader2, Clock, CreditCard, XCircle, CheckCircle, QrCode, Wallet, Download, Printer, X, RotateCcw, Star, MessageSquare, Send, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { QRCodeSVG } from 'qrcode.react'

type BookingDetail = {
  id: string
  bookingNumber: string
  status: string
  parcelWeight: number
  parcelType: string
  numberOfBags: number
  deliveryPriority: string
  calculatedPrice: number
  estimatedDeliveryDate: string
  paymentStatus: string
  paymentMethod: string
  paymentGatewayRef: string | null
  cancelReason: string | null
  refundId: string | null
  codCollectedBy: string | null
  codCollectedAt: string | null
  codCollectedAtLocation: string | null
  codCollectedByUser: { id: string; name: string; phone: string } | null
  receiverName: string | null
  receiverPhone: string | null
  deliveryProof: string | null
  deliverySignature: string | null
  createdAt: string
  customer: { id: string; displayId: string; name: string; email: string; phone: string }
  pickupLocation: { id: string; pointName: string; village: string; district: string; state: string; pincode: string }
  dropLocation: { id: string; pointName: string; village: string; district: string; state: string; pincode: string }
  pointManager: { id: string; displayId: string; name: string; phone: string } | null
  captain: { id: string; displayId: string; name: string; phone: string; captainProfile: { vehicleType: string; vehicleNumber: string } | null } | null
  segments?: Array<{
    id: string
    sequenceOrder: number
    status: string
    codCollectedAt: string | null
    routeSegment: {
      fromLocation: { pointName: string; village: string }
      toLocation: { pointName: string; village: string }
    }
    pointManager: { name: string } | null
    captain: { name: string } | null
  }>
}

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED']

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { accessToken, user } = useAuth()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [collectingCod, setCollectingCod] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [paymentSuccessModal, setPaymentSuccessModal] = useState<{ show: boolean; paidAmount: number; remainingAmount?: number; newBalance: number; isPartial: boolean } | null>(null)
  const [cancelModal, setCancelModal] = useState({ show: false, reason: '' })
  const [errorModal, setErrorModal] = useState({ show: false, message: '' })
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchBooking()
    // Auto-refresh every 15 seconds for real-time tracking
    const interval = setInterval(fetchBooking, 15000)
    return () => clearInterval(interval)
  }, [id, accessToken])

  useEffect(() => {
    if (showChat && booking?.captain) {
      fetchMessages()
    }
  }, [showChat, booking])

  function fetchMessages() {
    if (!booking) return
    fetch(`/api/messages?bookingId=${booking.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMessages(d.data)
      })
  }

  async function sendMessage() {
    if (!newMessage.trim() || !booking?.captain) return

    setSendingMessage(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          receiverId: booking.captain.id,
          content: newMessage,
        }),
      })
      const d = await res.json()
      if (d.success) {
        setNewMessage('')
        fetchMessages()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  function fetchBooking() {
    fetch(`/api/bookings/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBooking(d.data)
        else setError(d.error)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (user?.roles.includes('CUSTOMER') && booking?.customer.id === user.id) {
      fetch('/api/wallet', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setWalletBalance(Number(d.data.balance))
        })
        .catch(() => {})
    }
  }, [user, booking, accessToken])

  async function handlePayNow() {
    if (!booking) return
    setPaying(true)
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ bookingId: booking.id }),
      })
      const data = await res.json()
      if (!data.success) { setPaying(false); return setError(data.error) }

      const { orderId, amount, currency, keyId, bookingNumber } = data.data

      const rzp = new (window as any).Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'Village Express',
        description: `Booking ${bookingNumber}`,
        order_id: orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({
              bookingId: booking.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          })
          const verifyData = await verifyRes.json()
          if (verifyData.success) {
            setBooking((b) => b ? { ...b, paymentStatus: 'PAID', status: 'CONFIRMED', paymentMethod: 'ONLINE' } : b)
          } else {
            setError('Payment verification failed. Contact support.')
          }
        },
        modal: { ondismiss: () => setPaying(false) },
        theme: { color: '#2563eb' },
      })
      rzp.open()
    } catch {
      setError('Failed to initiate payment')
      setPaying(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  if (error || !booking) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive font-medium">{error || 'Booking not found'}</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const currentStep = STATUS_STEPS.indexOf(booking.status)
  const isFinal = ['DELIVERED', 'CANCELLED', 'RETURNED'].includes(booking.status)

  async function handleCancel() {
    if (!booking) return
    setCancelModal({ show: true, reason: '' })
  }

  async function confirmCancel() {
    if (!cancelModal.reason || !cancelModal.reason.trim()) {
      setErrorModal({ show: true, message: 'Please provide a reason for cancellation' })
      return
    }
    if (!booking) return
    setCancelling(true)
    setCancelModal({ show: false, reason: '' })
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: cancelModal.reason }),
      })
      const data = await res.json()
      if (data.success) {
        setBooking((b) => b ? { ...b, status: 'CANCELLED', paymentStatus: b.paymentStatus === 'PAID' ? 'REFUNDED' : b.paymentStatus } : b)
      } else {
        setErrorModal({ show: true, message: data.error || 'Failed to cancel booking' })
      }
    } catch (err) {
      setErrorModal({ show: true, message: 'Failed to cancel booking' })
    }
    setCancelling(false)
  }

  async function handleCollectCod() {
    if (!booking) return
    setCollectingCod(true)
    try {
      const res = await fetch(`/api/bookings/segments/${booking.id}/collect-cod`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (data.success) {
        setBooking((b) => b ? { ...b, paymentStatus: 'PAID', codCollectedAt: new Date().toISOString() } : b)
      } else {
        setError(data.error)
      }
    } catch {
      setError('Failed to collect COD')
    }
    setCollectingCod(false)
  }

  function handleViewReceipt() {
    setShowReceiptModal(true)
  }

  async function handleSubmitRating() {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (!booking) {
      setError('Booking not found')
      return
    }

    setSubmittingRating(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          rating,
          comment: ratingComment,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowRatingModal(false)
        setRating(0)
        setRatingComment('')
        alert('Thank you for your feedback!')
        fetchBooking()
      } else {
        setError(data.error || 'Failed to submit rating')
      }
    } catch (error) {
      setError('Failed to submit rating')
    } finally {
      setSubmittingRating(false)
    }
  }

  function handleDownloadReceipt() {
    if (!receiptRef.current || !booking) return
    const printContent = receiptRef.current.innerHTML
    const printWindow = window.open('', '', 'width=600,height=800')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${booking.bookingNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .receipt { max-width: 400px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
              .row { display: flex; justify-content: space-between; margin: 10px 0; }
              .label { color: #666; }
              .value { font-weight: bold; }
              .amount { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const CANCELLABLE = ['PENDING', 'PAYMENT_FAILED', 'CONFIRMED']
  const showCancel = booking && booking.customer.id === user?.id && CANCELLABLE.includes(booking.status)

  const showPayNow = booking &&
    booking.paymentStatus !== 'PAID' &&
    booking.status !== 'CANCELLED' &&
    booking.customer.id === user?.id &&
    process.env.NEXT_PUBLIC_RAZORPAY_ENABLED === 'true'

  const showCollectCod = booking &&
    booking.paymentMethod === 'COD' &&
    booking.paymentStatus !== 'PAID' &&
    !booking.codCollectedAt &&
    booking.status !== 'CANCELLED' &&
    user?.roles.includes('POINT_MANAGER')

  const canPayWithWallet = walletBalance !== null && walletBalance >= Number(booking?.calculatedPrice || 0) && booking?.status !== 'CANCELLED'
  const canPayPartialWithWallet = walletBalance !== null && walletBalance > 0 && walletBalance < Number(booking?.calculatedPrice || 0) && booking?.status !== 'CANCELLED'

  return (
    <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight font-mono">{booking.bookingNumber}</h1>
          <p className="text-xs text-muted-foreground">
            Created {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant="outline">{booking.parcelType}</Badge>
          <Badge variant={booking.status === 'DELIVERED' ? 'default' : booking.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
            {booking.status.replace(/_/g, ' ')}
          </Badge>
          {booking.paymentStatus === 'PAID' && (
            <Button size="sm" variant="outline" onClick={handleViewReceipt} className="gap-2">
              <Download className="h-4 w-4" />
              Receipt
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => router.push(`/bookings/new?pickupId=${booking.pickupLocation.id}&dropId=${booking.dropLocation.id}&receiverName=${encodeURIComponent(booking.receiverName || '')}&receiverPhone=${encodeURIComponent(booking.receiverPhone || '')}`)} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Book Again
          </Button>
          {booking.status === 'DELIVERED' && booking.captain && (
            <Button size="sm" variant="outline" onClick={() => setShowRatingModal(true)} className="gap-2">
              <Star className="h-4 w-4" />
              Rate Captain
            </Button>
          )}
          {booking.captain && (
            <Button size="sm" variant="outline" onClick={() => setShowChat(true)} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat with Captain
            </Button>
          )}
        </div>
      </div>

      {/* QR Code Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <QrCode className="h-4 w-4" />
            Scan for Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <div className="bg-white p-4 rounded-lg border">
            <QRCodeSVG
              value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/bookings/${booking.id}`}
              size={150}
              level="M"
              includeMargin={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Progress tracker */}
      {!isFinal && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-border" />
              <div
                className="absolute top-3 left-0 h-0.5 bg-primary transition-all"
                style={{ width: `${Math.max(0, (currentStep / (STATUS_STEPS.length - 1)) * 100)}%` }}
              />
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-1.5 relative z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    i <= currentStep ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground'
                  }`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center w-14 leading-tight hidden sm:block">
                    {step.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locations */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" /> Route</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {booking.segments && booking.segments.length > 0 ? (
            <div className="space-y-3">
              {booking.segments.map((seg, idx) => (
                <div key={seg.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${seg.status === 'DELIVERED' ? 'bg-green-500' : seg.status === 'PENDING' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                    {idx < booking.segments!.length - 1 && <div className="w-0.5 h-8 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{seg.routeSegment.fromLocation.pointName}</p>
                      <Badge variant="outline" className="text-xs">{seg.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{seg.routeSegment.fromLocation.village}</p>
                    {seg.pointManager && <p className="text-xs text-muted-foreground">PM: {seg.pointManager.name}</p>}
                    {seg.captain && <p className="text-xs text-muted-foreground">Captain: {seg.captain.name}</p>}
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-border" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{booking.segments[booking.segments.length - 1].routeSegment.toLocation.pointName}</p>
                  <p className="text-xs text-muted-foreground">{booking.segments[booking.segments.length - 1].routeSegment.toLocation.village}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pickup</p>
                <p className="font-semibold">{booking.pickupLocation.pointName}</p>
                <p className="text-sm text-muted-foreground">{booking.pickupLocation.village}, {booking.pickupLocation.district}</p>
                <p className="text-xs text-muted-foreground">{booking.pickupLocation.state} &middot; {booking.pickupLocation.pincode}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Drop</p>
                <p className="font-semibold">{booking.dropLocation.pointName}</p>
                <p className="text-sm text-muted-foreground">{booking.dropLocation.village}, {booking.dropLocation.district}</p>
                <p className="text-xs text-muted-foreground">{booking.dropLocation.state} &middot; {booking.dropLocation.pincode}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Tracking Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4" />
            Live Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = STATUS_STEPS.indexOf(booking.status) >= index
              const isCurrent = booking.status === step
              const isPending = STATUS_STEPS.indexOf(booking.status) < index
              
              return (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500 ring-4 ring-blue-100' : 'bg-gray-200'
                    }`}>
                      {isCompleted && <CheckCircle className="h-3 w-3 text-white" />}
                      {isCurrent && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                    </div>
                    {index < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.replace(/_/g, ' ')}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-muted-foreground mt-1">In progress...</p>
                    )}
                    {isCompleted && index === STATUS_STEPS.indexOf(booking.status) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(booking.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Proof */}
      {booking.status === 'DELIVERED' && (booking.deliveryProof || booking.deliverySignature) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4" />
              Delivery Proof
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.deliveryProof && (
              <div>
                <Label>Delivery Photo</Label>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <img
                    src={booking.deliveryProof}
                    alt="Delivery Proof"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}
            {booking.deliverySignature && (
              <div>
                <Label>Receiver Signature</Label>
                <div className="mt-2 border rounded-lg p-4 bg-muted">
                  <img
                    src={booking.deliverySignature}
                    alt="Receiver Signature"
                    className="w-full h-auto max-h-32"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cancel Banner */}
      {showCancel && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold">Need to cancel?</p>
              <p className="text-sm text-muted-foreground">Cancellation is free before pickup</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleCancel} disabled={cancelling} className="gap-2">
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancel Booking
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cancellation Info */}
      {booking.status === 'CANCELLED' && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 space-y-2">
            <p className="font-semibold text-destructive">Booking Cancelled</p>
            {booking.cancelReason && <p className="text-sm text-muted-foreground">Reason: {booking.cancelReason}</p>}
            {booking.refundId && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Refund Status:</span> Initiated
                <br />
                <span className="font-medium">Refund ID:</span> {booking.refundId}
              </div>
            )}
            {booking.paymentStatus === 'REFUNDED' && (
              <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                <CheckCircle className="h-4 w-4" />
                Refund Processed
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pay Now Banner */}
      {showPayNow && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{booking!.paymentMethod === 'COD' ? 'Pay Online (Convert COD)' : 'Payment Pending'}</p>
                <p className="text-sm text-muted-foreground">{booking!.paymentMethod} &middot; &#8377;{Number(booking!.calculatedPrice).toFixed(2)}</p>
              </div>
              <Button onClick={handlePayNow} disabled={paying} className="gap-2">
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {booking!.paymentMethod === 'COD' ? 'Pay Online' : 'Pay Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collect COD Banner */}
      {showCollectCod && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-semibold">COD Payment Pending</p>
              <p className="text-sm text-muted-foreground">Collect &#8377;{Number(booking!.calculatedPrice).toFixed(2)} from customer</p>
            </div>
            <Button onClick={handleCollectCod} disabled={collectingCod} className="gap-2">
              {collectingCod ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
              Collect COD
            </Button>
          </CardContent>
        </Card>
      )}

      {/* COD Collected Info */}
      {booking.paymentMethod === 'COD' && booking.codCollectedAt && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <CheckCircle className="h-4 w-4" />
              COD Collected
            </div>
            <div className="text-sm text-muted-foreground">
              Amount: &#8377;{Number(booking.calculatedPrice).toFixed(2)}
            </div>
            {booking.codCollectedByUser && (
              <div className="text-sm text-muted-foreground">
                Collected by: {booking.codCollectedByUser.name} ({booking.codCollectedByUser.phone})
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Collected at: {new Date(booking.codCollectedAt).toLocaleString('en-IN', { 
                day: 'numeric', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parcel + Payment */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Package className="h-4 w-4" /> Parcel &amp; Payment</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted-foreground">Weight</span><span className="font-medium">{booking.parcelWeight} kg</span>
            <span className="text-muted-foreground">Type</span><span className="font-medium">{booking.parcelType}</span>
            <span className="text-muted-foreground">Priority</span><span className="font-medium">{booking.deliveryPriority}</span>
            <span className="text-muted-foreground">Est. Delivery</span>
            <span className="font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(booking.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted-foreground">Payment Method</span><span className="font-medium">{booking.paymentMethod}</span>
            <span className="text-muted-foreground">Payment Status</span>
            <Badge variant={booking.paymentStatus === 'PAID' ? 'default' : 'secondary'} className="w-fit">{booking.paymentStatus}</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-primary flex items-center gap-0.5">
              <IndianRupee className="h-5 w-5" />{Number(booking.calculatedPrice).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* People */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><User className="h-4 w-4" /> Assigned To</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">PM</div>
            <div>
              <p className="text-xs text-muted-foreground">Point Manager</p>
              {booking.pointManager
                ? <p className="text-sm font-medium">{booking.pointManager.name} &middot; {booking.pointManager.phone}</p>
                : <p className="text-sm text-muted-foreground">Not assigned yet</p>}
            </div>
          </div>
          {booking.captain && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Captain</p>
                  <p className="text-sm font-medium">{booking.captain.name} &middot; {booking.captain.phone}</p>
                  {booking.captain.captainProfile && (
                    <p className="text-xs text-muted-foreground">{booking.captain.captainProfile.vehicleType} &middot; {booking.captain.captainProfile.vehicleNumber}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Success Modal */}
      {paymentSuccessModal?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Payment Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-semibold">₹{paymentSuccessModal.paidAmount.toFixed(2)}</span>
                </div>
                {paymentSuccessModal.isPartial && paymentSuccessModal.remainingAmount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining to Pay</span>
                    <span className="font-semibold text-orange-600">₹{paymentSuccessModal.remainingAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available Balance</span>
                  <span className="font-semibold">₹{paymentSuccessModal.newBalance.toFixed(2)}</span>
                </div>
              </div>
              {paymentSuccessModal.isPartial && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-800">
                    Partial payment completed. Please pay the remaining amount using another payment method.
                  </p>
                </div>
              )}
              <Button onClick={() => setPaymentSuccessModal(null)} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Cancel Booking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Cancellation Reason</Label>
                <textarea
                  id="cancel-reason"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Please provide a reason for cancellation..."
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={confirmCancel}
                  disabled={cancelling || !cancelModal.reason.trim()}
                  className="flex-1"
                  variant="destructive"
                >
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Confirm Cancellation
                </Button>
                <Button
                  onClick={() => setCancelModal({ show: false, reason: '' })}
                  variant="outline"
                  disabled={cancelling}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{errorModal.message}</p>
              <Button onClick={() => setErrorModal({ show: false, message: '' })} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && booking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Booking Receipt</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowReceiptModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div ref={receiptRef} className="receipt bg-white p-6 rounded-lg border">
                {/* Header with Logo */}
                <div className="header text-center mb-6">
                  <div className="logo text-2xl font-bold text-blue-600 mb-2">Village Express</div>
                  <div className="text-sm text-gray-500">Booking Payment Receipt</div>
                </div>

                {/* Booking Details */}
                <div className="space-y-3">
                  <div className="row">
                    <span className="label text-sm text-gray-600">Booking Number</span>
                    <span className="value text-sm font-medium">{booking.bookingNumber}</span>
                  </div>
                  <div className="row">
                    <span className="label text-sm text-gray-600">Status</span>
                    <span className="value text-sm font-medium">{booking.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="row">
                    <span className="label text-sm text-gray-600">Payment Method</span>
                    <span className="value text-sm font-medium">{booking.paymentMethod}</span>
                  </div>
                  <div className="row">
                    <span className="label text-sm text-gray-600">Payment Status</span>
                    <span className="value text-sm font-medium">{booking.paymentStatus}</span>
                  </div>
                  <div className="row">
                    <span className="label text-sm text-gray-600">Date</span>
                    <span className="value text-sm font-medium">
                      {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="row">
                      <span className="label text-sm text-gray-600">Pickup</span>
                      <span className="value text-sm font-medium text-right max-w-[200px]">
                        {booking.pickupLocation.pointName}, {booking.pickupLocation.village}
                      </span>
                    </div>
                    <div className="row">
                      <span className="label text-sm text-gray-600">Drop</span>
                      <span className="value text-sm font-medium text-right max-w-[200px]">
                        {booking.dropLocation.pointName}, {booking.dropLocation.village}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="amount text-center py-4">
                    <div className="text-3xl font-bold">
                      ₹{Number(booking.calculatedPrice).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Total Amount</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="footer text-center mt-6 text-xs text-gray-500">
                  <p>Thank you for using Village Express</p>
                  <p className="mt-1">Generated on {new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button onClick={handleDownloadReceipt} className="flex-1 gap-2">
                  <Printer className="h-4 w-4" />
                  Print / Download
                </Button>
                <Button variant="outline" onClick={() => setShowReceiptModal(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Rate Your Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-3xl transition-colors"
                  >
                    <Star
                      className={`h-8 w-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Comment (Optional)</Label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowRatingModal(false)} variant="outline" className="flex-1">Cancel</Button>
                <Button
                  onClick={handleSubmitRating}
                  disabled={submittingRating || rating === 0}
                  className="flex-1"
                >
                  {submittingRating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit Rating
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md h-[500px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat with Captain
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.senderId === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    size="icon"
                  >
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </>
  )
}
