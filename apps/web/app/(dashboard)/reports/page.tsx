'use client'

import { useEffect, useState } from 'react'
import { Loader2, BarChart3, TrendingUp, Package, IndianRupee, Wallet, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'

type ReportData = {
  totalSegments: number
  receivedSegments: number
  assignedSegments: number
  deliveredSegments: number
  codCollected: number
  commissionsEarned: number
  segmentStatusBreakdown: Record<string, number>
  dailyTrends: Array<{ date: string; count: number }>
  days: number
}

export default function ReportsPage() {
  const { accessToken } = useAuth()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetch(`/api/reports?days=${days}`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data)
        setLoading(false)
      })
  }, [accessToken, days])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  if (!data) return null

  const deliveryRate = data.totalSegments > 0 ? Math.round((data.deliveredSegments / data.totalSegments) * 100) : 0
  const assignmentRate = data.receivedSegments > 0 ? Math.round((data.assignedSegments / data.receivedSegments) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto space-y-6" data-testid="reports-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-title">Point Manager Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5" data-testid="page-description">Performance metrics for your location</p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))} data-testid="days-filter">
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" data-testid="summary-cards">
        <Card data-testid="total-segments-card">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Segments</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <p className="text-2xl font-bold" data-testid="total-segments">{data.totalSegments}</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="received-card">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Received</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <p className="text-2xl font-bold" data-testid="received-segments">{data.receivedSegments}</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="assigned-card">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Assigned</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-2xl font-bold" data-testid="assigned-segments">{data.assignedSegments}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{assignmentRate}% rate</p>
          </CardContent>
        </Card>

        <Card data-testid="delivered-card">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Delivered</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-2xl font-bold text-green-600" data-testid="delivered-segments">{data.deliveredSegments}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{deliveryRate}% rate</p>
          </CardContent>
        </Card>

        <Card data-testid="cod-collected-card">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">COD Collected</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              <p className="text-xl font-bold" data-testid="cod-collected">&#8377;{Number(data.codCollected).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="commissions-card">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Commissions</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-purple-600" />
              <p className="text-xl font-bold text-purple-600" data-testid="commissions-earned">&#8377;{Number(data.commissionsEarned).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Status Breakdown */}
        <Card data-testid="status-breakdown-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Segment Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="status-breakdown">
              {data.segmentStatusBreakdown && Object.entries(data.segmentStatusBreakdown).map(([status, count]) => {
                const percent = data.totalSegments > 0 ? (count / data.totalSegments) * 100 : 0
                const colors: Record<string, string> = {
                  PENDING: 'bg-yellow-500',
                  RECEIVED_AT_POINT: 'bg-teal-500',
                  ASSIGNED: 'bg-indigo-500',
                  PICKED_UP: 'bg-purple-500',
                  IN_TRANSIT: 'bg-orange-500',
                  OUT_FOR_DELIVERY: 'bg-cyan-500',
                  DELIVERED: 'bg-green-500',
                  CANCELLED: 'bg-red-500',
                }
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{status.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground">{count} ({Math.round(percent)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${colors[status] ?? 'bg-gray-500'}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
              {!data.segmentStatusBreakdown || Object.keys(data.segmentStatusBreakdown).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No segment data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily Trends */}
        <Card data-testid="daily-trends-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Segment Trends (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="daily-trends">
              {data.dailyTrends && data.dailyTrends.length > 0 ? data.dailyTrends.map((trend) => (
                <div key={trend.date} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{new Date(trend.date).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(100, (trend.count / Math.max(...data.dailyTrends.map(d => d.count))) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{trend.count}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No trend data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
