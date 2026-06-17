'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Loader2, User, MapPin, FileText, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  pointManagerProfile: { shopName: string; shopPhoto: string | null } | null
  captainProfile: {
    id: string
    vehicleType: string
    vehicleNumber: string
    aadhaarNumber: string
    aadhaarPhoto: string | null
    licensePhoto: string | null
    aadhaarVerificationStatus: string
    licenseVerificationStatus: string
    aadhaarRejectionReason: string | null
    licenseRejectionReason: string | null
  } | null
}

export default function ApprovalsPage() {
  const { accessToken } = useAuth()
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')

  async function fetchUsers(status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    setLoading(true)
    const res = await fetch(`/api/users?approvalStatus=${status}&pageSize=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    if (data.success) setUsers(data.data.items)
    setLoading(false)
  }

  useEffect(() => { fetchUsers(filter) }, [filter])

  async function handleAction(userId: string, action: 'APPROVE' | 'REJECT') {
    setActionLoading(userId + action)
    await fetch(`/api/users/${userId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action }),
    })
    setActionLoading(null)
    fetchUsers(filter)
  }

  async function handleKycVerification(captainId: string, documentType: 'AADHAAR' | 'LICENSE', status: 'VERIFIED' | 'REJECTED', rejectionReason?: string) {
    setActionLoading(captainId + documentType + status)
    await fetch(`/api/captains/${captainId}/kyc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ documentType, status, rejectionReason }),
    })
    setActionLoading(null)
    fetchUsers(filter)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="approvals-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="page-title">User Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="pending-count">
          {users.length} registration{users.length !== 1 ? 's' : ''} {filter.toLowerCase()}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'PENDING' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('PENDING')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'APPROVED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('APPROVED')}
        >
          Approved
        </Button>
        <Button
          variant={filter === 'REJECTED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('REJECTED')}
        >
          Rejected
        </Button>
      </div>

      {users.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No {filter.toLowerCase()} registrations</p>
            <p className="text-sm text-muted-foreground">
              {filter === 'PENDING' ? 'All registrations have been reviewed.' : ''}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" data-testid="approvals-list">
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
                        <p className="text-xs text-muted-foreground">{user.displayId} &middot; {user.email} &middot; {user.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isPM ? 'default' : 'secondary'}>
                        {isPM ? 'Point Manager' : isCaptain ? 'Captain' : role}
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>Shop: <span className="text-foreground font-medium">{user.pointManagerProfile.shopName}</span></span>
                    </div>
                  )}

                  {isPM && user.pointManagerProfile?.shopPhoto && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Shop Photo</p>
                      <a href={`/api/upload/download?fileKey=${encodeURIComponent(user.pointManagerProfile.shopPhoto!)}&bucket=public`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <ImageIcon className="h-4 w-4" />
                        View Photo
                      </a>
                    </div>
                  )}

                  {isCaptain && user.captainProfile && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Vehicle:</span> {user.captainProfile.vehicleType} &middot; {user.captainProfile.vehicleNumber}</div>
                      <div><span className="text-muted-foreground">Aadhaar:</span> ****{user.captainProfile.aadhaarNumber ? user.captainProfile.aadhaarNumber.slice(-4) : 'N/A'}</div>
                    </div>
                  )}

                  {isCaptain && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">KYC Documents</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Aadhaar</span>
                            <Badge variant={
                              user.captainProfile?.aadhaarVerificationStatus === 'VERIFIED' ? 'default' :
                              user.captainProfile?.aadhaarVerificationStatus === 'REJECTED' ? 'destructive' : 'secondary'
                            }>
                              {user.captainProfile?.aadhaarVerificationStatus || 'PENDING'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.captainProfile?.aadhaarPhoto && (
                              <a href={`/api/upload/download?fileKey=${encodeURIComponent(user.captainProfile.aadhaarPhoto)}&bucket=private`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                View
                              </a>
                            )}
                            {user.captainProfile?.aadhaarVerificationStatus !== 'VERIFIED' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  disabled={!!actionLoading}
                                  onClick={() => handleKycVerification(user.captainProfile!.id, 'AADHAAR', 'VERIFIED')}
                                >
                                  Verify
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-destructive"
                                  disabled={!!actionLoading}
                                  onClick={() => {
                                    const reason = prompt('Rejection reason:')
                                    if (reason) handleKycVerification(user.captainProfile!.id, 'AADHAAR', 'REJECTED', reason)
                                  }}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        {user.captainProfile?.aadhaarRejectionReason && (
                          <p className="text-xs text-destructive ml-6">{user.captainProfile.aadhaarRejectionReason}</p>
                        )}
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">License</span>
                            <Badge variant={
                              user.captainProfile?.licenseVerificationStatus === 'VERIFIED' ? 'default' :
                              user.captainProfile?.licenseVerificationStatus === 'REJECTED' ? 'destructive' : 'secondary'
                            }>
                              {user.captainProfile?.licenseVerificationStatus || 'PENDING'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.captainProfile?.licensePhoto && (
                              <a href={`/api/upload/download?fileKey=${encodeURIComponent(user.captainProfile.licensePhoto)}&bucket=private`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                View
                              </a>
                            )}
                            {user.captainProfile?.licenseVerificationStatus !== 'VERIFIED' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  disabled={!!actionLoading}
                                  onClick={() => handleKycVerification(user.captainProfile!.id, 'LICENSE', 'VERIFIED')}
                                >
                                  Verify
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-destructive"
                                  disabled={!!actionLoading}
                                  onClick={() => {
                                    const reason = prompt('Rejection reason:')
                                    if (reason) handleKycVerification(user.captainProfile!.id, 'LICENSE', 'REJECTED', reason)
                                  }}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        {user.captainProfile?.licenseRejectionReason && (
                          <p className="text-xs text-destructive ml-6">{user.captainProfile.licenseRejectionReason}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Registered: {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {filter === 'PENDING' && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={!!actionLoading}
                        onClick={() => handleAction(user.id, 'APPROVE')}
                      >
                        {actionLoading === user.id + 'APPROVE'
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <CheckCircle2 className="h-3 w-3" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        disabled={!!actionLoading}
                        onClick={() => handleAction(user.id, 'REJECT')}
                      >
                        {actionLoading === user.id + 'REJECT'
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <XCircle className="h-3 w-3" />}
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
    </div>
  )
}
