'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { PackageSearch, Clock, CheckCircle2, TruckIcon, Users, MapPin, IndianRupee, CalendarDays, UserCheck, Plus, RefreshCw, Eye, Download, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MetricsCharts } from '@/components/metrics-charts'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  FRANCHISE_OWNER: 'Franchise Owner',
  POINT_MANAGER: 'Point Manager',
  CAPTAIN: 'Captain',
  CUSTOMER: 'Customer',
}

type Stats = Record<string, number>

type Booking = {
  id: string
  bookingNumber: string
  status: string
  calculatedPrice: number | string
  createdAt: string
  pickupLocation: { id: string; pointName: string; village: string; state: string }
  dropLocation: { id: string; pointName: string; village: string; state: string }
  captain: { name: string | null; phone: string | null } | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  PICKED_UP: 'bg-purple-100 text-purple-800',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, hasRole, accessToken } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [chartData, setChartData] = useState<any[]>([])
  const [chartLoading, setChartLoading] = useState(false)

  async function fetchStats() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch('/api/stats', { headers: { Authorization: `Bearer ${accessToken}` } })
      const d = await res.json()
      if (d.success) setStats(d.data)
    } finally {
      setLoading(false)
    }
  }

  async function fetchBookings() {
    if (!accessToken) return
    setBookingsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      
      const res = await fetch(`/api/customer/bookings?${params.toString()}`, { 
        headers: { Authorization: `Bearer ${accessToken}` } 
      })
      const d = await res.json()
      if (d.success) setBookings(d.data)
    } finally {
      setBookingsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    if (hasRole('CUSTOMER')) {
      fetchBookings()
    }
    if (hasRole('POINT_MANAGER')) {
      fetchChartData()
    }
    const interval = setInterval(() => {
      fetchStats()
      if (hasRole('CUSTOMER')) {
        fetchBookings()
      }
    }, 30000) // Auto-refresh every 30s
    return () => clearInterval(interval)
  }, [accessToken, hasRole, statusFilter, searchQuery, dateFrom, dateTo])

  useEffect(() => {
    if (hasRole('POINT_MANAGER')) {
      fetchChartData()
    }
  }, [chartPeriod, accessToken, hasRole])

  async function fetchChartData() {
    setChartLoading(true)
    try {
      const res = await fetch(`/api/metrics/timeseries?period=${chartPeriod}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const d = await res.json()
      console.log('Chart data response:', d)
      if (d.success) {
        setChartData(d.data.data)
        console.log('Chart data set:', d.data.data)
      } else {
        console.error('Chart data error:', d.error)
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
    } finally {
      setChartLoading(false)
    }
  }

  const primaryRole = user?.roles?.[0] ?? 'CUSTOMER'
  const roleLabel = ROLE_LABELS[primaryRole] ?? primaryRole
  const s = stats

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="welcome-message">Welcome back, {user?.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" data-testid="role-badge">{roleLabel}</Badge>
            <span className="text-sm text-muted-foreground" data-testid="display-id">{user?.displayId}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} data-testid="refresh-button">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {hasRole('CUSTOMER') && (
            <Button asChild data-testid="new-booking-button">
              <Link href="/bookings/new"><Plus className="h-4 w-4 mr-2" />New Booking</Link>
            </Button>
          )}
        </div>
      </div>

      {hasRole('CUSTOMER') && (
        <>
          <div className="grid gap-4 sm:grid-cols-3" data-testid="customer-stats">
            <StatCard icon={PackageSearch} label="Total Bookings" value={s?.total} color="blue" />
            <StatCard icon={Clock} label="Active" value={s?.active} color="yellow" />
            <StatCard icon={CheckCircle2} label="Delivered" value={s?.delivered} color="green" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <Input
                  placeholder="Search by booking number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="max-w-xs"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('ALL')
                    setSearchQuery('')
                    setDateFrom('')
                    setDateTo('')
                  }}
                >
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const csv = [
                      ['Booking Number', 'Status', 'Pickup Location', 'Drop Location', 'Price', 'Created Date'],
                      ...bookings.map(b => [
                        b.bookingNumber,
                        b.status,
                        `${b.pickupLocation.pointName}, ${b.pickupLocation.village}`,
                        `${b.dropLocation.pointName}, ${b.dropLocation.village}`,
                        `₹${Number(b.calculatedPrice).toFixed(2)}`,
                        new Date(b.createdAt).toLocaleDateString('en-IN')
                      ])
                    ].map(row => row.join(',')).join('\n')
                    
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
                    a.click()
                    window.URL.revokeObjectURL(url)
                  }}
                  disabled={bookings.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              {bookingsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading bookings...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PackageSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bookings yet</p>
                  <Button asChild className="mt-4">
                    <Link href="/bookings/new">Create Your First Booking</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border border-border rounded-lg p-4 hover:border-primary/40 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{booking.bookingNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.createdAt).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <Badge className={STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800'}>
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{booking.pickupLocation.pointName}, {booking.pickupLocation.village}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{booking.dropLocation.pointName}, {booking.dropLocation.village}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="h-4 w-4" />
                            <span className="font-medium">₹{Number(booking.calculatedPrice).toFixed(2)}</span>
                          </div>
                          {booking.captain && (
                            <div className="text-xs text-muted-foreground">
                              Captain: {booking.captain.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/bookings/${booking.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => router.push(`/bookings/new?pickupId=${booking.pickupLocation.id}&dropId=${booking.dropLocation.id}`)}
                          className="flex-1"
                        >
                          Book Again
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {hasRole('POINT_MANAGER') && (
        <>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6" data-testid="point-manager-stats">
            <StatCard icon={PackageSearch} label="Pending Receipt" value={s?.pending} color="blue" />
            <StatCard icon={TruckIcon} label="In Transit" value={s?.inTransit} color="orange" />
            <StatCard icon={CheckCircle2} label="Delivered" value={s?.deliveredToday} color="green" />
            <StatCard icon={IndianRupee} label="COD Collected" value={s?.codCollected !== undefined ? `₹${Number(s.codCollected).toFixed(0)}` : undefined} color="purple" />
            <StatCard icon={IndianRupee} label="Pending COD" value={s?.pendingCOD !== undefined ? `₹${Number(s.pendingCOD).toFixed(0)}` : undefined} color="yellow" />
            <StatCard icon={IndianRupee} label="Commission" value={s?.commission !== undefined ? `₹${Number(s.commission).toFixed(0)}` : undefined} color="teal" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button asChild variant="outline" size="sm">
                  <Link href="/bookings/point-manager">View Point Queue</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/cod-remittances">COD Remittances</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/commissions">Commissions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          {chartLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : chartData.length > 0 ? (
            <MetricsCharts
              data={chartData}
              period={chartPeriod}
              onPeriodChange={setChartPeriod}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
                No chart data available
              </CardContent>
            </Card>
          )}
        </>
      )}

      {hasRole('CAPTAIN') && (
        <div className="grid gap-4 sm:grid-cols-2" data-testid="captain-stats">
          <StatCard icon={TruckIcon} label="Active Assignments" value={s?.assigned} color="blue" />
          <StatCard icon={CheckCircle2} label="Delivered Today" value={s?.deliveredToday} color="green" />
        </div>
      )}

      {(hasRole('ADMIN') || hasRole('SUPER_ADMIN')) && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="admin-stats-primary">
            <StatCard icon={PackageSearch} label="Total Bookings" value={s?.totalBookings} color="blue" />
            <StatCard icon={Users} label="Total Users" value={s?.totalUsers} color="purple" />
            <StatCard icon={UserCheck} label="Pending Approvals" value={s?.pendingApprovals} color="yellow" href="/approvals" />
            <StatCard icon={MapPin} label="Active Locations" value={s?.activeLocations} color="green" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2" data-testid="admin-stats-secondary">
            <StatCard icon={CalendarDays} label="Bookings Today" value={s?.todayBookings} color="blue" href="/bookings" />
            <StatCard icon={IndianRupee} label="Total Revenue (Paid)" value={s?.totalRevenue !== undefined ? `₹${Number(s.totalRevenue).toLocaleString('en-IN')}` : undefined} color="green" />
          </div>
        </>
      )}
    </div>
  )
}

type StatCardProps = {
  icon: React.ElementType
  label: string
  value: number | string | undefined
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'teal'
  href?: string
}

const colorMap = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  teal: 'bg-teal-100 text-teal-600',
}

function StatCard({ icon: Icon, label, value, color, href }: StatCardProps) {
  const content = (
    <Card className="bg-white hover:shadow-md transition-all border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold text-foreground">
              {value === undefined ? <span className="text-muted-foreground animate-pulse">—</span> : value}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${colorMap[color]} shadow-sm`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{content}</Link> : content
}
