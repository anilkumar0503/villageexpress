'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Loader2, Clock, Send, X, Filter, Paperclip, Download, BarChart3, TrendingUp, FileText } from 'lucide-react'
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
  user: { id: string; name: string; email: string; phone: string; displayId: string }
  assignedTo?: string
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
  messages: SupportMessage[]
}

export default function AdminSupportPage() {
  const { accessToken } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [updatingTicket, setUpdatingTicket] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
  })
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [supportAgents, setSupportAgents] = useState<any[]>([])
  const [cannedResponses, setCannedResponses] = useState<any[]>([])
  const [showCannedResponses, setShowCannedResponses] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [accessToken, filters])

  async function fetchAnalytics() {
    setLoadingAnalytics(true)
    try {
      const res = await fetch('/api/support-analytics', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) setAnalytics(d.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  useEffect(() => {
    if (showAnalytics) fetchAnalytics()
  }, [showAnalytics, accessToken])

  async function fetchSupportAgents() {
    try {
      const res = await fetch('/api/users?role=ADMIN', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) setSupportAgents(d.data)
    } catch (error) {
      console.error('Failed to fetch support agents:', error)
    }
  }

  useEffect(() => {
    fetchSupportAgents()
  }, [accessToken])

  async function fetchCannedResponses() {
    try {
      const res = await fetch('/api/canned-responses', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const d = await res.json()
      if (d.success) setCannedResponses(d.data)
    } catch (error) {
      console.error('Failed to fetch canned responses:', error)
    }
  }

  useEffect(() => {
    fetchCannedResponses()
  }, [accessToken])

  async function fetchTickets() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.category) params.append('category', filters.category)
      if (filters.priority) params.append('priority', filters.priority)
      params.append('admin', 'true')

      const res = await fetch(`/api/support-tickets?${params}`, {
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

  async function updateTicketStatus(status: string) {
    if (!selectedTicket) return

    setUpdatingTicket(true)
    try {
      const res = await fetch(`/api/support-tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      })
      const d = await res.json()
      if (d.success) {
        await openTicket(selectedTicket.id)
        fetchTickets()
        toast.success('Ticket status updated')
      } else {
        toast.error(d.error || 'Failed to update ticket')
      }
    } catch (error) {
      toast.error('Failed to update ticket')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function updateTicketPriority(priority: string) {
    if (!selectedTicket) return

    setUpdatingTicket(true)
    try {
      const res = await fetch(`/api/support-tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ priority }),
      })
      const d = await res.json()
      if (d.success) {
        await openTicket(selectedTicket.id)
        fetchTickets()
        toast.success('Ticket priority updated')
      } else {
        toast.error(d.error || 'Failed to update ticket')
      }
    } catch (error) {
      toast.error('Failed to update ticket')
    } finally {
      setUpdatingTicket(false)
    }
  }

  async function assignTicket(agentId: string) {
    if (!selectedTicket) return

    setUpdatingTicket(true)
    try {
      const res = await fetch(`/api/support-tickets/${selectedTicket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ assignedTo: agentId }),
      })
      const d = await res.json()
      if (d.success) {
        await openTicket(selectedTicket.id)
        fetchTickets()
        toast.success('Ticket assigned successfully')
      } else {
        toast.error(d.error || 'Failed to assign ticket')
      }
    } catch (error) {
      toast.error('Failed to assign ticket')
    } finally {
      setUpdatingTicket(false)
    }
  }

  function useCannedResponse(content: string) {
    setNewMessage(content)
    setShowCannedResponses(false)
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
          <h1 className="text-2xl font-bold tracking-tight">Support Dashboard</h1>
          <p className="text-muted-foreground">Manage all support tickets</p>
        </div>
        <Button
          variant={showAnalytics ? 'default' : 'outline'}
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="gap-2"
        >
          {showAnalytics ? <MessageSquare className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
          {showAnalytics ? 'View Tickets' : 'View Analytics'}
        </Button>
      </div>

      {showAnalytics && (
        <div className="space-y-4">
          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{analytics.totalTickets}</div>
                    <div className="text-sm text-muted-foreground">Total Tickets</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">{analytics.openTickets}</div>
                    <div className="text-sm text-muted-foreground">Open</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{analytics.inProgressTickets}</div>
                    <div className="text-sm text-muted-foreground">In Progress</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{analytics.resolvedTickets}</div>
                    <div className="text-sm text-muted-foreground">Resolved</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-gray-600">{analytics.closedTickets}</div>
                    <div className="text-sm text-muted-foreground">Closed</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      By Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.ticketsByCategory.map((item: any) => (
                        <div key={item.category} className="flex justify-between items-center">
                          <span className="text-sm">{item.category}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      By Priority
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.ticketsByPriority.map((item: any) => (
                        <div key={item.priority} className="flex justify-between items-center">
                          <span className="text-sm">{item.priority}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      By Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.ticketsByStatus.map((item: any) => (
                        <div key={item.status} className="flex justify-between items-center">
                          <span className="text-sm">{item.status}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {analytics.avgResponseHours && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Average Response Time</div>
                        <div className="text-xl font-bold">{analytics.avgResponseHours} hours</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No analytics data available</h3>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {selectedTicket ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="flex items-center gap-2">
                    {selectedTicket.ticketNumber}
                  </CardTitle>
                  <Badge className={statusColors[selectedTicket.status]}>{selectedTicket.status}</Badge>
                  <Badge className={priorityColors[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{selectedTicket.subject}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Category: {selectedTicket.category}</span>
                  <span>User: {selectedTicket.user.name} ({selectedTicket.user.displayId})</span>
                  <span>Phone: {selectedTicket.user.phone}</span>
                </div>
                {selectedTicket.booking && (
                  <p className="text-xs text-muted-foreground mt-1">Booking: {selectedTicket.booking.bookingNumber}</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={selectedTicket.status} onValueChange={updateTicketStatus} disabled={updatingTicket}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedTicket.priority} onValueChange={updateTicketPriority} disabled={updatingTicket}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedTicket.assignedTo || ''} onValueChange={assignTicket} disabled={updatingTicket}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {supportAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
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
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {msg.isAdmin ? 'You (Admin)' : `${msg.sender.name} (${msg.sender.displayId})`}
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
                            href={`/api/upload/download?fileKey=${encodeURIComponent(att.fileUrl)}&bucket=private`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 text-xs p-2 rounded ${
                              msg.isAdmin ? 'bg-white/20 hover:bg-white/30' : 'bg-white/50 hover:bg-white/70'
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
                    size="sm"
                    onClick={() => setShowCannedResponses(!showCannedResponses)}
                    disabled={sendingMessage}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Templates
                  </Button>
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
                    placeholder="Type your response..."
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
                {showCannedResponses && (
                  <Card className="p-3">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {cannedResponses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No templates available</p>
                      ) : (
                        cannedResponses.map((response) => (
                          <Button
                            key={response.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left h-auto py-2"
                            onClick={() => useCannedResponse(response.content)}
                          >
                            <div>
                              <div className="font-medium text-xs">{response.title}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {response.content}
                              </div>
                            </div>
                          </Button>
                        ))
                      )}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Filter className="h-4 w-4" />
                <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="PAYMENT">Payment</SelectItem>
                    <SelectItem value="BOOKING">Booking</SelectItem>
                    <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="TECHNICAL">Technical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v })}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Priorities</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setFilters({ status: '', category: '', priority: '' })}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No support tickets found</h3>
                <p className="text-muted-foreground">Try adjusting your filters</p>
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
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-1">
                          <span>{ticket.user.name} ({ticket.user.displayId})</span>
                          <span>{ticket.user.phone}</span>
                        </div>
                        {ticket.booking && (
                          <p className="text-xs text-muted-foreground">Booking: {ticket.booking.bookingNumber}</p>
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
        </>
      )}
    </div>
  )
}
