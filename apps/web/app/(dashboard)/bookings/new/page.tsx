'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { Loader2, Package, MapPin, IndianRupee, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

type LocationOption = { id: string; pointName: string; village: string; district: string }
type RouteOption = {
  id: string
  name: string
  totalDistance: number
  estimatedDays: number
  sourceLocation: { pointName: string; village: string }
  destinationLocation: { pointName: string; village: string }
  segments: Array<{ fromLocation: { pointName: string }; toLocation: { pointName: string }; distanceKm: number }>
}

export default function NewBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken, user } = useAuth()

  const [states, setStates] = useState<string[]>([])
  const [pickupDistricts, setPickupDistricts] = useState<string[]>([])
  const [dropDistricts, setDropDistricts] = useState<string[]>([])
  const [pickupLocations, setPickupLocations] = useState<LocationOption[]>([])
  const [dropLocations, setDropLocations] = useState<LocationOption[]>([])
  const [availableRoutes, setAvailableRoutes] = useState<RouteOption[]>([])
  const [selectedRouteId, setSelectedRouteId] = useState('')

  const [pickupState, setPickupState] = useState('')
  const [pickupDistrict, setPickupDistrict] = useState('')
  const [pickupLocationId, setPickupLocationId] = useState('')
  const [dropState, setDropState] = useState('')
  const [dropDistrict, setDropDistrict] = useState('')
  const [dropLocationId, setDropLocationId] = useState('')
  const [parcelType, setParcelType] = useState('GENERAL')
  const [numberOfBags, setNumberOfBags] = useState(1)
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [deliveryPriority, setDeliveryPriority] = useState('STANDARD')
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleConfigs, setVehicleConfigs] = useState<any[]>([])
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')
  const [validatingCoupon, setValidatingCoupon] = useState(false)

  type RuleHint = { availableRules: { priority: string; minWeight: number; maxWeight: number }[]; selectedPriority: string; selectedWeight: number } | null
  type PriceBreakdown = { basePrice: number; distanceCost: number; priorityCharge: number; weightSurcharge: number; totalDistance: number } | null
  const [pricePreview, setPricePreview] = useState<number | null>(null)
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [priceRuleHint, setPriceRuleHint] = useState<RuleHint>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [favoriteLocations, setFavoriteLocations] = useState<any[]>([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [showAddFavoriteModal, setShowAddFavoriteModal] = useState(false)
  const [favoriteLabel, setFavoriteLabel] = useState('')
  const [favoriteType, setFavoriteType] = useState<'PICKUP' | 'DROP' | 'BOTH'>('BOTH')
  const [scheduledDeliveryDate, setScheduledDeliveryDate] = useState('')
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('')
  const [deliveryTiming, setDeliveryTiming] = useState<'ASAP' | 'SCHEDULED'>('ASAP')
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [partialPayment, setPartialPayment] = useState(false)
  const [partialAmount, setPartialAmount] = useState('')
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [insufficientBalanceData, setInsufficientBalanceData] = useState<any>(null)
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState('500')
  const [recharging, setRecharging] = useState(false)
  const hasRoutes = availableRoutes.length > 1
  const totalSteps = hasRoutes ? 4 : 3

  useEffect(() => {
    fetch('/api/locations/cascading').then((r: Response) => r.json()).then((d) => {
      if (d.success) setStates(d.data.states)
    })
    fetchVehicleConfigurations()
    fetchFavoriteLocations()
    fetchWalletBalance()

    // Handle Book Again URL parameters and landing page location params
    const pickupId = searchParams.get('pickupId') || searchParams.get('pickupLocationId')
    const dropId = searchParams.get('dropId') || searchParams.get('dropLocationId')
    const receiverNameParam = searchParams.get('receiverName')
    const receiverPhoneParam = searchParams.get('receiverPhone')

    if (receiverNameParam) setReceiverName(decodeURIComponent(receiverNameParam))
    if (receiverPhoneParam) setReceiverPhone(decodeURIComponent(receiverPhoneParam))

    if (pickupId || dropId) {
      fetch('/api/locations', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((r: Response) => r.json()).then((d) => {
        if (d.success) {
          const allLocations = d.data.items
          
          if (pickupId) {
            const pickupLoc = allLocations.find((l: any) => l.id === pickupId)
            if (pickupLoc) {
              setPickupState(pickupLoc.state)
              setPickupDistrict(pickupLoc.district)
              setPickupLocationId(pickupLoc.id)
              loadDistricts(pickupLoc.state, 'pickup')
              loadLocations(pickupLoc.state, pickupLoc.district, 'pickup')
            }
          }

          if (dropId) {
            const dropLoc = allLocations.find((l: any) => l.id === dropId)
            if (dropLoc) {
              setDropState(dropLoc.state)
              setDropDistrict(dropLoc.district)
              setDropLocationId(dropLoc.id)
              loadDistricts(dropLoc.state, 'drop')
              loadLocations(dropLoc.state, dropLoc.district, 'drop')
            }
          }
        }
      })
    }
  }, [searchParams])

  async function fetchWalletBalance() {
    try {
      const res = await fetch('/api/wallet/balance', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) setWalletBalance(Number(d.data.balance))
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error)
    }
  }

  async function fetchFavoriteLocations() {
    try {
      const res = await fetch('/api/favorite-locations', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) setFavoriteLocations(d.data)
    } catch (error) {
      console.error('Failed to fetch favorite locations:', error)
    }
  }

  async function addFavoriteLocation(locationId: string, label: string, locationType: string) {
    try {
      const res = await fetch('/api/favorite-locations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ locationId, label, locationType }),
      })
      const d = await res.json()
      if (d.success) {
        fetchFavoriteLocations()
      }
    } catch (error) {
      console.error('Failed to add favorite location:', error)
    }
  }

  async function removeFavoriteLocation(locationId: string) {
    try {
      const res = await fetch(`/api/favorite-locations?locationId=${locationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) {
        fetchFavoriteLocations()
      }
    } catch (error) {
      console.error('Failed to remove favorite location:', error)
    }
  }

  const fetchVehicleConfigurations = async () => {
    try {
      const response = await fetch('/api/vehicle-configurations?public=true&isActive=true')
      const data = await response.json()
      if (data.success) {
        setVehicleConfigs(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch vehicle configurations:', error)
    }
  }

  const getVehicleWeight = (vehicleType: string): number => {
    const config = vehicleConfigs.find((v) => v.vehicleType === vehicleType)
    return config?.defaultWeight || 5
  }

  async function loadDistricts(state: string, type: 'pickup' | 'drop') {
    const res = await fetch(`/api/locations/cascading?state=${encodeURIComponent(state)}`)
    const data = await res.json()
    if (data.success) {
      if (type === 'pickup') setPickupDistricts(data.data.districts)
      else setDropDistricts(data.data.districts)
    }
  }

  async function loadLocations(state: string, district: string, type: 'pickup' | 'drop') {
    const res = await fetch(`/api/locations/cascading?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`)
    const data = await res.json()
    if (data.success) {
      if (type === 'pickup') setPickupLocations(data.data.locations)
      else setDropLocations(data.data.locations)
    }
  }

  async function loadAvailableRoutes() {
    if (!pickupLocationId || !dropLocationId) {
      setAvailableRoutes([])
      setSelectedRouteId('')
      setRouteError(null)
      return
    }
    const res = await fetch(`/api/routes/available?pickupLocationId=${pickupLocationId}&dropLocationId=${dropLocationId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    if (data.success) {
      setAvailableRoutes(data.data)
      setRouteError(null)
      if (data.data.length === 1) {
        setSelectedRouteId(data.data[0].id)
      } else if (data.data.length === 0) {
        setRouteError('No delivery routes available between these locations. Please select different pickup or drop locations.')
        setSelectedRouteId('')
      }
    } else {
      setAvailableRoutes([])
      setSelectedRouteId('')
      setRouteError('Unable to check route availability. Please try again.')
    }
  }

  useEffect(() => {
    loadAvailableRoutes()
  }, [pickupLocationId, dropLocationId])

  useEffect(() => {
    if (pickupLocationId && dropLocationId && vehicleType && vehicleType !== 'ANY') {
      setPriceLoading(true)
      const parcelWeight = getVehicleWeight(vehicleType)
      fetch('/api/bookings/price-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          pickupLocationId, dropLocationId,
          parcelWeight: Number(parcelWeight),
          deliveryPriority,
          vehicleType,
          ...(selectedRouteId && selectedRouteId !== 'none' && { routeId: selectedRouteId }),
        }),
      })
        .then((r: Response) => r.json())
        .then((d) => {
          if (d.success) { 
            setPricePreview(d.data.finalPrice); 
            setPriceBreakdown(d.data.breakdown || null);
            setPriceRuleHint(null);
            setPriceError(null)
          }
          else if (d.error === 'no_rule_match') { 
            setPricePreview(null); 
            setPriceBreakdown(null);
            setPriceRuleHint({ availableRules: d.availableRules, selectedPriority: d.selectedPriority, selectedWeight: d.selectedWeight });
            setPriceError(null)
          }
          else { 
            setPricePreview(null); 
            setPriceBreakdown(null);
            setPriceRuleHint(null);
            setPriceError(d.error || 'Price could not be calculated')
          }
        })
        .catch(() => { setPricePreview(null); setPriceBreakdown(null); setPriceRuleHint(null); setPriceError('Network error') })
        .finally(() => setPriceLoading(false))
    } else {
      setPricePreview(null)
      setPriceBreakdown(null)
      setPriceRuleHint(null)
      setPriceError(null)
    }
  }, [pickupLocationId, dropLocationId, deliveryPriority, vehicleType, selectedRouteId, accessToken])

  async function validateCoupon() {
    if (!couponCode || !pricePreview) return
    
    setValidatingCoupon(true)
    setCouponError('')
    
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          code: couponCode,
          bookingAmount: pricePreview,
          routeId: selectedRouteId && selectedRouteId !== 'none' ? selectedRouteId : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAppliedCoupon(data.data)
      } else {
        setCouponError(data.error)
        setAppliedCoupon(null)
      }
    } catch (err) {
      setCouponError('Failed to validate coupon')
      setAppliedCoupon(null)
    }
    
    setValidatingCoupon(false)
  }

  function removeCoupon() {
    setCouponCode('')
    setAppliedCoupon(null)
    setCouponError('')
  }

  async function handleRecharge() {
    const amount = Number(rechargeAmount)
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setRecharging(true)
    try {
      const res = await fetch('/api/wallet/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json()
      if (data.success) {
        // Open Razorpay checkout
        const options = {
          key: data.data.keyId,
          amount: data.data.amount,
          currency: data.data.currency,
          name: 'Village Express',
          description: 'Wallet Recharge',
          order_id: data.data.orderId,
          handler: async function (response: any) {
            // Verify payment
            const verifyRes = await fetch('/api/wallet/recharge/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              setShowRechargeModal(false)
              setInsufficientBalanceData(null)
              alert('Wallet recharged successfully! Please try booking again.')
            } else {
              alert('Payment verification failed')
            }
          },
          prefill: {
            name: '',
            email: '',
            contact: '',
          },
          theme: {
            color: '#3B82F6',
          },
        }
        
        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      } else {
        alert(data.error || 'Failed to initiate recharge')
      }
    } catch (err) {
      console.error('Failed to initiate recharge:', err)
      alert('Failed to initiate recharge')
    }
    setRecharging(false)
  }

  const finalPrice = appliedCoupon ? appliedCoupon.finalAmount : pricePreview

  async function handleSubmit() {
    if (!pickupLocationId || !dropLocationId || !vehicleType || vehicleType === 'ANY') {
      return setError('Please fill all required fields with valid values (vehicle type is required for price calculation)')
    }
    const parcelWeight = Number(getVehicleWeight(vehicleType))
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          pickupLocationId, dropLocationId,
          parcelWeight,
          parcelType, deliveryPriority, paymentMethod,
          vehicleType,
          numberOfBags,
          receiverName,
          receiverPhone,
          scheduledDeliveryDate: deliveryTiming === 'SCHEDULED' ? scheduledDeliveryDate : null,
          deliveryTimeSlot: deliveryTiming === 'SCHEDULED' ? deliveryTimeSlot : null,
          routeId: selectedRouteId && selectedRouteId !== 'none' ? selectedRouteId : undefined,
          finalPrice: Number(finalPrice),
          ...(appliedCoupon && { couponId: appliedCoupon.couponId }),
        }),
      })
      const data = await res.json()
      if (!data.success) {
        if (data.code === 'INSUFFICIENT_BALANCE') {
          setInsufficientBalanceData(data.data)
          return
        }
        const errorMsg = data.details ? JSON.stringify(data.details) : data.error
        return setError(errorMsg || 'Failed to create booking')
      }

      // If payment method is ONLINE, initiate Razorpay payment
      if (paymentMethod === 'ONLINE') {
        const bookingId = data.data.id
        const orderRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ bookingId }),
        })
        const orderData = await orderRes.json()
        if (!orderData.success) {
          return setError(orderData.error || 'Failed to create payment order')
        }

        // Load Razorpay script if not already loaded
        if (!(window as any).Razorpay) {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.async = true
          document.body.appendChild(script)
          await new Promise((resolve) => script.onload = resolve)
        }

        const options = {
          key: orderData.data.keyId,
          amount: orderData.data.amount,
          currency: orderData.data.currency,
          name: 'Village Express',
          description: `Booking ${orderData.data.bookingNumber}`,
          order_id: orderData.data.orderId,
          handler: async (response: any) => {
            // Verify payment
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
              body: JSON.stringify({
                bookingId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              router.push('/bookings/my')
            } else {
              setError('Payment verification failed')
              setSubmitting(false)
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: { color: '#2563eb' },
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.open()
        rzp.on('payment.failed', () => {
          setError('Payment failed. Please try again.')
          setSubmitting(false)
        })
      } else {
        // COD - redirect directly
        router.push('/bookings/my')
      }
    } catch {
      setError('Failed to create booking. Try again.')
    }
  }

  const steps = [
    { id: 1, title: 'Locations', icon: MapPin },
    ...(hasRoutes ? [{ id: 2, title: 'Route', icon: MapPin }] : []),
    { id: hasRoutes ? 3 : 2, title: 'Parcel Details', icon: Package },
    { id: hasRoutes ? 4 : 3, title: 'Review & Submit', icon: Package },
  ]

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return !!pickupLocationId && !!dropLocationId && !routeError
      case 2: return hasRoutes ? true : !!vehicleType && vehicleType !== 'ANY'
      case 3: return hasRoutes ? !!vehicleType && vehicleType !== 'ANY' : true
      case 4: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (canProceedToNext() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Booking</h1>
        <p className="text-sm text-muted-foreground mt-1">Fill in parcel and location details</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const StepIcon = step.icon
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <span className="text-sm font-bold">✓</span>
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <span className={`text-xs mt-2 text-center ${isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-all ${isCompleted ? 'bg-primary' : 'bg-border'}`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step 1: Pickup & Drop Locations */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" /> Pickup Location</CardTitle>
              {pickupLocationId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFavoriteType('PICKUP')
                    setShowAddFavoriteModal(true)
                  }}
                  className="text-xs"
                >
                  + Add to Favorites
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {favoriteLocations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Quick select:</span>
                  {favoriteLocations.map((fav) => (
                    <button
                      key={fav.id}
                      type="button"
                      onClick={() => {
                        setPickupState(fav.location.state)
                        setPickupDistrict(fav.location.district)
                        setPickupLocationId(fav.location.id)
                        loadDistricts(fav.location.state, 'pickup')
                        loadLocations(fav.location.state, fav.location.district, 'pickup')
                      }}
                      className="text-xs bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors"
                    >
                      {fav.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Select value={pickupState} onValueChange={(v) => { setPickupState(v); setPickupDistrict(''); setPickupLocationId(''); loadDistricts(v, 'pickup') }}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>{states.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>District</Label>
                  <Select value={pickupDistrict} disabled={!pickupState} onValueChange={(v) => { setPickupDistrict(v); setPickupLocationId(''); loadLocations(pickupState, v, 'pickup') }}>
                    <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>{pickupDistricts.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              <div className="space-y-1.5">
                <Label>Point</Label>
                <Select value={pickupLocationId} disabled={!pickupDistrict} onValueChange={setPickupLocationId}>
                  <SelectTrigger><SelectValue placeholder="Select point" /></SelectTrigger>
                  <SelectContent>{pickupLocations.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.pointName} - {l.village}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              </div>
            </CardContent>
          </Card>

          {routeError && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/40 bg-destructive/5 text-sm">
              <span className="text-destructive font-medium">⚠ {routeError}</span>
            </div>
          )}

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" /> Drop Location</CardTitle>
              {dropLocationId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFavoriteType('DROP')
                    setShowAddFavoriteModal(true)
                  }}
                  className="text-xs"
                >
                  + Add to Favorites
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {favoriteLocations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Quick select:</span>
                  {favoriteLocations.map((fav) => (
                    <button
                      key={fav.id}
                      type="button"
                      onClick={() => {
                        setDropState(fav.location.state)
                        setDropDistrict(fav.location.district)
                        setDropLocationId(fav.location.id)
                        loadDistricts(fav.location.state, 'drop')
                        loadLocations(fav.location.state, fav.location.district, 'drop')
                      }}
                      className="text-xs bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded transition-colors"
                    >
                      {fav.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Select value={dropState} onValueChange={(v) => { setDropState(v); setDropDistrict(''); setDropLocationId(''); loadDistricts(v, 'drop') }}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>District</Label>
                <Select value={dropDistrict} disabled={!dropState} onValueChange={(v) => { setDropDistrict(v); setDropLocationId(''); loadLocations(dropState, v, 'drop') }}>
                  <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>{dropDistricts.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Point</Label>
                <Select value={dropLocationId} disabled={!dropDistrict} onValueChange={setDropLocationId}>
                  <SelectTrigger><SelectValue placeholder="Select point" /></SelectTrigger>
                  <SelectContent>{dropLocations.filter((l: any) => l.id !== pickupLocationId).map((l: any) => <SelectItem key={l.id} value={l.id}>{l.pointName} - {l.village}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Route Selection (only if routes available) */}
      {hasRoutes && currentStep === 2 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" /> Select Route (Optional)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a route" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No route (use default pricing)</SelectItem>
                {availableRoutes.map((route) => (
                  <SelectItem key={route.id} value={route.id}>
                    {route.name} ({route.totalDistance}km, {route.estimatedDays} days)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRouteId && (
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="font-medium">Route Details:</div>
                {availableRoutes.find(r => r.id === selectedRouteId)?.segments.map((seg, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs bg-primary/10 px-2 py-0.5 rounded">{idx + 1}</span>
                    <span>{seg.fromLocation.pointName} → {seg.toLocation.pointName}</span>
                    <span className="text-xs">({seg.distanceKm}km)</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3 (or 2 if no routes): Parcel Details */}
      {currentStep === (hasRoutes ? 3 : 2) && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Package className="h-4 w-4" /> Parcel Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Parcel Type</Label>
              <Select value={parcelType} onValueChange={setParcelType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['DOCUMENTS', 'GENERAL', 'FRAGILE', 'PERISHABLE'].map((t: string) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Number of Bags/Parcels</Label>
              <Input type="number" min="1" max="50" value={numberOfBags} onChange={(e) => setNumberOfBags(parseInt(e.target.value) || 1)} />
            </div>
            <div className="space-y-1.5">
              <Label>Delivery Priority</Label>
              <Select value={deliveryPriority} onValueChange={setDeliveryPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="EXPRESS">Express (+50%)</SelectItem>
                  <SelectItem value="OVERNIGHT">Overnight (+100%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label>Vehicle Type <span className="text-destructive">*</span></Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger><SelectValue placeholder="Select vehicle type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BIKE">🏍 Bike</SelectItem>
                  <SelectItem value="AUTO">🛺 Auto</SelectItem>
                  <SelectItem value="MINI_VAN">🚐 Mini Van</SelectItem>
                  <SelectItem value="VAN">🚚 Van</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price preview inline on Parcel Details step */}
            {vehicleType && vehicleType !== 'ANY' && (
              <div className="col-span-2">
                {priceLoading && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating price...
                  </div>
                )}
                {!priceLoading && pricePreview !== null && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      Estimated Price
                      <Badge variant="outline" className="text-xs">{deliveryPriority}</Badge>
                    </div>
                    <span className="text-xl font-bold text-primary">₹{Number(pricePreview).toFixed(2)}</span>
                  </div>
                )}
                {!priceLoading && priceRuleHint && (
                  <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/5 space-y-2">
                    <p className="text-sm font-semibold text-destructive">
                      {priceRuleHint.selectedPriority} delivery is not available for {priceRuleHint.selectedWeight}kg on this route.
                    </p>
                    <p className="text-xs text-muted-foreground">Please choose a different vehicle or delivery priority.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {priceRuleHint.availableRules.map((r, i) => (
                        <span key={i} className="text-xs bg-background border rounded px-2 py-0.5">
                          <span className="font-medium">{r.priority}</span> · {r.minWeight}–{r.maxWeight}kg
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {!priceLoading && !pricePreview && !priceRuleHint && priceError && (
                  <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-sm text-amber-800">
                    ⚠ {priceError}
                  </div>
                )}
              </div>
            )}
            <div className="space-y-1.5 col-span-2">
              <Label>Receiver Name</Label>
              <Input placeholder="Name of person receiving the parcel" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Receiver Phone</Label>
              <Input type="tel" maxLength={10} placeholder="Phone number of receiver" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <div className="flex items-center justify-between">
                <Label>Payment Method</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4" />
                  <span className="text-muted-foreground">Wallet Balance:</span>
                  <span className="font-medium text-primary">₹{walletBalance.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <label className="flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">💵 COD</span>
                </label>
                {process.env.NEXT_PUBLIC_RAZORPAY_ENABLED === 'true' && (
                  <label className="flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONLINE"
                      checked={paymentMethod === 'ONLINE'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">💳 Online</span>
                  </label>
                )}
                <label className="flex-1 flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="WALLET"
                    checked={paymentMethod === 'WALLET'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">👛 Wallet</span>
                </label>
              </div>
              {paymentMethod === 'WALLET' && (
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={partialPayment}
                      onChange={(e) => setPartialPayment(e.target.checked)}
                    />
                    <span className="text-sm">Pay partial amount now</span>
                  </label>
                  {partialPayment && (
                    <div className="space-y-1.5">
                      <Label>Partial Amount (₹)</Label>
                      <Input
                        type="number"
                        value={partialAmount}
                        onChange={(e) => setPartialAmount(e.target.value)}
                        min="1"
                        max={pricePreview ? Math.floor(Number(pricePreview) * 0.5) : undefined}
                        placeholder={`Max ₹${pricePreview ? Math.floor(Number(pricePreview) * 0.5) : '0'}`}
                      />
                      <p className="text-xs text-muted-foreground">You can pay up to 50% of the total amount now</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4 (or 3 if no routes): Review & Submit */}
      {currentStep === (hasRoutes ? 4 : 3) && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Package className="h-4 w-4" /> Review & Submit</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Pickup Location</p>
                <p className="font-medium">{pickupLocations.find(l => l.id === pickupLocationId)?.pointName} - {pickupLocations.find(l => l.id === pickupLocationId)?.village}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Drop Location</p>
                <p className="font-medium">{dropLocations.find(l => l.id === dropLocationId)?.pointName} - {dropLocations.find(l => l.id === dropLocationId)?.village}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Parcel Type</p>
                <p className="font-medium">{parcelType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Number of Bags/Parcels</p>
                <p className="font-medium">{numberOfBags}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vehicle Type</p>
                <p className="font-medium">{vehicleType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Delivery Priority</p>
                <p className="font-medium">{deliveryPriority}</p>
              </div>
              {receiverName && (
                <div>
                  <p className="text-muted-foreground">Receiver Name</p>
                  <p className="font-medium">{receiverName}</p>
                </div>
              )}
              {receiverPhone && (
                <div>
                  <p className="text-muted-foreground">Receiver Phone</p>
                  <p className="font-medium">{receiverPhone}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium">{paymentMethod}</p>
              </div>
              {selectedRouteId && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Selected Route</p>
                  <p className="font-medium">{availableRoutes.find(r => r.id === selectedRouteId)?.name}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {availableRoutes.find(r => r.id === selectedRouteId)?.segments.map((seg, idx) => (
                      <span key={idx}>{idx + 1}. {seg.fromLocation.pointName} → {seg.toLocation.pointName} ({seg.distanceKm}km) </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coupon Section */}
            {pricePreview !== null && !appliedCoupon && (
              <div className="space-y-2">
                <Label>Have a coupon code?</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={validatingCoupon}
                  />
                  <Button
                    onClick={validateCoupon}
                    disabled={!couponCode || validatingCoupon || !vehicleType || vehicleType === 'ANY'}
                    variant="outline"
                  >
                    {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
                {couponError && <p className="text-sm text-destructive">{couponError}</p>}
              </div>
            )}

            {appliedCoupon && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Coupon Applied: {appliedCoupon.code}</p>
                  <p className="text-xs text-green-600">
                    {appliedCoupon.discountType === 'FLAT' ? 'Flat' : appliedCoupon.discountValue + '%'} discount: -₹{Number(appliedCoupon.discountAmount).toFixed(2)}
                  </p>
                </div>
                <Button onClick={removeCoupon} variant="ghost" size="sm" className="text-red-600">
                  Remove
                </Button>
              </div>
            )}

            {(pricePreview !== null || priceLoading) && !priceRuleHint && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-primary" />
                    <span className="font-medium">Estimated Price</span>
                    <Badge variant="outline">{deliveryPriority}</Badge>
                  </div>
                  {priceLoading
                    ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    : (
                      <div className="text-right">
                        {appliedCoupon && (
                          <p className="text-sm text-muted-foreground line-through">₹{Number(pricePreview).toFixed(2)}</p>
                        )}
                        <span className="text-2xl font-bold text-primary">&#8377;{Number(finalPrice).toFixed(2)}</span>
                      </div>
                    )
                  }
                </div>
                {!priceLoading && pricePreview !== null && (
                  <div className="text-xs text-muted-foreground text-right">
                    Est. delivery: {deliveryPriority === 'EXPRESS' ? '~2 hours' : deliveryPriority === 'OVERNIGHT' ? '~24 hours' : '~4 hours'}
                  </div>
                )}
                {priceBreakdown && !priceLoading && (
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <button
                      onClick={() => setShowBreakdown(!showBreakdown)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>{showBreakdown ? 'Hide' : 'View'} price details</span>
                      <span className="text-xs">({showBreakdown ? '−' : '+'})</span>
                    </button>
                    {showBreakdown && (
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Service Fee</span>
                          <span>₹{priceBreakdown.basePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Delivery Charge ({priceBreakdown.totalDistance.toFixed(1)} km)</span>
                          <span>₹{priceBreakdown.distanceCost.toFixed(2)}</span>
                        </div>
                        {priceBreakdown.priorityCharge > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Express Fee ({deliveryPriority})</span>
                            <span>₹{priceBreakdown.priorityCharge.toFixed(2)}</span>
                          </div>
                        )}
                        {priceBreakdown.weightSurcharge > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Extra Weight Fee</span>
                            <span>₹{priceBreakdown.weightSurcharge.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Insufficient Balance Alert */}
      {insufficientBalanceData && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 px-4 space-y-3">
            <div className="flex items-start gap-2">
              <div>
                <p className="text-sm font-semibold text-destructive">
                  Insufficient Wallet Balance
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current balance: ₹{insufficientBalanceData.currentBalance.toFixed(2)} · Required: ₹{insufficientBalanceData.requiredAmount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  You need to recharge ₹{insufficientBalanceData.shortfall.toFixed(2)} more
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setRechargeAmount(insufficientBalanceData.shortfall.toString())
                  setShowRechargeModal(true)
                }}
                className="flex-1"
              >
                Recharge ₹{insufficientBalanceData.shortfall.toFixed(2)}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPaymentMethod('COD')
                  setInsufficientBalanceData(null)
                }}
                className="flex-1"
              >
                Use COD
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPaymentMethod('ONLINE')
                  setInsufficientBalanceData(null)
                }}
                className="flex-1"
              >
                Use Online Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recharge Modal */}
      {showRechargeModal && (
        <Card>
          <CardHeader>
            <CardTitle>Recharge Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRecharge}
                disabled={recharging}
                className="flex-1"
              >
                {recharging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Pay ₹{rechargeAmount}
              </Button>
              <Button
                onClick={() => setShowRechargeModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Favorite Modal */}
      {showAddFavoriteModal && (
        <Card>
          <CardHeader>
            <CardTitle>Add to Favorites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Label (e.g., Home, Office)</Label>
              <Input
                value={favoriteLabel}
                onChange={(e) => setFavoriteLabel(e.target.value)}
                placeholder="Enter a label for this location"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Use for</Label>
              <Select value={favoriteType} onValueChange={(v: any) => setFavoriteType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PICKUP">Pickup Only</SelectItem>
                  <SelectItem value="DROP">Drop Only</SelectItem>
                  <SelectItem value="BOTH">Both Pickup & Drop</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddFavoriteModal(false)} variant="outline" className="flex-1">Cancel</Button>
              <Button
                onClick={() => {
                  const locationId = favoriteType === 'PICKUP' ? pickupLocationId : dropLocationId
                  if (locationId && favoriteLabel) {
                    addFavoriteLocation(locationId, favoriteLabel, favoriteType)
                    setFavoriteLabel('')
                    setShowAddFavoriteModal(false)
                  }
                }}
                disabled={!favoriteLabel}
                className="flex-1"
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex-1"
        >
          Previous
        </Button>
        {currentStep < totalSteps ? (
          <Button
            onClick={handleNext}
            disabled={!canProceedToNext()}
            className="flex-1"
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting || !!priceRuleHint || !pricePreview || pricePreview === 0 || !vehicleType || vehicleType === 'ANY' || !!routeError}
            className="flex-1"
            size="lg"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Place Booking
          </Button>
        )}
      </div>
    </div>
  )
}
