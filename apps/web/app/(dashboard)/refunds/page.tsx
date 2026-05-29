'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, PackageSearch, IndianRupee, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'

type Refund = {
  id: string
  bookingNumber: string
  status: string
  calculatedPrice: number
  paymentStatus: string
  paymentMethod: string
  createdAt: string
  customer: { id: string; name: string; phone: string }
  pickupLocation: { pointName: string; village: string }
  dropLocation: { pointName: string; village: string }
}

const STATUS_COLORS: Record<string, string> = {
  REFUNDED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
}

export default function RefundsPage() {
  const { accessToken } = useAuth()
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20

  async function fetchRefunds() {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) })
    if (statusFilter !== 'ALL') params.set('status', statusFilter)

    fetch(`/api/refunds?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) { setRefunds(d.data.items); setTotal(d.data.total) } })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRefunds() }, [statusFilter, page, accessToken])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Refunds</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total refund{total !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRefunds} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {loading ? (
          <CardContent className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : refunds.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PackageSearch className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No refunds found</p>
          </CardContent>
        ) : (
          <div className="divide-y">
            {refunds.map((refund) => (
              <div key={refund.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/bookings/${refund.id}`} className="font-mono text-sm font-semibold hover:text-primary">
                        {refund.bookingNumber}
                      </Link>
                      <Badge variant="outline" className="text-xs">{refund.paymentMethod}</Badge>
                      <Badge variant={refund.paymentStatus === 'REFUNDED' ? 'default' : 'secondary'} className="text-xs">
                        {refund.paymentStatus}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-4 text-sm">
                      <div className="flex items-start gap-1.5 flex-1 min-w-0">
                        <div className="min-w-0">
                          <p className="text-muted-foreground text-xs">Route</p>
                          <p className="font-medium truncate">{refund.pickupLocation.pointName} → {refund.dropLocation.pointName}</p>
                          <p className="text-xs text-muted-foreground">{refund.pickupLocation.village} → {refund.dropLocation.village}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Customer</p>
                        <p className="font-medium">{refund.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{refund.customer.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-lg font-bold text-primary flex items-center justify-end gap-1">
                      <IndianRupee className="h-4 w-4" />{Number(refund.calculatedPrice).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(refund.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} refunds
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
