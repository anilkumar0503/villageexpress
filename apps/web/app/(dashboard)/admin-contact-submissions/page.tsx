'use client'

import { useEffect, useState } from 'react'
import { Loader2, Mail, CheckCircle2, Clock, AlertCircle, Eye, Trash2, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

type ContactSubmission = {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  createdAt: string
  updatedAt: string
}

export default function ContactSubmissionsPage() {
  const { accessToken } = useAuth()
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) })
    if (statusFilter !== 'ALL') {
      params.set('status', statusFilter)
    }

    fetch(`/api/contact-submissions?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r: Response) => r.json())
      .then((d) => { if (d.success) { setSubmissions(d.data.items); setTotal(d.data.total) } })
      .finally(() => setLoading(false))
  }, [statusFilter, page, accessToken])

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/contact-submissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Status updated successfully')
        // Refresh list
        const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) })
        if (statusFilter !== 'ALL') params.set('status', statusFilter)
        const listRes = await fetch(`/api/contact-submissions?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const listData = await listRes.json()
        if (listData.success) {
          setSubmissions(listData.data.items)
          setTotal(listData.data.total)
        }
      } else {
        toast.error(data.error || 'Failed to update status')
      }
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  async function deleteSubmission(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/contact-submissions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('Submission deleted successfully')
        setSelectedSubmission(null)
        // Refresh list
        const params = new URLSearchParams({ pageSize: String(pageSize), page: String(page) })
        if (statusFilter !== 'ALL') params.set('status', statusFilter)
        const listRes = await fetch(`/api/contact-submissions?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        const listData = await listRes.json()
        if (listData.success) {
          setSubmissions(listData.data.items)
          setTotal(listData.data.total)
        }
      } else {
        toast.error(data.error || 'Failed to delete submission')
      }
    } catch (err) {
      toast.error('Failed to delete submission')
    } finally {
      setDeleting(false)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-600"><AlertCircle className="h-3 w-3 mr-1" />In Progress</Badge>
      case 'RESOLVED':
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</Badge>
      case 'CLOSED':
        return <Badge variant="outline">Closed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contact Submissions</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total submission{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {loading ? (
          <CardContent className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        ) : submissions.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No submissions found</p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{submission.name}</p>
                      {submission.phone && (
                        <p className="text-xs text-muted-foreground">{submission.phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{submission.email}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm line-clamp-1 max-w-xs">{submission.subject}</p>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(submission.status)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(submission.createdAt).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(submission)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(submission)}>
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
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} submissions
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
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedSubmission.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedSubmission.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="text-sm">{selectedSubmission.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="font-medium mt-1">{selectedSubmission.subject}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Message</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedSubmission.message}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-sm">{new Date(selectedSubmission.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Update Status</p>
                <Select
                  value={selectedSubmission.status}
                  onValueChange={(value) => updateStatus(selectedSubmission.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="destructive" onClick={() => deleteSubmission(selectedSubmission.id)} disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
