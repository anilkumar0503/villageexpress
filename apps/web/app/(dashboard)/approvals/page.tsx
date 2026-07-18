'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2, User, MapPin, FileText, Image as ImageIcon, ChevronLeft, ChevronRight, Truck, Store, Users, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'

type PendingUser = {
  id: string
  displayId: string
  name: string
  email: string
  phone: string
  approvalStatus: string
  isActive: boolean
  createdAt: string
  userRoles: { role: { name: string }; isPrimary: boolean }[]
  pointManagerProfile: {
    shopName: string
    shopPhoto: string | null
    shopLocation: {
      pointName: string | null
      village: string
      district: string
      state: string
      pincode: string
    } | null
  } | null
  captainProfile: {
    id: string
    vehicleType: string | null
    vehicleNumber: string | null
    aadhaarNumber: string | null
    aadhaarPhoto: string | null
    drivingLicense: string | null
    licensePhoto: string | null
    aadhaarVerificationStatus: string
    licenseVerificationStatus: string
    aadhaarRejectionReason: string | null
    licenseRejectionReason: string | null
    onboardingStatus: string | null
  } | null
}

const PAGE_SIZE = 10

const ROLE_TABS = [
  { value: 'ALL', label: 'All', icon: Users },
  { value: 'CAPTAIN', label: 'Captains', icon: Truck },
  { value: 'POINT_MANAGER', label: 'Point Managers', icon: Store },
  { value: 'CUSTOMER', label: 'Customers', icon: User },
  { value: 'ADMIN', label: 'Admins', icon: Shield },
]

