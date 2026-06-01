'use client'

import { useEffect, useState } from 'react'
import { Search, Loader2, User, CheckCircle2, XCircle, Clock, Eye, Edit, MoreHorizontal, MapPin, Save, X, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'

type User = {
  id: string
  displayId: string
  name: string
  email: string
  phone: string
  approvalStatus: string
  isActive: boolean
  createdAt: string
  userRoles: { role: { name: string }; isPrimary: boolean }[]
  pointManagerProfile?: {
    shopLocation?: {
      pointName: string
      village: string
      district: string
    }
  } | null
  captainProfile?: {
    vehicleType: string
    vehicleNumber: string
    districtId: string
    districtIds?: string[]
    aadhaarNumber: string
    aadhaarPhoto: string | null
    drivingLicense: string
    licensePhoto: string | null
    availabilityStatus: string
    pointAssignments?: {
      locationId: string
      location: {
        pointName: string
        village: string
        district: string
      }
    }[]
  } | null
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

export default function UsersPage() {
  const { accessToken } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [approvalFilter, setApprovalFilter] = useState('ALL')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 50
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingCaptainPoints, setEditingCaptainPoints] = useState<User | null>(null)
  const [availablePoints, setAvailablePoints] = useState<any[]>([])
  const [selectedPoints, setSelectedPoints] = useState<string[]>([])
  const [savingPoints, setSavingPoints] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({})
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([])
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])
  const [skipNextEffect, setSkipNextEffect] = useState(false)
  const [resettingAvailability, setResettingAvailability] = useState<string | null>(null)

  // Reload points when selected districts change (skip initial load)
  useEffect(() => {
    if (skipNextEffect) {
      setSkipNextEffect(false)
      return
    }
    if (selectedDistricts.length > 0 && accessToken) {
      const loadPoints = async () => {
        try {
          const promises = selectedDistricts.map((district: string) =>
            fetch(`/api/locations?district=${encodeURIComponent(district)}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
          )
          const responses = await Promise.all(promises)
          const allPoints: any[] = []
          for (const res of responses) {
            if (res.ok) {
              const data = await res.json()
              if (data.success) allPoints.push(...data.data.items)
            }
          }
          setAvailablePoints(allPoints)
          // Filter selected points to only those in available points
          setSelectedPoints((prev) => prev.filter((id) => allPoints.some((p) => p.id === id)))
        } catch (err) {
          console.error('Failed to load points:', err)
          setAvailablePoints([])
        }
      }
      loadPoints()
    } else {
      setAvailablePoints([])
      setSelectedPoints([])
    }
  }, [selectedDistricts, accessToken])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  async function openCaptainPointsEditor(user: User) {
    setEditingCaptainPoints(user)
    setSelectedPoints(user.captainProfile?.pointAssignments?.map((pa) => pa.locationId) || [])

    // Derive districts from point assignments (captain can have points from multiple districts)
    const pointAssignments = user.captainProfile?.pointAssignments || []
    const districtsFromPoints = new Set<string>()
    pointAssignments.forEach((pa) => {
      if (pa.location?.district) {
        districtsFromPoints.add(pa.location.district)
      }
    })
    // Also include the primary districtId if it exists
    if (user.captainProfile?.districtId) {
      districtsFromPoints.add(user.captainProfile.districtId)
    }
    const districtIds = Array.from(districtsFromPoints)

    // Load points from all derived districts
    if (districtIds.length > 0) {
      const promises = districtIds.map((district: string) =>
        fetch(`/api/locations?district=${encodeURIComponent(district)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      )
      const responses = await Promise.all(promises)
      const allPoints = []
      for (const res of responses) {
        if (res.ok) {
          const data = await res.json()
          if (data.success) allPoints.push(...data.data.items)
        }
      }
      setAvailablePoints(allPoints)
    }
  }

  function togglePoint(pointId: string) {
    setSelectedPoints((prev) =>
      prev.includes(pointId) ? prev.filter((id) => id !== pointId) : [...prev, pointId]
    )
  }

  async function saveCaptainPoints() {
    if (!editingCaptainPoints) return
    setSavingPoints(true)
    try {
      const res = await fetch(`/api/captains/${editingCaptainPoints.id}/points`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ selectedPoints }),
      })
      const data = await res.json()
      if (data.success) {
        // Refresh user data
        const userRes = await fetch(`/api/users?search=${editingCaptainPoints.displayId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const userData = await userRes.json()
        if (userData.success && userData.data.items.length > 0) {
          const updatedUser = userData.data.items[0]
          setUsers((prev) => prev.map((u) => u.id === updatedUser.id ? updatedUser : u))
          setEditingCaptainPoints(updatedUser)
        }
        setEditingCaptainPoints(null)
      }
    } catch (err) {
      console.error('Failed to save points', err)
    } finally {
      setSavingPoints(false)
    }
  }

  async function openEditUser(user: User) {
    setEditingUser(user)
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      vehicleType: user.captainProfile?.vehicleType || '',
      vehicleNumber: user.captainProfile?.vehicleNumber || '',
      districtId: user.captainProfile?.districtId || '',
      districtIds: (user.captainProfile as any)?.districtIds || [],
    })
    
    // Derive districts from point assignments (captain can have points from multiple districts)
    const pointAssignments = user.captainProfile?.pointAssignments || []
    const existingPointIds = pointAssignments.map((pa) => pa.locationId)
    const districtsFromPoints = new Set<string>()
    pointAssignments.forEach((pa) => {
      if (pa.location?.district) {
        districtsFromPoints.add(pa.location.district)
      }
    })
    // Also include the primary districtId if it exists
    if (user.captainProfile?.districtId) {
      districtsFromPoints.add(user.captainProfile.districtId)
    }
    const existingDistricts = Array.from(districtsFromPoints)

    // Load available districts by fetching all locations
    const res = await fetch('/api/locations?pageSize=1000', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    const allDistricts: string[] = []
    if (data.success) {
      const districtSet = new Set<string>()
      data.data.items.forEach((loc: any) => {
        districtSet.add(loc.district)
      })
      allDistricts.push(...Array.from(districtSet).sort())
    }

    // Load available points from captain's districts synchronously
    let allPoints: any[] = []
    if (existingDistricts.length > 0) {
      const promises = existingDistricts.map((district: string) =>
        fetch(`/api/locations?district=${encodeURIComponent(district)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      )
      const responses = await Promise.all(promises)
      for (const res of responses) {
        if (res.ok) {
          const data = await res.json()
          if (data.success) allPoints.push(...data.data.items)
        }
      }
    }

    // Set all state at once and skip the next useEffect
    setSkipNextEffect(true)
    setAvailableDistricts(allDistricts)
    setAvailablePoints(allPoints)
    setSelectedDistricts(existingDistricts)
    setSelectedPoints(existingPointIds)
  }

  async function resetCaptainAvailability(userId: string) {
    setResettingAvailability(userId)
    try {
      const res = await fetch(`/api/admin/captains/${userId}/reset-availability`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (data.success) {
        setUsers((prev) => prev.map((u) => {
          if (u.id === userId && u.captainProfile) {
            return {
              ...u,
              captainProfile: {
                ...u.captainProfile,
                availabilityStatus: 'AVAILABLE',
              },
            }
          }
          return u
        }))
        alert('Captain availability reset to AVAILABLE')
      } else {
        alert(data.error || 'Failed to reset availability')
      }
    } catch (err) {
      console.error('Failed to reset availability:', err)
      alert('Failed to reset availability')
    } finally {
      setResettingAvailability(null)
    }
  }

  async function saveUser() {
    if (!editingUser) return
    setSavingUser(true)
    try {
      // Filter out null values from selectedPoints
      const validSelectedPoints = selectedPoints.filter((p) => p !== null && p !== undefined && p !== '')

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          isActive: editFormData.isActive,
          ...(editingUser.captainProfile && {
            vehicleType: editFormData.vehicleType,
            vehicleNumber: editFormData.vehicleNumber,
            districtIds: selectedDistricts,
            selectedPoints: validSelectedPoints,
          }),
        }),
      })
      const data = await res.json()
      if (data.success) {
        // Update only the changed fields in the local state to preserve nested data
        setUsers((prev) => prev.map((u) => {
          if (u.id === editingUser.id) {
            return {
              ...u,
              name: data.data.name,
              email: data.data.email,
              phone: data.data.phone,
              isActive: data.data.isActive,
              // Preserve all nested data
              userRoles: u.userRoles,
              pointManagerProfile: u.pointManagerProfile,
              captainProfile: u.captainProfile ? {
                ...u.captainProfile,
                vehicleType: editFormData.vehicleType || u.captainProfile.vehicleType,
                vehicleNumber: editFormData.vehicleNumber || u.captainProfile.vehicleNumber,
                districtId: selectedDistricts[0] || u.captainProfile.districtId,
                pointAssignments: u.captainProfile.pointAssignments,
              } : u.captainProfile,
            }
          }
          return u
        }))
        setEditingUser(null)
      }
    } catch (err) {
      console.error('Failed to save user', err)
    } finally {
      setSavingUser(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) })
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (roleFilter !== 'ALL') params.set('role', roleFilter)
    if (approvalFilter !== 'ALL') params.set('approvalStatus', approvalFilter)

    fetch(`/api/users?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r: Response) => r.json())
      .then((d) => { if (d.success) { setUsers(d.data.items); setTotal(d.data.total) } })
      .finally(() => setLoading(false))
  }, [debouncedSearch, roleFilter, approvalFilter, page, accessToken])

  return (
    <div className="space-y-6" data-testid="users-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="page-title">Users</h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="total-count">{total} total user{total !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3" data-testid="filters">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, phone, ID..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="search-input" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter} data-testid="role-filter">
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            {['SUPER_ADMIN', 'ADMIN', 'FRANCHISE_OWNER', 'POINT_MANAGER', 'CAPTAIN', 'CUSTOMER'].map((r) => (
              <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={approvalFilter} onValueChange={setApprovalFilter} data-testid="approval-filter">
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card data-testid="users-table-card">
        {loading ? (
          <CardContent className="flex items-center justify-center h-48" data-testid="loading-state">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : users.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state">
            <User className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No users found</p>
          </CardContent>
        ) : (
          <Table data-testid="users-table">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Location/Details</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const role = user.userRoles?.[0]?.role?.name ?? '—'
                const ApprovalIcon = APPROVAL_ICONS[user.approvalStatus] ?? Clock
                return (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{user.displayId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{role.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {role === 'POINT_MANAGER' && user.pointManagerProfile?.shopLocation ? (
                          <div>
                            <p className="font-medium">{user.pointManagerProfile.shopLocation.pointName}</p>
                            <p className="text-xs text-muted-foreground">{user.pointManagerProfile.shopLocation.village}, {user.pointManagerProfile.shopLocation.district}</p>
                          </div>
                        ) : role === 'CAPTAIN' && user.captainProfile ? (
                          <div>
                            <p className="font-medium">{user.captainProfile.vehicleType}</p>
                            <p className="text-xs text-muted-foreground">{user.captainProfile.vehicleNumber}</p>
                            {user.captainProfile.pointAssignments && user.captainProfile.pointAssignments.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {user.captainProfile.pointAssignments.length} point{user.captainProfile.pointAssignments.length !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{user.email}</p>
                        <p className="text-muted-foreground">{user.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <ApprovalIcon className={`h-4 w-4 ${APPROVAL_COLORS[user.approvalStatus]}`} />
                        <span className={`text-xs font-medium ${APPROVAL_COLORS[user.approvalStatus]}`}>
                          {user.approvalStatus}
                        </span>
                        {!user.isActive && <Badge variant="secondary" className="text-xs ml-1">Inactive</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {role === 'CAPTAIN' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => openCaptainPointsEditor(user)}>
                              <MapPin className="h-4 w-4" />
                            </Button>
                            {user.captainProfile?.availabilityStatus === 'BUSY' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resetCaptainAvailability(user.id)}
                                disabled={resettingAvailability === user.id}
                                title="Reset availability to AVAILABLE"
                              >
                                {resettingAvailability === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Display ID</p>
                  <p className="font-mono text-sm">{selectedUser.displayId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="text-sm">{selectedUser.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {selectedUser.userRoles?.[0]?.role?.name.replace(/_/g, ' ') || '—'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs font-medium ${APPROVAL_COLORS[selectedUser.approvalStatus]}`}>
                      {selectedUser.approvalStatus}
                    </span>
                    {!selectedUser.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                  </div>
                </div>
              </div>
              {selectedUser.pointManagerProfile?.shopLocation && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Point Manager Location</p>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Point:</span> {selectedUser.pointManagerProfile.shopLocation.pointName}</p>
                    <p><span className="text-muted-foreground">Village:</span> {selectedUser.pointManagerProfile.shopLocation.village}</p>
                    <p><span className="text-muted-foreground">District:</span> {selectedUser.pointManagerProfile.shopLocation.district}</p>
                  </div>
                </div>
              )}
              {selectedUser.captainProfile && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Captain Details</p>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Vehicle Type:</span> {selectedUser.captainProfile.vehicleType}</p>
                    <p><span className="text-muted-foreground">Vehicle Number:</span> {selectedUser.captainProfile.vehicleNumber}</p>
                    <p><span className="text-muted-foreground">District:</span> {selectedUser.captainProfile.districtId}</p>
                    {(selectedUser.captainProfile as any)?.districtIds && (selectedUser.captainProfile as any).districtIds.length > 0 && (
                      <div>
                        <p className="text-muted-foreground">Operating Districts:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(selectedUser.captainProfile as any).districtIds.map((district: string) => (
                            <Badge key={district} variant="outline" className="text-xs">
                              {district}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedUser.captainProfile && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">KYC Information</p>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Aadhaar Number:</span> ****{selectedUser.captainProfile.aadhaarNumber?.slice(-4) || 'N/A'}</p>
                    <p><span className="text-muted-foreground">Driving License:</span> {selectedUser.captainProfile.drivingLicense || 'N/A'}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {selectedUser.captainProfile.aadhaarPhoto && (
                        <a href={selectedUser.captainProfile.aadhaarPhoto} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                          <ImageIcon className="h-4 w-4" />
                          View Aadhaar Photo
                        </a>
                      )}
                      {selectedUser.captainProfile.licensePhoto && (
                        <a href={selectedUser.captainProfile.licensePhoto} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                          <ImageIcon className="h-4 w-4" />
                          View License Photo
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.captainProfile && selectedUser.captainProfile.pointAssignments && selectedUser.captainProfile.pointAssignments.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Operating Points</p>
                  <div className="space-y-2">
                    {selectedUser.captainProfile.pointAssignments.map((pa) => (
                      <div key={pa.locationId} className="p-2 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium">{pa.location.pointName}</p>
                        <p className="text-xs text-muted-foreground">{pa.location.village}, {pa.location.district}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleString('en-IN')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Basic Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      maxLength={10}
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>

              {/* Captain Specific Fields */}
              {editingUser.captainProfile && (
                <>
                  <div className="border-t pt-4 space-y-3">
                    <h3 className="text-sm font-medium">Vehicle Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Vehicle Type</Label>
                        <Select value={editFormData.vehicleType} onValueChange={(v) => setEditFormData({ ...editFormData, vehicleType: v })}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BIKE">Bike</SelectItem>
                            <SelectItem value="AUTO">Auto</SelectItem>
                            <SelectItem value="MINI_VAN">Mini Van</SelectItem>
                            <SelectItem value="VAN">Van</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Vehicle Number</Label>
                        <Input
                          value={editFormData.vehicleNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, vehicleNumber: e.target.value.toUpperCase() })}
                          placeholder="e.g. AP16AB1234"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <h3 className="text-sm font-medium">Operating Districts</h3>
                    {availableDistricts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Loading districts...</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                        {availableDistricts.map((district) => (
                          <label key={district} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded">
                            <input
                              type="checkbox"
                              checked={selectedDistricts.includes(district)}
                              onChange={() => {
                                setSelectedDistricts((prev) =>
                                  prev.includes(district)
                                    ? prev.filter((d) => d !== district)
                                    : [...prev, district]
                                )
                              }}
                              className="h-4 w-4"
                            />
                            <span className="text-xs">{district}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {selectedDistricts.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedDistricts.length} district{selectedDistricts.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <h3 className="text-sm font-medium">Operating Points</h3>
                    {availablePoints.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Select districts to see available points</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                        {availablePoints.map((point) => (
                          <label key={point.id} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent rounded">
                            <input
                              type="checkbox"
                              checked={selectedPoints.includes(point.id)}
                              onChange={() => togglePoint(point.id)}
                              className="h-4 w-4"
                            />
                            <div className="flex-1">
                              <p className="text-xs font-medium">{point.pointName}</p>
                              <p className="text-xs text-muted-foreground">{point.village}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                    {selectedPoints.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedPoints.length} point{selectedPoints.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button onClick={saveUser} disabled={savingUser}>
                  {savingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Captain Points Editor Dialog */}
      <Dialog open={!!editingCaptainPoints} onOpenChange={(open) => !open && setEditingCaptainPoints(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Operating Points</DialogTitle>
          </DialogHeader>
          {editingCaptainPoints && (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">{editingCaptainPoints.name}</p>
                <p className="text-muted-foreground">{editingCaptainPoints.displayId}</p>
              </div>
              {availablePoints.length === 0 ? (
                <p className="text-sm text-muted-foreground">No points available in captain's district</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {availablePoints.map((point) => (
                    <label key={point.id} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                      <input
                        type="checkbox"
                        checked={selectedPoints.includes(point.id)}
                        onChange={() => togglePoint(point.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{point.pointName}</p>
                        <p className="text-xs text-muted-foreground">{point.village}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedPoints.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedPoints.length} point{selectedPoints.length !== 1 ? 's' : ''} selected
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingCaptainPoints(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={saveCaptainPoints} disabled={savingPoints || selectedPoints.length === 0}>
                  {savingPoints ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Points
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} users
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
