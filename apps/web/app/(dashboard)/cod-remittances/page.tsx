'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, XCircle, Clock, IndianRupee, User, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'

type Remittance = {
  id: string
  amount: number
  remittanceMethod: string
  remittanceDate: string
  transactionId: string | null
  bankReferenceNumber: string | null
  status: string
  notes: string | null
  user: {
    id: string
    name: string
    phone: string
    displayId: string
  }
  collection: {
    booking: {
      bookingNumber: string
      calculatedPrice: number
    }
  }
}

export default function CodRemittancesPage() {
  const { accessToken, handleAuthError, hasRole } = useAuth()
  const [remittances, setRemittances] = useState<Remittance[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20
  const [selectedRemittance, setSelectedRemittance] = useState<Remittance | null>(null)
  const [actionDialog, setActionDialog] = useState<{ type: 'approve' | 'reject'; remittance: Remittance } | null>(null)
  const [transactionId, setTransactionId] = useState('')
  const [processing, setProcessing] = useState(false)
  const isPointManager = hasRole('POINT_MANAGER')
  const isAdmin = hasRole('ADMIN') || hasRole('SUPER_ADMIN')

  useEffect(() => {
    fetchRemittances()
  }, [accessToken, statusFilter, page])

  async function fetchRemittances() {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })
    if (statusFilter !== 'ALL') params.set('status', statusFilter)

    const endpoint = isPointManager ? '/api/cod/remittances' : '/api/admin/cod-remittances'
    const res = await fetch(`${endpoint}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.status === 401) {
      handleAuthError()
      setLoading(false)
      return
    }
    const data = await res.json()
    if (data.success) {
      setRemittances(data.data.items)
      setTotal(data.data.total)
    }
    setLoading(false)
  }

  async function updateRemittanceStatus(remittanceId: string, status: string) {
    setProcessing(true)
    const res = await fetch('/api/admin/cod-remittances', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        remittanceId,
        status,
        transactionId: transactionId || null,
      }),
    })
    if (res.status === 401) {
      handleAuthError()
      setProcessing(false)
      return
    }
    const data = await res.json()
    if (data.success) {
      setActionDialog(null)
      setTransactionId('')
      await fetchRemittances()
    } else {
      alert(data.error || 'Failed to update remittance')
    }
    setProcessing(false)
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
  }

  const statusIcons: Record<string, any> = {
    PENDING: Clock,
    PROCESSING: Loader2,
    COMPLETED: CheckCircle,
    FAILED: XCircle,
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6" data-testid="cod-remittances-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-title">
            {isPointManager ? 'My COD Remittances' : 'COD Remittances'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5" data-testid="page-description">
            {isPointManager ? 'View your COD settlement history' : 'Review and approve COD settlements from point managers'}
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="status-filter">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64" data-testid="loading-state">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : remittances.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No remittances found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="remittances-list">
          {remittances.map((remittance) => {
            const StatusIcon = statusIcons[remittance.status] || Clock
            return (
              <Card key={remittance.id} data-testid={`remittance-card-${remittance.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={statusColors[remittance.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {remittance.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(remittance.remittanceDate).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {!isPointManager && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{remittance.user.name}</p>
                              <p className="text-xs text-muted-foreground">{remittance.user.displayId}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">₹{Number(remittance.amount).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{remittance.remittanceMethod}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{remittance.collection.booking.bookingNumber}</p>
                            <p className="text-xs text-muted-foreground">Booking</p>
                          </div>
                        </div>
                      </div>

                      {remittance.transactionId && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Transaction ID: </span>
                          <span className="font-mono">{remittance.transactionId}</span>
                        </div>
                      )}
                      {remittance.bankReferenceNumber && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Bank Reference: </span>
                          <span className="font-mono">{remittance.bankReferenceNumber}</span>
                        </div>
                      )}
                    </div>

                    {!isPointManager && remittance.status === 'PENDING' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => setActionDialog({ type: 'approve', remittance })}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setActionDialog({ type: 'reject', remittance })}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} remittances
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

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(open) => !open && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === 'approve' ? 'Approve Remittance' : 'Reject Remittance'}
            </DialogTitle>
          </DialogHeader>
          {actionDialog && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-medium">₹{Number(actionDialog.remittance.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Point Manager:</span>
                  <span className="font-medium">{actionDialog.remittance.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Method:</span>
                  <span className="font-medium">{actionDialog.remittance.remittanceMethod}</span>
                </div>
              </div>

              {actionDialog.type === 'approve' && (
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                  <Input
                    id="transactionId"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter bank reference or UPI transaction ID"
                  />
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                {actionDialog.type === 'approve'
                  ? 'Are you sure you want to approve this remittance?'
                  : 'Are you sure you want to reject this remittance?'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (actionDialog) {
                  updateRemittanceStatus(
                    actionDialog.remittance.id,
                    actionDialog.type === 'approve' ? 'COMPLETED' : 'FAILED'
                  )
                }
              }}
              disabled={processing}
              variant={actionDialog?.type === 'reject' ? 'destructive' : 'default'}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionDialog?.type === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