export default function ApprovalsPage() {
  const { accessToken } = useAuth()
  const [users, setUsers] = useState<PendingUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [roleTab, setRoleTab] = useState('ALL')
  const [page, setPage] = useState(1)

  async function openFile(fileKey: string, bucket: 'public' | 'private') {
    const res = await fetch(`/api/upload/download?fileKey=${encodeURIComponent(fileKey)}&bucket=${bucket}&json=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    if (data.success) window.open(data.url, '_blank')
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  async function fetchUsers() {
    setLoading(true)
    const params = new URLSearchParams({
      approvalStatus: statusFilter,
      pageSize: String(PAGE_SIZE),
      page: String(page),
    })
    if (roleTab !== 'ALL') params.set('role', roleTab)
    const res = await fetch(`/api/users?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    if (data.success) {
      setUsers(data.data.items)
      setTotal(data.data.total)
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [statusFilter, roleTab, page, accessToken])

  function changeStatus(s: 'PENDING' | 'APPROVED' | 'REJECTED') {
    setStatusFilter(s)
    setPage(1)
  }

  function changeRole(r: string) {
    setRoleTab(r)
    setPage(1)
  }

  async function handleAction(userId: string, action: 'APPROVE' | 'REJECT') {
    setActionLoading(userId + action)
    await fetch(`/api/users/${userId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action }),
    })
    setActionLoading(null)
    fetchUsers()
  }

  async function handleKycVerification(captainId: string, documentType: 'AADHAAR' | 'LICENSE', status: 'VERIFIED' | 'REJECTED', rejectionReason?: string) {
    setActionLoading(captainId + documentType + status)
    await fetch(`/api/captains/${captainId}/kyc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ documentType, status, rejectionReason }),
    })
    setActionLoading(null)
    fetchUsers()
  }

  return (
    <div className="space-y-5" data-testid="approvals-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Approvals</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {total} registration{total !== 1 ? 's' : ''} — {statusFilter.toLowerCase()}
        </p>
      </div>

      {/* Role Tabs */}
      <Tabs value={roleTab} onValueChange={changeRole}>
        <TabsList className="h-auto flex-wrap gap-1 bg-muted/50 p-1">
          {ROLE_TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Status Filter */}
      <div className="flex gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeStatus(s)}
          >
            {s === 'PENDING' ? 'Pending' : s === 'APPROVED' ? 'Approved' : 'Rejected'}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No {statusFilter.toLowerCase()} registrations</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'PENDING' ? 'All registrations have been reviewed.' : 'Try a different role or status filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => {
            const role = user.userRoles[0]?.role.name ?? 'UNKNOWN'
            const isPM = role === 'POINT_MANAGER'
            const isCaptain = role === 'CAPTAIN'

            return (
              <Card key={user.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{user.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{user.displayId} &middot; {user.email || '—'} &middot; {user.phone || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Badge variant={isPM ? 'default' : 'secondary'}>
                        {role.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant={
                        user.approvalStatus === 'APPROVED' ? 'default' :
                        user.approvalStatus === 'REJECTED' ? 'destructive' : 'secondary'
                      }>
                        {user.approvalStatus}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {isPM && user.pointManagerProfile && (
                    <div className="space-y-3">
                      {/* Shop Details */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground block">Shop Name</span>
                          <span className="font-medium">{user.pointManagerProfile.shopName}</span>
                        </div>
                        {user.pointManagerProfile.shopLocation?.pointName && (
                          <div>
                            <span className="text-xs text-muted-foreground block">Point Name</span>
                            <span className="font-medium">{user.pointManagerProfile.shopLocation.pointName}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-muted-foreground block">Village</span>
                          <span className="font-medium">{user.pointManagerProfile.shopLocation?.village ?? '—'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">District</span>
                          <span className="font-medium">{user.pointManagerProfile.shopLocation?.district ?? '—'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">State</span>
                          <span className="font-medium">{user.pointManagerProfile.shopLocation?.state ?? '—'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground block">Pincode</span>
                          <span className="font-medium">{user.pointManagerProfile.shopLocation?.pincode ?? '—'}</span>
                        </div>
                      </div>
                      {/* Shop Photo */}
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Shop Photo</span>
                        </div>
                        {user.pointManagerProfile.shopPhoto ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => openFile(user.pointManagerProfile!.shopPhoto!, 'public')}
                          >
                            <ImageIcon className="h-4 w-4" />
                            View Shop Photo
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No photo uploaded</p>
                        )}
                      </div>
                    </div>
                  )}

                  {isCaptain && user.captainProfile && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground block">Vehicle Type</span>
                        <span className="font-medium">{user.captainProfile.vehicleType ?? '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Vehicle Number</span>
                        <span className="font-medium">{user.captainProfile.vehicleNumber ?? '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Aadhaar Number</span>
                        <span className="font-medium">{user.captainProfile.aadhaarNumber ? `****${user.captainProfile.aadhaarNumber.slice(-4)}` : '—'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Driving License No.</span>
                        <span className="font-medium">{user.captainProfile.drivingLicense ?? '—'}</span>
                      </div>
                      {user.captainProfile.onboardingStatus && (
                        <div>
                          <span className="text-xs text-muted-foreground block">Onboarding</span>
                          <Badge variant="outline" className="text-xs mt-0.5">{user.captainProfile.onboardingStatus.replace(/_/g, ' ')}</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {isCaptain && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">KYC Documents</p>
                      <div className="space-y-2">
                        {/* Aadhaar */}
                        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Aadhaar Card</span>
                              <Badge variant={
                                user.captainProfile?.aadhaarVerificationStatus === 'VERIFIED' ? 'default' :
                                user.captainProfile?.aadhaarVerificationStatus === 'REJECTED' ? 'destructive' : 'secondary'
                              } className="text-xs">
                                {user.captainProfile?.aadhaarVerificationStatus || 'PENDING'}
                              </Badge>
                            </div>
                            {user.captainProfile?.aadhaarVerificationStatus !== 'VERIFIED' && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50" disabled={!!actionLoading} onClick={() => handleKycVerification(user.captainProfile!.id, 'AADHAAR', 'VERIFIED')}>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Verify
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:bg-red-50" disabled={!!actionLoading} onClick={() => { const reason = prompt('Rejection reason:'); if (reason) handleKycVerification(user.captainProfile!.id, 'AADHAAR', 'REJECTED', reason) }}>
                                  <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                                </Button>
                              </div>
                            )}
                          </div>
                          {user.captainProfile?.aadhaarPhoto ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => openFile(user.captainProfile!.aadhaarPhoto!, 'private')}
                            >
                              <ImageIcon className="h-4 w-4" />
                              View Aadhaar Photo
                            </Button>
                          ) : (
                            <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                              <ImageIcon className="h-3.5 w-3.5" />
                              No photo uploaded
                            </p>
                          )}
                          {user.captainProfile?.aadhaarRejectionReason && (
                            <p className="text-xs text-destructive">{user.captainProfile.aadhaarRejectionReason}</p>
                          )}
                        </div>

                        {/* License */}
                        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Driving License</span>
                              <Badge variant={
                                user.captainProfile?.licenseVerificationStatus === 'VERIFIED' ? 'default' :
                                user.captainProfile?.licenseVerificationStatus === 'REJECTED' ? 'destructive' : 'secondary'
                              } className="text-xs">
                                {user.captainProfile?.licenseVerificationStatus || 'PENDING'}
                              </Badge>
                            </div>
                            {user.captainProfile?.licenseVerificationStatus !== 'VERIFIED' && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50" disabled={!!actionLoading} onClick={() => handleKycVerification(user.captainProfile!.id, 'LICENSE', 'VERIFIED')}>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Verify
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:bg-red-50" disabled={!!actionLoading} onClick={() => { const reason = prompt('Rejection reason:'); if (reason) handleKycVerification(user.captainProfile!.id, 'LICENSE', 'REJECTED', reason) }}>
                                  <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                                </Button>
                              </div>
                            )}
                          </div>
                          {user.captainProfile?.licensePhoto ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => openFile(user.captainProfile!.licensePhoto!, 'private')}
                            >
                              <ImageIcon className="h-4 w-4" />
                              View License Photo
                            </Button>
                          ) : (
                            <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                              <ImageIcon className="h-3.5 w-3.5" />
                              No photo uploaded
                            </p>
                          )}
                          {user.captainProfile?.licenseRejectionReason && (
                            <p className="text-xs text-destructive">{user.captainProfile.licenseRejectionReason}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Registered: {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {statusFilter === 'PENDING' && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="gap-1.5" disabled={!!actionLoading} onClick={() => handleAction(user.id, 'APPROVE')}>
                        {actionLoading === user.id + 'APPROVE' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" disabled={!!actionLoading} onClick={() => handleAction(user.id, 'REJECT')}>
                        {actionLoading === user.id + 'REJECT' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(1)} disabled={page === 1}>
              <ChevronLeft className="h-3 w-3" /><ChevronLeft className="h-3 w-3 -ml-2" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) pageNum = i + 1
              else if (page <= 3) pageNum = i + 1
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
              else pageNum = page - 2 + i
              return (
                <Button key={pageNum} variant={pageNum === page ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(pageNum)}>
                  {pageNum}
                </Button>
              )
            })}
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
              <ChevronRight className="h-3 w-3" /><ChevronRight className="h-3 w-3 -ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
