import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'
import { emailService } from '@/lib/email/service'

const updateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().optional(),
  satisfactionRating: z.number().min(1).max(5).optional(),
  satisfactionComment: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { id } = await params

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          displayId: true,
        },
      },
      booking: {
        select: {
          id: true,
          bookingNumber: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              displayId: true,
            },
          },
          attachments: true,
        },
      },
    },
  })

  if (!ticket) {
    return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 })
  }

  // Check if user has access to this ticket
  const user = await prisma.user.findUnique({
    where: { id: session!.userId },
    include: { userRoles: { include: { role: true } } },
  })

  const isAdminUser = user?.userRoles.some((ur: any) => ur.role.name === 'ADMIN' || ur.role.name === 'SUPER_ADMIN')

  if (!isAdminUser && ticket.userId !== session!.userId) {
    return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
  }

  return NextResponse.json({ success: true, data: ticket })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requirePermission(req, 'settings:manage')
  if (error) return error

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    })

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (parsed.data.status) {
      updateData.status = parsed.data.status
      if (parsed.data.status === 'RESOLVED') {
        updateData.resolvedBy = session!.userId
        updateData.resolvedAt = new Date()
      }
      if (parsed.data.status === 'CLOSED') {
        updateData.closedAt = new Date()
      }
    }

    if (parsed.data.priority) {
      updateData.priority = parsed.data.priority
    }

    if (parsed.data.assignedTo) {
      updateData.assignedTo = parsed.data.assignedTo
    }

    if (parsed.data.satisfactionRating !== undefined) {
      updateData.satisfactionRating = parsed.data.satisfactionRating
    }

    if (parsed.data.satisfactionComment !== undefined) {
      updateData.satisfactionComment = parsed.data.satisfactionComment
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            displayId: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingNumber: true,
          },
        },
      },
    })

    // Send email notification for status change
    if (parsed.data.status && updatedTicket.user.email) {
      await emailService.sendSupportTicketStatus({
        ticketNumber: updatedTicket.ticketNumber,
        ticketSubject: updatedTicket.subject,
        userName: updatedTicket.user.name,
        userEmail: updatedTicket.user.email,
        status: parsed.data.status,
        resolvedBy: parsed.data.status === 'RESOLVED' ? session!.userId : undefined,
      }).catch((err) => console.error('[EMAIL] Failed to send status update email:', err))
    }

    return NextResponse.json({ success: true, data: updatedTicket })
  } catch (err) {
    console.error('[SUPPORT_TICKETS/PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requirePermission(req, 'settings:manage')
  if (error) return error

  const { id } = await params

  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    })

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 })
    }

    await prisma.supportTicket.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[SUPPORT_TICKETS/DELETE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
