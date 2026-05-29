'use client'

import { useEffect, useState } from 'react'
import { IndianRupee, Wallet, CheckCircle, XCircle, Clock, Loader2, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'

type WithdrawalRequest = {
  id: string
  amount: number
  status: string
  notes: string | null
  rejectionReason: string | null
  transactionId: string | null
  createdAt: string
  processedAt: string | null
  user: {
    id: string
    name: string
    phone: string
    displayId: string
  }
  wallet: {
    balance: number
  }
  payoutDetails: {
    type: string
    upiId: string | null
    bankName: string | null
    accountNumber: string | null
    ifscCode: string | null
    accountHolderName: string | null
  } | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
}

export default function WithdrawalsPage() {
  const { accessToken } = useAuth()
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [transactionId, setTransactionId] = useState('')

  useEffect(() => {
    if (accessToken) fetchWithdrawals()
  }, [accessToken, statusFilter])

  async function fetchWithdrawals() {
    setLoading(true)
    try {
      const url = new URL('/api/withdrawals/admin', window.location.origin)
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter)
      url.searchParams.set('page', '1')
      url.searchParams.set('pageSize', '50')

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()

      if (data.success) {
        setWithdrawals(data.data.items)
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(withdrawalId: string) {
    setProcessingId(withdrawalId)
    try {
      const res = await fetch(`/api/withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: 'APPROVE',
          transactionId: transactionId || undefined,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setTransactionId('')
        fetchWithdrawals()
      } else {
        alert(data.error || 'Failed to approve withdrawal')
      }
    } catch (err) {
      console.error('Error approving withdrawal:', err)
      alert('Failed to approve withdrawal')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject() {
    if (!rejectId || !rejectReason) {
      alert('Please provide a rejection reason')
      return
    }

    setProcessingId(rejectId)
    try {
      const res = await fetch(`/api/withdrawals/${rejectId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason: rejectReason,
        }),
      })
      const data = await res.json()

      if (data.success) {
        setShowRejectModal(false)
        setRejectId(null)
        setRejectReason('')
        fetchWithdrawals()
      } else {
        alert(data.error || 'Failed to reject withdrawal')
      }
    } catch (err) {
      console.error('Error rejecting withdrawal:', err)
      alert('Failed to reject withdrawal')
    } finally {
      setProcessingId(null)
    }
  }

  function openRejectModal(id: string) {
    setRejectId(id)
    setShowRejectModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Withdrawal Requests</h1>
        <p className="text-sm text-muted-foreground">Process withdrawal requests from captains and point managers</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={statusFilter === 'ALL' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('ALL')}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('PENDING')}
        >
          Pending
        </Button>
        <Button
          size="sm"
          variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('COMPLETED')}
        >
          Completed
        </Button>
        <Button
          size="sm"
          variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('REJECTED')}
        >
          Rejected
        </Button>
      </div>

      {/* Withdrawals List */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">₹{withdrawal.amount}</span>
                      <Badge className={STATUS_COLORS[withdrawal.status]}>
                        {withdrawal.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>User: {withdrawal.user.name} ({withdrawal.user.displayId})</p>
                      <p>Phone: {withdrawal.user.phone}</p>
                      <p>Date: {new Date(withdrawal.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Wallet Balance</p>
                    <p className="font-medium">₹{withdrawal.wallet.balance}</p>
                  </div>
                </div>

                {withdrawal.payoutDetails && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Payout Details</p>
                    <p className="text-sm text-muted-foreground">
                      Method: {withdrawal.payoutDetails.type}
                    </p>
                    {withdrawal.payoutDetails.type === 'UPI' && (
                      <p className="text-sm text-muted-foreground">
                        UPI ID: {withdrawal.payoutDetails.upiId}
                      </p>
                    )}
                    {withdrawal.payoutDetails.type === 'BANK_TRANSFER' && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Bank: {withdrawal.payoutDetails.bankName}</p>
                        <p>Account: {withdrawal.payoutDetails.accountNumber}</p>
                        <p>IFSC: {withdrawal.payoutDetails.ifscCode}</p>
                        <p>Holder: {withdrawal.payoutDetails.accountHolderName}</p>
                      </div>
                    )}
                  </div>
                )}

                {withdrawal.notes && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Notes:</span> {withdrawal.notes}
                  </div>
                )}

                {withdrawal.rejectionReason && (
                  <div className="text-sm text-red-600">
                    <span className="font-medium">Rejection Reason:</span> {withdrawal.rejectionReason}
                  </div>
                )}

                {withdrawal.transactionId && (
                  <div className="text-sm text-green-600">
                    <span className="font-medium">Transaction ID:</span> {withdrawal.transactionId}
                  </div>
                )}

                {withdrawal.status === 'PENDING' && (
                  <div className="flex gap-2 pt-2">
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Transaction ID (optional)"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                      <Button
                        onClick={() => handleApprove(withdrawal.id)}
                        disabled={processingId === withdrawal.id}
                        className="gap-2"
                      >
                        {processingId === withdrawal.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve
                      </Button>
                    </div>
                    <Button
                      onClick={() => openRejectModal(withdrawal.id)}
                      disabled={processingId === withdrawal.id}
                      variant="destructive"
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {withdrawals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No withdrawal requests found</div>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      {showRejectModal && (
        <Card>
          <CardHeader>
            <CardTitle>Reject Withdrawal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Rejection Reason</Label>
              <Input
                value={rejectReason}
                onChange={(e: any) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={processingId === rejectId}
                variant="destructive"
                className="flex-1"
              >
                {processingId === rejectId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Rejection
              </Button>
              <Button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectId(null)
                  setRejectReason('')
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
