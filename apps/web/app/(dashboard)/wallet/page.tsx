'use client'

import { useEffect, useState, useRef } from 'react'
import Script from 'next/script'
import { Wallet, ArrowUp, ArrowDown, History, Loader2, IndianRupee, X, Download, Printer, CreditCard, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'

type WalletData = {
  id: string
  balance: number
  transactions: Array<{
    id: string
    type: string
    amount: number
    balanceBefore: number
    balanceAfter: number
    description: string | null
    referenceType: string | null
    createdAt: string
  }>
}

type PaginationData = {
  skip: number
  take: number
  total: number
  hasMore: boolean
}

const TRANSACTION_LABELS: Record<string, string> = {
  RECHARGE: 'Recharge',
  BOOKING_PAYMENT: 'Booking Payment',
  REFUND: 'Refund',
  CASHBACK: 'Cashback',
  REFERRAL_BONUS: 'Referral Bonus',
  REFERRAL_EARNING: 'Referral Earning',
  ADMIN_ADJUSTMENT: 'Admin Adjustment',
  CREDIT: 'Commission Payout',
  DEBIT: 'Withdrawal',
}

const TRANSACTION_COLORS: Record<string, string> = {
  RECHARGE: 'text-green-600',
  BOOKING_PAYMENT: 'text-red-600',
  REFUND: 'text-green-600',
  CASHBACK: 'text-green-600',
  REFERRAL_BONUS: 'text-green-600',
  REFERRAL_EARNING: 'text-green-600',
  ADMIN_ADJUSTMENT: 'text-yellow-600',
  CREDIT: 'text-green-600',
  DEBIT: 'text-red-600',
}

export default function WalletPage() {
  const { accessToken, syncFromCookies } = useAuth()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [recharging, setRecharging] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState('500')
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [showPayoutDetailsModal, setShowPayoutDetailsModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<WalletData['transactions'][0] | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  const [payoutDetails, setPayoutDetails] = useState<any>(null)
  const [payoutType, setPayoutType] = useState<'UPI' | 'BANK_TRANSFER'>('UPI')
  const [payoutForm, setPayoutForm] = useState({
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
  })
  const [savingPayoutDetails, setSavingPayoutDetails] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNotes, setWithdrawNotes] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawals, setWithdrawals] = useState<any[]>([])

  useEffect(() => {
    syncFromCookies()
  }, [syncFromCookies])

  useEffect(() => {
    if (accessToken) {
      fetchWallet()
      fetchPayoutDetails()
      fetchWithdrawals()
    }
  }, [accessToken])

  async function fetchPayoutDetails() {
    try {
      const res = await fetch('/api/payout-details', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        console.error('Failed to fetch payout details:', res.status, res.statusText)
        return
      }
      const data = await res.json()
      if (data.success && data.data) {
        setPayoutDetails(data.data)
        setPayoutType(data.data.type)
        setPayoutForm({
          upiId: data.data.upiId || '',
          bankName: data.data.bankName || '',
          accountNumber: data.data.accountNumber || '',
          ifscCode: data.data.ifscCode || '',
          accountHolderName: data.data.accountHolderName || '',
        })
      }
    } catch (err) {
      console.error('Error fetching payout details:', err)
    }
  }

  async function handleSavePayoutDetails() {
    setSavingPayoutDetails(true)
    const payload = {
      type: payoutType,
      ...(payoutType === 'UPI' ? { upiId: payoutForm.upiId } : {
        bankName: payoutForm.bankName,
        accountNumber: payoutForm.accountNumber,
        ifscCode: payoutForm.ifscCode,
        accountHolderName: payoutForm.accountHolderName,
      }),
    }

    const res = await fetch('/api/payout-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (data.success) {
      setPayoutDetails(data.data)
      setShowPayoutDetailsModal(false)
    } else {
      alert(data.error || 'Failed to save payout details')
    }
    setSavingPayoutDetails(false)
  }

  async function fetchWithdrawals() {
    try {
      const res = await fetch('/api/withdrawals', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.success) {
        setWithdrawals(data.data.items)
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err)
    }
  }

  async function handleWithdraw() {
    setWithdrawing(true)
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount: Number(withdrawAmount),
          notes: withdrawNotes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowWithdrawModal(false)
        setWithdrawAmount('')
        setWithdrawNotes('')
        fetchWallet()
        fetchWithdrawals()
      } else {
        alert(data.error || 'Failed to create withdrawal request')
      }
    } catch (err) {
      console.error('Error creating withdrawal:', err)
      alert('Failed to create withdrawal request')
    } finally {
      setWithdrawing(false)
    }
  }

  async function fetchWallet(skip = 0, take = 10, append = false, typeParam: string | null = null) {
    if (!append) setLoading(true)
    else setLoadingMore(true)
    try {
      const url = new URL('/api/wallet/my', window.location.origin)
      url.searchParams.set('page', String(Math.floor(skip / take) + 1))
      url.searchParams.set('pageSize', take.toString())
      // Always use typeParam if provided, otherwise use state
      const filterType = typeParam !== undefined ? typeParam : typeFilter
      if (filterType) url.searchParams.set('type', filterType)

      console.log('[WALLET_FETCH] URL:', url.toString(), 'typeParam:', typeParam, 'typeFilter:', typeFilter, 'filterType:', filterType)

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      console.log('[WALLET_FETCH] Response:', data)
      console.log('[WALLET_FETCH] Balance:', data.data?.wallet?.balance, 'Type:', typeof data.data?.wallet?.balance)
      if (data.success) {
        if (append && wallet) {
          setWallet({
            ...data.data.wallet,
            transactions: [...wallet.transactions, ...data.data.transactions],
          })
        } else {
          setWallet({
            ...data.data.wallet,
            transactions: data.data.transactions,
          })
        }
        setPagination({
          skip,
          take,
          total: data.data.total,
          hasMore: (skip + take) < data.data.total,
        })
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err)
    }
    if (!append) setLoading(false)
    else setLoadingMore(false)
  }

  function handleLoadMore() {
    if (pagination && pagination.hasMore) {
      fetchWallet(pagination.skip + pagination.take, pagination.take, true)
    }
  }

  function handleFilterChange(type: string | null) {
    setTypeFilter(type)
    setWallet(null)
    setPagination(null)
    fetchWallet(0, 10, false, type)
  }

  function handleViewReceipt(tx: WalletData['transactions'][0]) {
    setSelectedTransaction(tx)
    setShowReceiptModal(true)
  }

  function handleDownloadReceipt() {
    if (!receiptRef.current) return
    const printContent = receiptRef.current.innerHTML
    const printWindow = window.open('', '', 'width=600,height=800')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${selectedTransaction?.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .receipt { max-width: 400px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
              .row { display: flex; justify-content: space-between; margin: 10px 0; }
              .label { color: #666; }
              .value { font-weight: bold; }
              .amount { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  async function handleRecharge() {
    const amount = Number(rechargeAmount)
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setRecharging(true)
    try {
      const res = await fetch('/api/wallet/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json()
      if (data.success) {
        // Open Razorpay checkout
        const options = {
          key: data.data.keyId,
          amount: data.data.amount,
          currency: data.data.currency,
          name: 'Village Express',
          description: 'Wallet Recharge',
          order_id: data.data.orderId,
          handler: async function (response: any) {
            // Verify payment
            const verifyRes = await fetch('/api/wallet/recharge/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              setShowRechargeModal(false)
              fetchWallet()
              alert('Wallet recharged successfully!')
            } else {
              alert('Payment verification failed')
            }
          },
          prefill: {
            name: '',
            email: '',
            contact: '',
          },
          theme: {
            color: '#3B82F6',
          },
        }
        
        const rzp = new (window as any).Razorpay(options)
        rzp.open()
      } else {
        alert(data.error || 'Failed to initiate recharge')
      }
    } catch (err) {
      console.error('Failed to initiate recharge:', err)
      alert('Failed to initiate recharge')
    }
    setRecharging(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="wallet-page">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="page-title">My Wallet</h1>
        <p className="text-sm text-muted-foreground" data-testid="page-description">Manage your wallet balance and transactions</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" data-testid="balance-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Available Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold" data-testid="balance-amount">₹{Number(wallet?.balance || 0).toFixed(2)}</p>
              <p className="text-sm opacity-80 mt-1">Available for bookings</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowPayoutDetailsModal(true)}
                variant="secondary"
                className="gap-2"
                data-testid="payout-details-button"
              >
                <CreditCard className="h-4 w-4" />
                Payout Details
              </Button>
              <Button
                onClick={() => setShowWithdrawModal(true)}
                variant="secondary"
                className="gap-2"
                data-testid="withdraw-button"
              >
                <ArrowDown className="h-4 w-4" />
                Withdraw
              </Button>
              <Button
                onClick={() => setShowRechargeModal(true)}
                variant="secondary"
                className="gap-2"
                data-testid="recharge-button"
              >
                <ArrowUp className="h-4 w-4" />
                Recharge
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Details Card */}
      {payoutDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Payout Details
            </CardTitle>
            <CardDescription>Your payout information for withdrawals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Method</span>
                <Badge variant="outline">{payoutDetails.type}</Badge>
              </div>
              {payoutDetails.type === 'UPI' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">UPI ID</span>
                  <span className="text-sm font-medium">{payoutDetails.upiId}</span>
                </div>
              )}
              {payoutDetails.type === 'BANK_TRANSFER' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bank Name</span>
                    <span className="text-sm font-medium">{payoutDetails.bankName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Account Number</span>
                    <span className="text-sm font-medium">{payoutDetails.accountNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">IFSC Code</span>
                    <span className="text-sm font-medium">{payoutDetails.ifscCode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Account Holder</span>
                    <span className="text-sm font-medium">{payoutDetails.accountHolderName}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recharge Modal */}
      {showRechargeModal && (
        <Card>
          <CardHeader>
            <CardTitle>Recharge Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRecharge}
                disabled={recharging}
                className="flex-1"
              >
                {recharging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Pay ₹{rechargeAmount}
              </Button>
              <Button
                onClick={() => setShowRechargeModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout Details Modal */}
      {showPayoutDetailsModal && (
        <Card>
          <CardHeader>
            <CardTitle>Payout Details</CardTitle>
            <CardDescription>Add your UPI or bank account details for withdrawals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Payout Method</Label>
              <Select value={payoutType} onValueChange={(value: any) => setPayoutType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {payoutType === 'UPI' && (
              <div className="space-y-1.5">
                <Label>UPI ID</Label>
                <Input
                  value={payoutForm.upiId}
                  onChange={(e) => setPayoutForm({ ...payoutForm, upiId: e.target.value })}
                  placeholder="yourname@upi"
                />
              </div>
            )}

            {payoutType === 'BANK_TRANSFER' && (
              <>
                <div className="space-y-1.5">
                  <Label>Bank Name</Label>
                  <Input
                    value={payoutForm.bankName}
                    onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                    placeholder="State Bank of India"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Number</Label>
                  <Input
                    value={payoutForm.accountNumber}
                    onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>IFSC Code</Label>
                  <Input
                    value={payoutForm.ifscCode}
                    onChange={(e) => setPayoutForm({ ...payoutForm, ifscCode: e.target.value })}
                    placeholder="SBIN0001234"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Holder Name</Label>
                  <Input
                    value={payoutForm.accountHolderName}
                    onChange={(e) => setPayoutForm({ ...payoutForm, accountHolderName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSavePayoutDetails}
                disabled={savingPayoutDetails}
                className="flex-1"
              >
                {savingPayoutDetails ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Details
              </Button>
              <Button
                onClick={() => setShowPayoutDetailsModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <Card>
          <CardHeader>
            <CardTitle>Withdraw Funds</CardTitle>
            <CardDescription>Withdraw money to your linked bank account or UPI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!payoutDetails ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">Please add payout details first</p>
                <Button onClick={() => setShowWithdrawModal(false)}>Cancel</Button>
              </div>
            ) : (
              <>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold">₹{Number(wallet?.balance || 0).toFixed(2)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    max={Number(wallet?.balance || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes (Optional)</Label>
                  <Input
                    value={withdrawNotes}
                    onChange={(e) => setWithdrawNotes(e.target.value)}
                    placeholder="Any notes for this withdrawal"
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Payout Method:</strong> {payoutDetails.type}
                    {payoutDetails.type === 'UPI' && (
                      <span className="ml-2">UPI: {payoutDetails.upiId}</span>
                    )}
                    {payoutDetails.type === 'BANK_TRANSFER' && (
                      <span className="ml-2">Bank: {payoutDetails.bankName} - {payoutDetails.accountNumber}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleWithdraw}
                    disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) > Number(wallet?.balance || 0)}
                    className="flex-1"
                  >
                    {withdrawing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Withdraw ₹{withdrawAmount || '0'}
                  </Button>
                  <Button
                    onClick={() => setShowWithdrawModal(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Withdrawals History */}
      {withdrawals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Withdrawal Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">₹{withdrawal.amount}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      withdrawal.status === 'COMPLETED' ? 'default' :
                      withdrawal.status === 'REJECTED' ? 'destructive' :
                      withdrawal.status === 'PENDING' ? 'secondary' : 'outline'
                    }
                  >
                    {withdrawal.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Transactions
            {pagination && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({wallet?.transactions.length || 0} of {pagination.total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              size="sm"
              variant={typeFilter === null ? "default" : "outline"}
              onClick={() => handleFilterChange(null)}
            >
              All
            </Button>
            {Object.keys(TRANSACTION_LABELS).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={typeFilter === type ? "default" : "outline"}
                onClick={() => handleFilterChange(type)}
              >
                {TRANSACTION_LABELS[type]}
              </Button>
            ))}
            {typeFilter && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleFilterChange(null)}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {wallet?.transactions && wallet.transactions.length > 0 ? (
            <div className="space-y-3">
              {wallet.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium">{tx.description || TRANSACTION_LABELS[tx.type] || tx.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-semibold ${TRANSACTION_COLORS[tx.type] || 'text-muted-foreground'}`}>
                        {['RECHARGE', 'REFUND', 'CASHBACK', 'REFERRAL_BONUS', 'REFERRAL_EARNING', 'CREDIT'].includes(tx.type) || tx.referenceType === 'COMMISSION' ? '+' : '-'}
                        ₹{Number(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bal: ₹{Number(tx.balanceAfter).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewReceipt(tx)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {pagination && pagination.hasMore && (
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="w-full mt-4"
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Load More Transactions
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Recharge your wallet to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transaction Receipt</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowReceiptModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div ref={receiptRef} className="receipt bg-white p-6 rounded-lg border">
                {/* Header with Logo */}
                <div className="header text-center mb-6">
                  <div className="logo text-2xl font-bold text-blue-600 mb-2">Village Express</div>
                  <div className="text-sm text-gray-500">Wallet Transaction Receipt</div>
                </div>

                {/* Transaction Details */}
                <div className="space-y-3">
                  <div className="row">
                    <span className="label text-sm text-gray-600">Transaction ID</span>
                    <span className="value text-sm font-medium">{selectedTransaction.id.slice(0, 8)}...</span>
                  </div>
                  <div className="row">
                    <span className="label text-sm text-gray-600">Type</span>
                    <span className="value text-sm font-medium">{TRANSACTION_LABELS[selectedTransaction.type] || selectedTransaction.type}</span>
                  </div>
                  <div className="row">
                    <span className="label text-sm text-gray-600">Date</span>
                    <span className="value text-sm font-medium">
                      {new Date(selectedTransaction.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="row">
                    <span className="label text-sm text-gray-600">Description</span>
                    <span className="value text-sm font-medium text-right max-w-[200px]">
                      {selectedTransaction.description || '-'}
                    </span>
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="row">
                      <span className="label text-sm text-gray-600">Balance Before</span>
                      <span className="value text-sm font-medium">₹{Number(selectedTransaction.balanceBefore).toFixed(2)}</span>
                    </div>
                    <div className="row">
                      <span className="label text-sm text-gray-600">Balance After</span>
                      <span className="value text-sm font-medium">₹{Number(selectedTransaction.balanceAfter).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="amount text-center py-4">
                    <div className="text-3xl font-bold">
                      {['RECHARGE', 'REFUND', 'CASHBACK', 'REFERRAL_BONUS', 'REFERRAL_EARNING', 'CREDIT'].includes(selectedTransaction.type) ? '+' : '-'}
                      ₹{Number(selectedTransaction.amount).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="footer text-center mt-6 text-xs text-gray-500">
                  <p>Thank you for using Village Express</p>
                  <p className="mt-1">Generated on {new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button onClick={handleDownloadReceipt} className="flex-1 gap-2">
                  <Printer className="h-4 w-4" />
                  Print / Download
                </Button>
                <Button variant="outline" onClick={() => setShowReceiptModal(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
