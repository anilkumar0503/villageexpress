'use client'

import { useEffect, useState } from 'react'
import { IndianRupee, Wallet, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

type CodCollection = {
  id: string
  amount: number
  collectionDate: string
  collectionMethod: string
  status: string
  collectedBy: string | null
  notes: string | null
  user: {
    id: string
    name: string
    phone: string
    displayId: string
  }
  booking: {
    bookingNumber: string
    calculatedPrice: number
    paymentStatus: string
    customer: {
      name: string
      phone: string
    }
  }
  remittances: Array<{
    id: string
    amount: number
    remittanceMethod: string
    status: string
    remittanceDate: string
  }>
}

type CodRemittance = {
  id: string
  amount: number
  remittanceMethod: string
  status: string
  remittanceDate: string
  transactionId: string | null
  bankReferenceNumber: string | null
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

const STATUS_COLORS: Record<string, string> = {
  COLLECTED: 'bg-blue-100 text-blue-800',
  REMITTED: 'bg-green-100 text-green-800',
  PARTIALLY_REMITTED: 'bg-yellow-100 text-yellow-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
}

const METHOD_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  AUTO_DEBIT: 'Auto Debit',
  RAZORPAY: 'Razorpay',
}

export default function CodPage() {
  const { accessToken } = useAuth()
  const [view, setView] = useState<'collections' | 'remittances'>('collections')
  const [collections, setCollections] = useState<CodCollection[]>([])
  const [remittances, setRemittances] = useState<CodRemittance[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  useEffect(() => {
    if (accessToken) fetchData()
  }, [accessToken, view, statusFilter])

  async function fetchData() {
    setLoading(true)
    try {
      const type = view === 'collections' ? 'collections' : 'remittances'
      const url = new URL(`/api/cod/admin?type=${type}`, window.location.origin)
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter)
      url.searchParams.set('page', '1')
      url.searchParams.set('pageSize', '50')

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()

      if (data.success) {
        if (view === 'collections') {
          setCollections(data.data.items)
        } else {
          setRemittances(data.data.items)
        }
      }
    } catch (err) {
      console.error('Error fetching COD data:', err)
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-2xl font-bold tracking-tight">COD Management</h1>
        <p className="text-sm text-muted-foreground">Track COD collections and remittances from point managers</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={view === 'collections' ? 'default' : 'outline'}
          onClick={() => setView('collections')}
        >
          <Wallet className="h-4 w-4 mr-2" />
          Collections
        </Button>
        <Button
          variant={view === 'remittances' ? 'default' : 'outline'}
          onClick={() => setView('remittances')}
        >
          <IndianRupee className="h-4 w-4 mr-2" />
          Remittances
        </Button>
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
        {view === 'collections' ? (
          <>
            <Button
              size="sm"
              variant={statusFilter === 'COLLECTED' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('COLLECTED')}
            >
              Collected
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'REMITTED' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('REMITTED')}
            >
              Remitted
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'PARTIALLY_REMITTED' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('PARTIALLY_REMITTED')}
            >
              Partially Remitted
            </Button>
          </>
        ) : (
          <>
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
              variant={statusFilter === 'FAILED' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('FAILED')}
            >
              Failed
            </Button>
          </>
        )}
      </div>

      {/* Collections Table */}
      {view === 'collections' && (
        <Card>
          <CardHeader>
            <CardTitle>COD Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Booking</th>
                    <th className="text-left p-3">Point Manager</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Method</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Remitted</th>
                    <th className="text-left p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((collection) => (
                    <tr key={collection.id} className="border-b">
                      <td className="p-3">
                        <div className="font-medium">{collection.booking.bookingNumber}</div>
                        <div className="text-sm text-muted-foreground">₹{collection.booking.calculatedPrice}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{collection.user.name}</div>
                        <div className="text-sm text-muted-foreground">{collection.user.displayId}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{collection.booking.customer.name}</div>
                        <div className="text-sm text-muted-foreground">{collection.booking.customer.phone}</div>
                      </td>
                      <td className="p-3 font-medium">₹{collection.amount}</td>
                      <td className="p-3">
                        <Badge variant="outline">{METHOD_LABELS[collection.collectionMethod] || collection.collectionMethod}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={STATUS_COLORS[collection.status]}>
                          {collection.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {collection.remittances.length > 0 ? (
                          <div>
                            <div className="font-medium">₹{collection.remittances.reduce((sum, r) => sum + r.amount, 0)}</div>
                            <div className="text-sm text-muted-foreground">{collection.remittances.length} payment(s)</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(collection.collectionDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {collections.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No COD collections found</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remittances Table */}
      {view === 'remittances' && (
        <Card>
          <CardHeader>
            <CardTitle>COD Remittances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Booking</th>
                    <th className="text-left p-3">Point Manager</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Method</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Transaction ID</th>
                    <th className="text-left p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {remittances.map((remittance) => (
                    <tr key={remittance.id} className="border-b">
                      <td className="p-3">
                        <div className="font-medium">{remittance.collection.booking.bookingNumber}</div>
                        <div className="text-sm text-muted-foreground">₹{remittance.collection.booking.calculatedPrice}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{remittance.user.name}</div>
                        <div className="text-sm text-muted-foreground">{remittance.user.displayId}</div>
                      </td>
                      <td className="p-3 font-medium">₹{remittance.amount}</td>
                      <td className="p-3">
                        <Badge variant="outline">{METHOD_LABELS[remittance.remittanceMethod] || remittance.remittanceMethod}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={STATUS_COLORS[remittance.status]}>
                          {remittance.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {remittance.transactionId || '-'}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(remittance.remittanceDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {remittances.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No COD remittances found</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
