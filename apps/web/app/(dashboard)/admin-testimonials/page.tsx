'use client'

import { useEffect, useState } from 'react'
import { Loader2, MessageSquare, CheckCircle2, XCircle, Eye, Edit, Trash2, Plus, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

type Testimonial = {
  id: string
  customerName: string
  customerLocation: string | null
  rating: number
  content: string
  isApproved: boolean
  isActive: boolean
  createdAt: string
}

export default function TestimonialsPage() {
  const { accessToken } = useAuth()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    customerLocation: '',
    rating: 5,
    content: '',
    isApproved: false,
    isActive: true,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page), admin: 'true' })
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'APPROVED') params.set('isApproved', 'true')
      if (statusFilter === 'PENDING') params.set('isApproved', 'false')
    }

    fetch(`/api/testimonials?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) { setTestimonials(d.data.items); setTotal(d.data.total) } })
      .finally(() => setLoading(false))
  }, [statusFilter, page, accessToken])

  function openCreateDialog() {
    setIsCreating(true)
    setFormData({
      customerName: '',
      customerLocation: '',
      rating: 5,
      content: '',
      isApproved: false,
      isActive: true,
    })
  }

  function openEditDialog(testimonial: Testimonial) {
    setEditingTestimonial(testimonial)
    setFormData({
      customerName: testimonial.customerName,
      customerLocation: testimonial.customerLocation || '',
      rating: testimonial.rating,
      content: testimonial.content,
      isApproved: testimonial.isApproved,
      isActive: testimonial.isActive,
    })
  }

  async function saveTestimonial() {
    setSaving(true)
    try {
      const url = isCreating ? '/api/testimonials' : `/api/testimonials/${editingTestimonial?.id}`
      const method = isCreating ? 'POST' : 'PUT'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(isCreating ? 'Testimonial created successfully' : 'Testimonial updated successfully')
        setIsCreating(false)
        setEditingTestimonial(null)
        // Refresh list
        const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page), admin: 'true' })
        const listRes = await fetch(`/api/testimonials?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const listData = await listRes.json()
        if (listData.success) {
          setTestimonials(listData.data.items)
          setTotal(listData.data.total)
        }
      } else {
        toast.error(data.error || 'Failed to save testimonial')
      }
    } catch (err) {
      toast.error('Failed to save testimonial')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTestimonial(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/testimonials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Testimonial deleted successfully')
        setSelectedTestimonial(null)
        // Refresh list
        const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page), admin: 'true' })
        const listRes = await fetch(`/api/testimonials?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const listData = await listRes.json()
        if (listData.success) {
          setTestimonials(listData.data.items)
          setTotal(listData.data.total)
        }
      } else {
        toast.error(data.error || 'Failed to delete testimonial')
      }
    } catch (err) {
      toast.error('Failed to delete testimonial')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total testimonial{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {loading ? (
          <CardContent className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : testimonials.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No testimonials found</p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials.map((testimonial) => (
                <TableRow key={testimonial.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{testimonial.customerName}</p>
                      {testimonial.customerLocation && (
                        <p className="text-xs text-muted-foreground">{testimonial.customerLocation}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{testimonial.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm line-clamp-2 max-w-xs">{testimonial.content}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {testimonial.isApproved ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {!testimonial.isActive && <Badge variant="outline">Inactive</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(testimonial.createdAt).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTestimonial(testimonial)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(testimonial)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTestimonial(testimonial)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} testimonials
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

      {/* View Dialog */}
      <Dialog open={!!selectedTestimonial} onOpenChange={(open) => !open && setSelectedTestimonial(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Testimonial Details</DialogTitle>
          </DialogHeader>
          {selectedTestimonial && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedTestimonial.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-sm">{selectedTestimonial.customerLocation || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{selectedTestimonial.rating}/5</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex gap-2 mt-1">
                    {selectedTestimonial.isApproved ? (
                      <Badge className="bg-green-600">Approved</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                    {!selectedTestimonial.isActive && <Badge variant="outline">Inactive</Badge>}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Content</p>
                <p className="text-sm mt-1">{selectedTestimonial.content}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-sm">{new Date(selectedTestimonial.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <DialogFooter>
                <Button variant="destructive" onClick={() => deleteTestimonial(selectedTestimonial.id)} disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || !!editingTestimonial} onOpenChange={(open) => { if (!open) { setIsCreating(false); setEditingTestimonial(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Add Testimonial' : 'Edit Testimonial'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customerLocation">Location</Label>
              <Input
                id="customerLocation"
                value={formData.customerLocation}
                onChange={(e) => setFormData({ ...formData, customerLocation: e.target.value })}
                placeholder="Village, District"
              />
            </div>
            <div>
              <Label htmlFor="rating">Rating *</Label>
              <Select value={String(formData.rating)} onValueChange={(v) => setFormData({ ...formData, rating: Number(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <SelectItem key={r} value={String(r)}>{r} Star{r !== 1 ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="content">Content *</Label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isApproved"
                  checked={formData.isApproved}
                  onChange={(e) => setFormData({ ...formData, isApproved: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isApproved">Approved</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreating(false); setEditingTestimonial(null); }}>
              Cancel
            </Button>
            <Button onClick={saveTestimonial} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isCreating ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
