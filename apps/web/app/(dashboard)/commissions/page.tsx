'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, Wallet, IndianRupee, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'

type Commission = {
  id: string
  role: string
  amount: number
  status: string
  createdAt: string
  user: { id: string; name: string; phone: string; displayId: string }
  bookingSegment: {
    booking: { bookingNumber: string; calculatedPrice: number }
    routeSegment: {
      fromLocation: { pointName: string; village: string; district: string }
      toLocation: { pointName: string; village: string; district: string }
    }
  }
}

export default function CommissionsPage() {
  const { accessToken, handleAuthError, hasRole } = useAuth()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [allCommissions, setAllCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('PENDING')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20
  const isPointManager = hasRole('POINT_MANAGER')
  const isAdmin = hasRole('ADMIN') || hasRole('SUPER_ADMIN')

  async function fetchCommissions() {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })
    if (activeTab !== 'ALL') params.set('status', activeTab)

    const endpoint = isPointManager ? '/api/commissions/my' : '/api/commissions/admin'
    const res = await fetch(`${endpoint}?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.status === 401) {
      handleAuthError()
      return
    }
    if (!res.ok) {
      console.error('Failed to fetch commissions:', res.status, res.statusText)
      setLoading(false)
      return
    }
    const data = await res.json()
    if (data.success) {
      setCommissions(data.data.items || data.data.entries || [])
      setTotal(data.data.total || data.data.entries?.length || 0)
    } else {
      console.error('Failed to fetch commissions:', data.error || 'Unknown error')
    }
    setLoading(false)
  }

  async function fetchAllCommissions() {
    const endpoint = isPointManager ? '/api/commissions/my' : '/api/commissions/admin'
    const res = await fetch(`${endpoint}?status=ALL&pageSize=1000`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success) {
        setAllCommissions(data.data.items || data.data.entries || [])
      }
    }
  }

  useEffect(() => { fetchCommissions() }, [page, activeTab])
  useEffect(() => { fetchAllCommissions() }, [])

  async function handleApprove(id: string) {
    setApproving(id)
    const res = await fetch(`/api/commissions/${id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (res.ok) {
      await fetchCommissions()
      await fetchAllCommissions()
    }
    setApproving(null)
  }

  async function handleProcessPayout() {
    if (selectedIds.length === 0) return
    setProcessing(true)
    const res = await fetch('/api/commissions/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ commissionIds: selectedIds }),
    })
    if (res.ok) {
      setSelectedIds([])
      await fetchCommissions()
      await fetchAllCommissions()
    }
    setProcessing(false)
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    if (selectedIds.length === commissions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(commissions.map((c) => c.id))
    }
  }

  const pendingCommissions = allCommissions.filter((c) => c.status === 'PENDING')
  const approvedCommissions = allCommissions.filter((c) => c.status === 'APPROVED')
  const paidCommissions = allCommissions.filter((c) => c.status === 'PAID')
  const totalApprovedAmount = approvedCommissions.reduce((sum, c) => sum + Number(c.amount), 0)
  const totalPaidAmount = paidCommissions.reduce((sum, c) => sum + Number(c.amount), 0)

  return (
    <div className="space-y-6" data-testid="commissions-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="page-title">
          {isPointManager ? 'My Commissions' : 'Commission Management'}
        </h1>
      </div>

      {/* Summary Cards - Only for Admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="summary-cards">
          <Card data-testid="pending-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="pending-count">{pendingCommissions.length}</p>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card data-testid="approved-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                Ready for Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="approved-amount">₹{Number(totalApprovedAmount).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{approvedCommissions.length} commissions</p>
            </CardContent>
          </Card>

          <Card data-testid="paid-count-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Total Paid Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="paid-count">{paidCommissions.length}</p>
              <p className="text-xs text-muted-foreground">Completed payouts</p>
            </CardContent>
          </Card>

          <Card data-testid="paid-amount-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <IndianRupee className="h-4 w-4" />
                Total Paid Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold" data-testid="paid-amount">₹{Number(totalPaidAmount).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total amount paid</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Cards - For Point Manager */}
      {isPointManager && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="pm-summary-cards">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingCommissions.length}</p>
              <p className="text-xs text-muted-foreground">₹{Number(pendingCommissions.reduce((sum, c) => sum + Number(c.amount), 0)).toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{approvedCommissions.length}</p>
              <p className="text-xs text-muted-foreground">₹{Number(totalApprovedAmount).toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{paidCommissions.length}</p>
              <p className="text-xs text-muted-foreground">₹{Number(totalPaidAmount).toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-testid="commissions-tabs">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="PENDING" data-testid="tab-pending">
            Pending ({allCommissions.filter((c) => c.status === 'PENDING').length})
          </TabsTrigger>
          <TabsTrigger value="APPROVED" data-testid="tab-approved">
            Approved ({allCommissions.filter((c) => c.status === 'APPROVED').length})
          </TabsTrigger>
          <TabsTrigger value="PAID" data-testid="tab-paid">
            Paid ({allCommissions.filter((c) => c.status === 'PAID').length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="PENDING" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Commissions</CardTitle>
              <CardDescription>{isPointManager ? 'Your commissions awaiting approval' : 'Review and approve these commission requests'}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pendingCommissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{isPointManager ? 'No pending commissions' : 'No pending commissions to review'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCommissions.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold">{commission.bookingSegment.booking.bookingNumber}</span>
                          <Badge variant="outline" className="text-xs">{commission.role}</Badge>
                        </div>
                        <p className="text-sm font-medium">₹{Number(commission.amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {commission.bookingSegment.routeSegment.fromLocation.pointName} → {commission.bookingSegment.routeSegment.toLocation.pointName}
                        </p>
                      </div>
                      {!isPointManager && (
                        <Button size="sm" onClick={() => handleApprove(commission.id)} disabled={approving === commission.id} className="gap-2">
                          {approving === commission.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Approve
                        </Button>
                      )}
                      {isPointManager && (
                        <Badge variant="secondary" className="text-xs">Pending</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="APPROVED" className="space-y-4">
          {!isPointManager && approvedCommissions.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-5 w-5" />Process Payout</CardTitle>
                <CardDescription>Select commissions to process as wallet payouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedIds.length === approvedCommissions.length} onChange={toggleSelectAll} className="h-4 w-4" />
                    <span className="text-sm">Select all ({approvedCommissions.length})</span>
                  </div>
                  <span className="text-sm font-medium">Selected: ₹{Number(approvedCommissions.filter(c => selectedIds.includes(c.id)).reduce((sum, c) => sum + c.amount, 0)).toFixed(2)}</span>
                </div>
                <Button onClick={handleProcessPayout} disabled={processing || selectedIds.length === 0} className="w-full gap-2">
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
                  Process Payout ({selectedIds.length})
                </Button>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approved Commissions</CardTitle>
              <CardDescription>{isPointManager ? 'Your approved commissions ready for payout' : 'Ready for payout to wallets'}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : approvedCommissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{isPointManager ? 'No approved commissions' : 'No approved commissions ready for payout'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedCommissions.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50">
                      <div className="flex items-center gap-3">
                        {!isPointManager && (
                          <input type="checkbox" checked={selectedIds.includes(commission.id)} onChange={() => toggleSelect(commission.id)} className="h-4 w-4" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-semibold">{commission.bookingSegment.booking.bookingNumber}</span>
                            <Badge variant="outline" className="text-xs">{commission.role}</Badge>
                          </div>
                          <p className="text-sm font-medium">₹{Number(commission.amount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {commission.bookingSegment.routeSegment.fromLocation.pointName} → {commission.bookingSegment.routeSegment.toLocation.pointName}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Approved</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paid Tab */}
        <TabsContent value="PAID" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paid Commissions</CardTitle>
              <CardDescription>{isPointManager ? 'Your completed commission payouts' : 'Commission payouts that have been completed'}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : paidCommissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{isPointManager ? 'No paid commissions yet' : 'No paid commissions yet'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paidCommissions.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold">{commission.bookingSegment.booking.bookingNumber}</span>
                          <Badge variant="outline" className="text-xs">{commission.role}</Badge>
                        </div>
                        <p className="text-sm font-medium">₹{Number(commission.amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {commission.bookingSegment.routeSegment.fromLocation.pointName} → {commission.bookingSegment.routeSegment.toLocation.pointName}
                        </p>
                      </div>
                      <Badge className="text-xs bg-green-100 text-green-800">Paid</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === Math.ceil(total / pageSize)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
