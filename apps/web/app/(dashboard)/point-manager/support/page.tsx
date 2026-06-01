'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Plus, Loader2, Clock, Send, X, Paperclip, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

type SupportTicket = {
  id: string
  ticketNumber: string
  subject: string
  category: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  booking?: { id: string; bookingNumber: string }
  satisfactionRating?: number
  satisfactionComment?: string
  _count: { messages: number }
}

type SupportMessage = {
  id: string
  content: string
  isAdmin: boolean
  createdAt: string
  sender: { id: string; name: string; displayId: string }
  attachments: Array<{
    id: string
    fileName: string
    fileUrl: string
    fileSize: number
    mimeType: string
  }>
}

type TicketDetail = SupportTicket & {
  user: { id: string; name: string; email: string; phone: string; displayId: string }
  messages: SupportMessage[]
}

export default function PointManagerSupportPage() {
  const { accessToken } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [rating, setRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    category: 'BOOKING',
    priority: 'MEDIUM',
    issueType: '',
    message: '',
  })

  useEffect(() => {
    fetchTickets()
  }, [accessToken])

  async function fetchTickets() {
    setLoading(true)
    try {
      const res = await fetch('/api/support-tickets', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) setTickets(d.data)
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!formData.subject || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      })
      const d = await res.json()
      if (d.success) {
        setShowCreateModal(false)
        setFormData({ subject: '', category: 'BOOKING', priority: 'MEDIUM', issueType: '', message: '' })
        fetchTickets()
        toast.success('Support ticket created successfully!')
      } else {
        toast.error(d.error || 'Failed to create ticket')
      }
    } catch (error) {
      toast.error('Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  async function openTicket(ticketId: string) {
    try {
      const res = await fetch(`/api/support-tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) {
        setSelectedTicket(d.data)
      }
    } catch (error) {
      toast.error('Failed to load ticket details')
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() && !attachmentFile) return
    if (!selectedTicket) return

    setSendingMessage(true)
    try {
      const res = await fetch(`/api/support-tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ content: newMessage }),
      })
      const d = await res.json()
      if (d.success) {
        const messageId = d.data.id

        if (attachmentFile) {
          setUploadingAttachment(true)
          const formData = new FormData()
          formData.append('file', attachmentFile)
          formData.append('messageId', messageId)

          const uploadRes = await fetch('/api/support-attachments', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData,
          })

          if (!uploadRes.ok) {
            toast.error('Message sent but attachment failed')
          }
          setUploadingAttachment(false)
        }

        setNewMessage('')
        setAttachmentFile(null)
        await openTicket(selectedTicket.id)
        fetchTickets()
        toast.success('Message sent successfully')
      } else {
        toast.error(d.error || 'Failed to send message')
      }
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  async function submitRating() {
    if (!selectedTicket || rating === 0) return

    setSubmittingRating(true)
    try {
      const res = await fetch(`/api/support-tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          satisfactionRating: rating,
          satisfactionComment: ratingComment,
        }),
      })
      const d = await res.json()
      if (d.success) {
        await openTicket(selectedTicket.id)
        toast.success('Thank you for your feedback!')
        setRating(0)
        setRatingComment('')
      } else {
        toast.error(d.error || 'Failed to submit rating')
      }
    } catch (error) {
      toast.error('Failed to submit rating')
    } finally {
      setSubmittingRating(false)
    }
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800 border-gray-200',
    MEDIUM: 'bg-orange-100 text-orange-800 border-orange-200',
    HIGH: 'bg-red-100 text-red-800 border-red-200',
    URGENT: 'bg-red-200 text-red-900 border-red-300',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">Get help with your deliveries and account</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {selectedTicket ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedTicket.ticketNumber}
                  <Badge className={statusColors[selectedTicket.status]}>{selectedTicket.status}</Badge>
                  <Badge className={priorityColors[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{selectedTicket.subject}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[500px] overflow-y-auto mb-4">
              {selectedTicket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.isAdmin
                        ? 'bg-gray-100'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {msg.isAdmin ? 'Support Team' : 'You'}
                      </span>
                      <span className="text-xs opacity-70">
                        {new Date(msg.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 text-xs p-2 rounded ${
                              msg.isAdmin ? 'bg-white/50 hover:bg-white/70' : 'bg-white/20 hover:bg-white/30'
                            }`}
                          >
                            <Paperclip className="h-3 w-3" />
                            <span className="truncate flex-1">{att.fileName}</span>
                            <Download className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {selectedTicket.status !== 'CLOSED' && (
              <div className="space-y-2">
                {attachmentFile && (
                  <div className="flex items-center gap-2 p-2 bg-gray-100 rounded text-sm">
                    <Paperclip className="h-4 w-4" />
                    <span className="truncate flex-1">{attachmentFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAttachmentFile(null)}
                      disabled={sendingMessage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => document.getElementById('file-input')?.click()}
                    disabled={sendingMessage}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setAttachmentFile(file)
                    }}
                  />
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={sendingMessage}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={sendingMessage || (!newMessage.trim() && !attachmentFile)}>
                    {sendingMessage || uploadingAttachment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            {selectedTicket.status === 'RESOLVED' && !selectedTicket.satisfactionRating && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium mb-2 text-green-900">Rate your experience</h4>
                <p className="text-sm text-green-700 mb-3">How satisfied are you with the support you received?</p>
                <div className="flex gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl ${rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                      disabled={submittingRating}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Optional: Add a comment about your experience"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="mb-3"
                  disabled={submittingRating}
                />
                <Button
                  onClick={submitRating}
                  disabled={submittingRating || rating === 0}
                  size="sm"
                >
                  {submittingRating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit Rating
                </Button>
              </div>
            )}
            {selectedTicket.satisfactionRating && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Your rating:</span>
                  <span className="text-yellow-500">
                    {'★'.repeat(selectedTicket.satisfactionRating)}
                    {'☆'.repeat(5 - selectedTicket.satisfactionRating)}
                  </span>
                </div>
                {selectedTicket.satisfactionComment && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedTicket.satisfactionComment}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No support tickets yet</h3>
            <p className="text-muted-foreground mb-4">Create a ticket to get help with any issues</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => openTicket(ticket.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{ticket.ticketNumber}</h3>
                      <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
                      <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                    </div>
                    <h4 className="font-medium mb-1">{ticket.subject}</h4>
                    {ticket.booking && (
                      <p className="text-xs text-muted-foreground mb-1">Booking: {ticket.booking.bookingNumber}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{ticket._count.messages} messages</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Created: {new Date(ticket.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <span>{ticket.category}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAYMENT">Payment Issue</SelectItem>
                    <SelectItem value="BOOKING">Booking Issue</SelectItem>
                    <SelectItem value="ONBOARDING">Onboarding Issue</SelectItem>
                    <SelectItem value="GENERAL">General Inquiry</SelectItem>
                    <SelectItem value="TECHNICAL">Technical Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.category === 'BOOKING' && (
                <div className="space-y-1.5">
                  <Label>Issue Type (Optional)</Label>
                  <Select value={formData.issueType} onValueChange={(v) => setFormData({ ...formData, issueType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="DELIVERY_PROOF">Delivery Proof Issue</SelectItem>
                      <SelectItem value="OTP_ISSUE">OTP Verification Issue</SelectItem>
                      <SelectItem value="PAYMENT_FAILED">Payment Failed</SelectItem>
                      <SelectItem value="DELAY">Delivery Delay</SelectItem>
                      <SelectItem value="WRONG_DELIVERY">Wrong Delivery</SelectItem>
                      <SelectItem value="DAMAGED_PARCEL">Damaged Parcel</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {formData.category === 'PAYMENT' && (
                <div className="space-y-1.5">
                  <Label>Issue Type (Optional)</Label>
                  <Select value={formData.issueType} onValueChange={(v) => setFormData({ ...formData, issueType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="COMMISSION_DISPUTE">Commission Dispute</SelectItem>
                      <SelectItem value="COD_REMITTANCE">COD Remittance Issue</SelectItem>
                      <SelectItem value="PAYOUT_DELAY">Payout Delay</SelectItem>
                      <SelectItem value="PAYMENT_FAILED">Payment Failed</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Message *</Label>
                <textarea
                  value={formData.message}
                  onChange={(e: any) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Provide detailed information about your issue"
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowCreateModal(false)} variant="outline" className="flex-1">Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
