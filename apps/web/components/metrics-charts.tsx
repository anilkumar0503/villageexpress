'use client'

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type TimeSeriesData = {
  date: string
  label: string
  deliveries: number
  codCollected: number
  commissionEarned: number
}

type MetricsChartsProps = {
  data: TimeSeriesData[]
  period: 'daily' | 'weekly' | 'monthly'
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly') => void
}

export function MetricsCharts({ data, period, onPeriodChange }: MetricsChartsProps) {
  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily (30 days)</SelectItem>
            <SelectItem value="weekly">Weekly (12 weeks)</SelectItem>
            <SelectItem value="monthly">Monthly (12 months)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deliveries Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Deliveries Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="deliveries" fill="#3b82f6" name="Deliveries" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* COD Collections Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">COD Collections Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${Number(value).toFixed(0)}`} />
              <Legend />
              <Line type="monotone" dataKey="codCollected" stroke="#8b5cf6" strokeWidth={2} name="COD Collected" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Commission Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Commission Earned Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => `₹${Number(value).toFixed(0)}`} />
              <Legend />
              <Line type="monotone" dataKey="commissionEarned" stroke="#10b981" strokeWidth={2} name="Commission Earned" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Combined Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Combined Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Deliveries') return value
                  return `₹${Number(value).toFixed(0)}`
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="deliveries" fill="#3b82f6" name="Deliveries" />
              <Line yAxisId="right" type="monotone" dataKey="codCollected" stroke="#8b5cf6" strokeWidth={2} name="COD Collected" />
              <Line yAxisId="right" type="monotone" dataKey="commissionEarned" stroke="#10b981" strokeWidth={2} name="Commission" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
