'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

type Coupon = {
  id: string
  code: string
  type: string
  discountType: string
  discountValue: number
  minOrderValue: number
  maxDiscountAmount: number | null
  usageLimit: number | null
  usageCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
}

export default function CouponsPage() {
  const { accessToken, user } = useAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'FLAT',
    discountValue: '',
    minOrderValue: '0',
    maxDiscountAmount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
  })

  useEffect(() => {
    if (user?.roles.includes('SUPER_ADMIN') || user?.roles.includes('ADMIN')) {
      fetchCoupons()
    }
  }, [user, accessToken])

  async function fetchCoupons() {
    setLoading(true)
    try {
      const res = await fetch('/api/coupons', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      if (data.success) setCoupons(data.data)
    } catch (err) {
      console.error('Failed to fetch coupons:', err)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          discountValue: Number(formData.discountValue),
          minOrderValue: Number(formData.minOrderValue),
          maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowForm(false)
        setFormData({
          code: '',
          discountType: 'FLAT',
          discountValue: '',
          minOrderValue: '0',
          maxDiscountAmount: '',
          usageLimit: '',
          validFrom: '',
          validUntil: '',
        })
        fetchCoupons()
      } else {
        alert(data.error || 'Failed to create coupon')
      }
    } catch (err) {
      alert('Failed to create coupon')
    }
    setSubmitting(false)
  }

  async function toggleCoupon(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) fetchCoupons()
    } catch (err) {
      console.error('Failed to toggle coupon:', err)
    }
  }

  if (!user?.roles.includes('SUPER_ADMIN') && !user?.roles.includes('ADMIN')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="text-sm text-muted-foreground">Manage discount coupons for customers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          {showForm ? 'Cancel' : 'New Coupon'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Coupon</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Coupon Code</Label>
                  <Input
                    placeholder="e.g., SAVE20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Discount Type</Label>
                  <Select value={formData.discountType} onValueChange={(v) => setFormData({ ...formData, discountType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLAT">Flat Amount</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    placeholder={formData.discountType === 'FLAT' ? '₹' : '%'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Min Order Value (₹)</Label>
                  <Input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Discount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Usage Limit</Label>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Valid From</Label>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Coupon
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : coupons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">No coupons created yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">{coupon.code}</p>
                    <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {coupon.discountType === 'FLAT' ? 'Flat' : coupon.discountValue + '%'} discount of ₹{Number(coupon.discountValue).toFixed(2)}
                    {coupon.maxDiscountAmount && ` (max ₹${Number(coupon.maxDiscountAmount).toFixed(2)})`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Min order: ₹{Number(coupon.minOrderValue).toFixed(2)} · 
                    Used: {coupon.usageCount}/{coupon.usageLimit || '∞'} · 
                    Valid: {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validUntil).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  onClick={() => toggleCoupon(coupon.id, coupon.isActive)}
                  variant="outline"
                  size="sm"
                >
                  {coupon.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
