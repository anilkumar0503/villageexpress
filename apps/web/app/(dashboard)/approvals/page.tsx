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
  createdAt: string
  userRoles: { role: { name: string }; isPrimary: boolean }[]
  pointManagerProfile: { shopName: string; shopPhoto: string | null } | null
  captainProfile: { vehicleType: string; vehicleNumber: string; aadhaarNumber: string; aadhaarPhoto: string | null; licensePhoto: string | null } | null
}

export default function ApprovalsPage() {
  const { accessToken } = useAuth()
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function fetchPending() {
    setLoading(true)
    const res = await fetch('/api/users?approvalStatus=PENDING&pageSize=50', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const data = await res.json()
    if (data.success) setUsers(data.data.items)
    setLoading(false)
  }

  useEffect(() => { fetchPending() }, [])

  async function handleAction(userId: string, action: 'APPROVE' | 'REJECT') {
    setActionLoading(userId + action)
    await fetch(`/api/users/${userId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action }),
    })
    setActionLoading(null)
    fetchPending()
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
        <h1 className="text-2xl font-bold tracking-tight" data-testid="page-title">Pending Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="pending-count">
          {users.length} registration{users.length !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {users.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">No pending registrations.</p>
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
                    <Badge variant={isPM ? 'default' : 'secondary'}>
                      {isPM ? 'Point Manager' : isCaptain ? 'Captain' : role}
                    </Badge>
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
                      <a href={user.pointManagerProfile.shopPhoto} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
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
                      <p className="text-xs font-medium text-muted-foreground">Documents</p>
                      <div className="flex flex-wrap gap-3">
                        {user.captainProfile?.aadhaarPhoto && (
                          <a href={user.captainProfile.aadhaarPhoto} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                            <FileText className="h-4 w-4" />
                            Aadhaar Photo
                          </a>
                        )}
                        {user.captainProfile?.licensePhoto && (
                          <a href={user.captainProfile.licensePhoto} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                            <FileText className="h-4 w-4" />
                            License Photo
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Registered: {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>

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
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
