'use client'

import { useEffect, useState } from 'react'
import { Search, Loader2, Truck, MapPin, User, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'

type Captain = {
  id: string
  vehicleType: string
  vehicleNumber: string
  availabilityStatus: string
  user: {
    id: string
    displayId: string
    name: string
    phone: string
    email: string | null
    approvalStatus: string
    isActive: boolean
  }
  pointAssignments: {
    location: {
      id: string
      pointName: string
      village: string
      district: string
    }
  }[]
}

type Location = {
  id: string
  pointName: string
  village: string
  district: string
}

const AVAILABILITY_ICONS: Record<string, React.ElementType> = {
  ON_DUTY: CheckCircle2,
  OFF_DUTY: XCircle,
  BUSY: Clock,
}

const AVAILABILITY_COLORS: Record<string, string> = {
  ON_DUTY: 'text-green-600',
  OFF_DUTY: 'text-destructive',
  BUSY: 'text-yellow-600',
}

const APPROVAL_ICONS: Record<string, React.ElementType> = {
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  PENDING: Clock,
}

const APPROVAL_COLORS: Record<string, string> = {
  APPROVED: 'text-green-600',
  REJECTED: 'text-destructive',
  PENDING: 'text-yellow-600',
}

export default function CaptainsByPointPage() {
  const { accessToken } = useAuth()
  const [captains, setCaptains] = useState<Captain[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL')

  useEffect(() => {
    // Load all locations
    fetch('/api/locations', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r: Response) => r.json())
      .then((d) => { if (d.success) setLocations(d.data.items) })
  }, [accessToken])

  useEffect(() => {
    if (!selectedLocationId) {
      setCaptains([])
      setLoading(false)
      return
    }

    setLoading(true)
    const params = new URLSearchParams({ locationId: selectedLocationId })
    if (availabilityFilter !== 'ALL') params.set('availabilityStatus', availabilityFilter)

    fetch(`/api/captains?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r: Response) => r.json())
      .then((d) => { if (d.success) setCaptains(d.data) })
      .finally(() => setLoading(false))
  }, [selectedLocationId, availabilityFilter, accessToken])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Captains by Point</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage captains assigned to specific points</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a point..." />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.pointName} - {loc.village}, {loc.district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ON_DUTY">On Duty</SelectItem>
            <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
            <SelectItem value="BUSY">Busy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {loading ? (
          <CardContent className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : !selectedLocationId ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">Select a point to view captains</p>
          </CardContent>
        ) : captains.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Truck className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No captains assigned to this point</p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Captain</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {captains.map((captain) => {
                const AvailabilityIcon = AVAILABILITY_ICONS[captain.availabilityStatus] ?? Clock
                const ApprovalIcon = APPROVAL_ICONS[captain.user.approvalStatus] ?? Clock
                return (
                  <TableRow key={captain.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{captain.user.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{captain.user.displayId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{captain.vehicleType}</p>
                        <p className="text-xs text-muted-foreground">{captain.vehicleNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <AvailabilityIcon className={`h-4 w-4 ${AVAILABILITY_COLORS[captain.availabilityStatus]}`} />
                        <span className={`text-xs font-medium ${AVAILABILITY_COLORS[captain.availabilityStatus]}`}>
                          {captain.availabilityStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <ApprovalIcon className={`h-4 w-4 ${APPROVAL_COLORS[captain.user.approvalStatus]}`} />
                        <span className={`text-xs font-medium ${APPROVAL_COLORS[captain.user.approvalStatus]}`}>
                          {captain.user.approvalStatus}
                        </span>
                        {!captain.user.isActive && <Badge variant="secondary" className="text-xs ml-1">Inactive</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{captain.user.email}</p>
                        <p className="text-muted-foreground">{captain.user.phone}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {captains.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {captains.length} captain{captains.length !== 1 ? 's' : ''} assigned to this point
        </p>
      )}
    </div>
  )
}
