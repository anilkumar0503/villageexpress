'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, MapPin, Clock, Shield, Star, ArrowRight, Smartphone, CheckCircle2, TrendingUp, Users, Package, Scale, X, Bike, Car } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface Location {
  id: string
  pointName: string
  village: string
  district: string
  state: string
  pincode: string
  locationType: string
  isActive: boolean
}

interface VehicleConfiguration {
  id: string
  vehicleType: string
  displayName: string
  description: string | null
  defaultWeight: number
  maxWeight: number
  icon: string | null
  isActive: boolean
  sortOrder: number
}

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [formData, setFormData] = useState({
    pickupLocation: '',
    pickupLocationId: '',
    dropLocation: '',
    dropLocationId: '',
  })

  // Get vehicle weight from configuration
  const getVehicleWeight = (vehicleType: string): number => {
    const config = vehicleConfigs.find((v) => v.vehicleType === vehicleType)
    return config?.defaultWeight || 5
  }

  const getVehicleIcon = (icon: string | null) => {
    switch (icon) {
      case 'bike':
        return Bike
      case 'auto':
      case 'car':
        return Car
      case 'van':
        return Car
      default:
        return Bike
    }
  }
  const [loading, setLoading] = useState(false)
  const [pickupSuggestions, setPickupSuggestions] = useState<Location[]>([])
  const [dropSuggestions, setDropSuggestions] = useState<Location[]>([])
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false)
  const [showDropSuggestions, setShowDropSuggestions] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [vehicleConfigs, setVehicleConfigs] = useState<VehicleConfiguration[]>([])
  const [loadingConfigs, setLoadingConfigs] = useState(true)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [checkingRoute, setCheckingRoute] = useState(false)
  const pickupRef = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchVehicleConfigurations()
  }, [])

  const fetchVehicleConfigurations = async () => {
    try {
      const response = await fetch('/api/vehicle-configurations?public=true&isActive=true')
      const data = await response.json()
      if (data.success) {
        setVehicleConfigs(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch vehicle configurations:', error)
    } finally {
      setLoadingConfigs(false)
    }
  }

  const handleBookNow = () => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    setShowBookingForm(true)
  }

  const searchLocations = async (query: string, type: 'pickup' | 'drop') => {
    if (query.length < 2) {
      if (type === 'pickup') {
        setPickupSuggestions([])
        setShowPickupSuggestions(false)
      } else {
        setDropSuggestions([])
        setShowDropSuggestions(false)
      }
      return
    }

    try {
      const response = await fetch(`/api/locations?search=${encodeURIComponent(query)}&public=true&isActive=true`)
      const data = await response.json()

      if (data.success) {
        const suggestions = data.data.items.filter((loc: Location) => loc.isActive)
        if (type === 'pickup') {
          setPickupSuggestions(suggestions)
          setShowPickupSuggestions(true)
        } else {
          setDropSuggestions(suggestions)
          setShowDropSuggestions(true)
        }
      }
    } catch (error) {
      console.error('Location search error:', error)
    }
  }

  const handlePickupChange = (value: string) => {
    setFormData({ ...formData, pickupLocation: value, pickupLocationId: '' })
    
    if (searchTimeout) clearTimeout(searchTimeout)
    
    const timeout = setTimeout(() => {
      searchLocations(value, 'pickup')
    }, 300)
    
    setSearchTimeout(timeout)
  }

  const handleDropChange = (value: string) => {
    setFormData({ ...formData, dropLocation: value, dropLocationId: '' })
    setRouteError(null)
    
    if (searchTimeout) clearTimeout(searchTimeout)
    
    const timeout = setTimeout(() => {
      searchLocations(value, 'drop')
    }, 300)
    
    setSearchTimeout(timeout)
  }

  const checkRouteAvailability = async (pickupId: string, dropId: string) => {
    if (!pickupId || !dropId) {
      setRouteError(null)
      return
    }

    setCheckingRoute(true)
    try {
      const response = await fetch(`/api/routes/available?pickupLocationId=${pickupId}&dropLocationId=${dropId}`)
      const data = await response.json()
      
      if (data.success && data.data.length === 0) {
        setRouteError('No delivery routes available between these locations. Please select different locations.')
      } else {
        setRouteError(null)
      }
    } catch (error) {
      console.error('Route check error:', error)
    } finally {
      setCheckingRoute(false)
    }
  }

  useEffect(() => {
    if (formData.pickupLocationId && formData.dropLocationId) {
      checkRouteAvailability(formData.pickupLocationId, formData.dropLocationId)
    }
  }, [formData.pickupLocationId, formData.dropLocationId])

  const handlePickupSelect = (location: Location) => {
    setFormData({
      ...formData,
      pickupLocation: `${location.pointName}, ${location.village}, ${location.district}`,
      pickupLocationId: location.id,
    })
    setShowPickupSuggestions(false)
  }

  const handleDropSelect = (location: Location) => {
    setFormData({
      ...formData,
      dropLocation: `${location.pointName}, ${location.village}, ${location.district}`,
      dropLocationId: location.id,
    })
    setShowDropSuggestions(false)
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (pickupRef.current && !pickupRef.current.contains(event.target as Node)) {
      setShowPickupSuggestions(false)
    }
    if (dropRef.current && !dropRef.current.contains(event.target as Node)) {
      setShowDropSuggestions(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (searchTimeout) clearTimeout(searchTimeout)
    }
  }, [searchTimeout])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.pickupLocationId || !formData.dropLocationId) {
      alert('Please select valid pickup and drop locations from the suggestions')
      return
    }

    if (routeError) {
      alert(routeError)
      return
    }

    // Check authentication and redirect accordingly
    if (!isAuthenticated()) {
      // Store locations in session storage for after login
      sessionStorage.setItem('pickupLocationId', formData.pickupLocationId)
      sessionStorage.setItem('dropLocationId', formData.dropLocationId)
      sessionStorage.setItem('pickupLocation', formData.pickupLocation)
      sessionStorage.setItem('dropLocation', formData.dropLocation)
      router.push('/login')
      return
    }

    // Redirect to booking page with location params
    router.push(`/bookings/new?pickupLocationId=${formData.pickupLocationId}&dropLocationId=${formData.dropLocationId}`)
  }
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Village Express</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/about" className="text-sm font-medium hover:text-primary transition">About Us</Link>
              <Link href="/partner-with-us" className="text-sm font-medium hover:text-primary transition">Partner With Us</Link>
              <Link href="/testimonials" className="text-sm font-medium hover:text-primary transition">Testimonials</Link>
              <Link href="/blogs" className="text-sm font-medium hover:text-primary transition">Blog</Link>
              <Link href="/contact" className="text-sm font-medium hover:text-primary transition">Contact</Link>
            </div>
            <Link
              href="/login"
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition text-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djRoLTR2LTRoLTR2LTRoLTR2NGg0djRoNHY0aDR2LTRoNHYtNHptLTQgMHY0aDR2LTRoLTR2LTRoLTR2NGg0djRoNHY0aDR2LTRoNHYtNHptLTQgMHY0aDR2LTRoLTR2LTRoLTR2NGg0djRoNHY0aDR2LTRoNHYtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full mb-4">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">India's #1 Village Delivery Network</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                Delivering Happiness<br />To Every Village
              </h1>
              <p className="text-lg mb-6 text-primary-foreground/90 max-w-2xl mx-auto">
                Reliable parcel delivery service connecting villages across India. Fast, secure, and affordable with real-time tracking.
              </p>
            </div>

            {/* Booking Form */}
            <div className="bg-card text-foreground rounded-2xl shadow-2xl p-6 md:p-8 max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="relative" ref={pickupRef}>
                    <label className="block text-sm font-medium mb-2">Pickup Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                      <input
                        type="text"
                        placeholder="Enter pickup location"
                        className="w-full pl-10 pr-10 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
                        value={formData.pickupLocation}
                        onChange={(e) => handlePickupChange(e.target.value)}
                        required
                      />
                      {formData.pickupLocation && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, pickupLocation: '', pickupLocationId: '' })
                            setShowPickupSuggestions(false)
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {showPickupSuggestions && pickupSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        {pickupSuggestions.map((location) => (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => handlePickupSelect(location)}
                            className="w-full text-left px-4 py-3 hover:bg-muted transition border-b border-border last:border-b-0"
                          >
                            <div className="font-medium">{location.pointName}</div>
                            <div className="text-sm text-muted-foreground">
                              {location.village}, {location.district}, {location.state}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative" ref={dropRef}>
                    <label className="block text-sm font-medium mb-2">Drop Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                      <input
                        type="text"
                        placeholder="Enter drop location"
                        className="w-full pl-10 pr-10 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
                        value={formData.dropLocation}
                        onChange={(e) => handleDropChange(e.target.value)}
                        required
                      />
                      {formData.dropLocation && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, dropLocation: '', dropLocationId: '' })
                            setShowDropSuggestions(false)
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {showDropSuggestions && dropSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        {dropSuggestions.map((location) => (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => handleDropSelect(location)}
                            className="w-full text-left px-4 py-3 hover:bg-muted transition border-b border-border last:border-b-0"
                          >
                            <div className="font-medium">{location.pointName}</div>
                            <div className="text-sm text-muted-foreground">
                              {location.village}, {location.district}, {location.state}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {routeError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm text-destructive">{routeError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || checkingRoute}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingRoute ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                      Checking Route...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-5 w-5" />
                      Continue
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>100% Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Real-time Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>COD Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Parcels Delivered</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Villages Served</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-muted-foreground">Districts Covered</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <div className="text-muted-foreground">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Village Express?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">We're committed to making parcel delivery to villages simple, affordable, and reliable.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card p-8 rounded-xl border border-border hover:shadow-lg transition">
              <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Truck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Fast Delivery</h3>
              <p className="text-muted-foreground">Quick and reliable parcel delivery to your doorstep within estimated timeframes.</p>
            </div>
            <div className="bg-card p-8 rounded-xl border border-border hover:shadow-lg transition">
              <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Wide Network</h3>
              <p className="text-muted-foreground">Connected to villages across multiple districts with expanding coverage.</p>
            </div>
            <div className="bg-card p-8 rounded-xl border border-border hover:shadow-lg transition">
              <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Tracking</h3>
              <p className="text-muted-foreground">Track your parcel every step of the way with live location updates.</p>
            </div>
            <div className="bg-card p-8 rounded-xl border border-border hover:shadow-lg transition">
              <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Insured</h3>
              <p className="text-muted-foreground">Your parcels are safe and fully insured for complete peace of mind.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Send parcels in 3 simple steps</p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-xl">
                  1
                </div>
                <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-border -z-10"></div>
                <h3 className="text-xl font-semibold mb-3 text-center">Book Your Parcel</h3>
                <p className="text-muted-foreground text-center">Enter pickup and delivery locations with parcel details</p>
              </div>
              <div className="relative">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-xl">
                  2
                </div>
                <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-border -z-10"></div>
                <h3 className="text-xl font-semibold mb-3 text-center">We Pick Up</h3>
                <p className="text-muted-foreground text-center">Our captain collects from your nearest point</p>
              </div>
              <div className="relative">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 font-bold text-xl">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">Delivered Safely</h3>
                <p className="text-muted-foreground text-center">Parcel delivered to destination with tracking</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Preview */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">What Our Customers Say</h2>
              <p className="text-muted-foreground">Trusted by thousands of happy customers</p>
            </div>
            <Link href="/testimonials" className="text-primary hover:underline flex items-center gap-2 font-medium">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card p-8 rounded-xl border border-border hover:shadow-lg transition">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Excellent service! My parcel was delivered on time and in perfect condition. Highly recommended for village deliveries.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Customer {i}</p>
                    <p className="text-sm text-muted-foreground">Village, District</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM6Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djRoLTR2LTRoLTR2LTRoLTR2NGg0djRoNHY0aDR2LTRoNHYtNHptLTQgMHY0aDR2LTRoLTR2LTRoLTR2NGg0djRoNHY0aDR2LTRoNHYtNHptLTQgMHY0aDR2LTRoLTR2LTRoLTR2NGg0djRoNHY0aDR2LTRoNHYtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Send Your Parcel?</h2>
          <p className="mb-8 text-primary-foreground/90 max-w-2xl mx-auto text-lg">Join thousands of satisfied customers using Village Express for reliable village parcel delivery.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-background text-foreground px-8 py-4 rounded-lg font-semibold hover:bg-accent transition inline-flex items-center justify-center gap-2"
            >
              <Smartphone className="h-5 w-5" />
              Download App
            </Link>
            <Link
              href="/contact"
              className="border-2 border-primary-foreground text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary-foreground/10 transition inline-flex items-center justify-center gap-2"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-muted-foreground py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-foreground">Village Express</span>
              </div>
              <p className="text-sm mb-4">Connecting villages with reliable parcel delivery services across India.</p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center hover:bg-primary/10 cursor-pointer transition">
                  <Users className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center hover:bg-primary/10 cursor-pointer transition">
                  <Smartphone className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="hover:text-primary transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition">Contact</Link></li>
                <li><Link href="/testimonials" className="hover:text-primary transition">Testimonials</Link></li>
                <li><Link href="/blogs" className="hover:text-primary transition">Blogs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/terms" className="hover:text-primary transition">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition">Privacy Policy</Link></li>
                <li><Link href="/refund" className="hover:text-primary transition">Refund Policy</Link></li>
                <li><Link href="/cookies" className="hover:text-primary transition">Cookies Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-primary">Email:</span>
                  <span>support@villageexpress.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">Phone:</span>
                  <span>+91 1234567890</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">Address:</span>
                  <span>Hyderabad, India</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; 2024 Village Express. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-primary transition">Terms</Link>
              <Link href="/privacy" className="hover:text-primary transition">Privacy</Link>
              <Link href="/cookies" className="hover:text-primary transition">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
