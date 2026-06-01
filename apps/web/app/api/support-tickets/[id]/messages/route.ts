import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'
import { emailService } from '@/lib/email/service'

const createSchema = z.object({
  content: z.string().min(1),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { id } = await params

  // Verify ticket exists and user has access
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
  })

  if (!ticket) {
    return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session!.userId },
    include: { userRoles: { include: { role: true } } },
  })

  const isAdminUser = user?.userRoles.some((ur: any) => ur.role.name === 'ADMIN' || ur.role.name === 'SUPER_ADMIN')

  if (!isAdminUser && ticket.userId !== session!.userId) {
    return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
  }

  const messages = await prisma.supportMessage.findMany({
    where: { ticketId: id },
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
  })

  return NextResponse.json({ success: true, data: messages })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    // Verify ticket exists and user has access
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    })

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session!.userId },
      include: { userRoles: { include: { role: true } } },
    })

    const isAdminUser = user?.userRoles.some((ur: any) => ur.role.name === 'ADMIN' || ur.role.name === 'SUPER_ADMIN')

    if (!isAdminUser && ticket.userId !== session!.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // If ticket is closed, don't allow new messages
    if (ticket.status === 'CLOSED') {
      return NextResponse.json({ success: false, error: 'Cannot add messages to closed ticket' }, { status: 400 })
    }

    // If ticket is resolved and user is not admin, reopen it
    if (ticket.status === 'RESOLVED' && !isAdminUser) {
      await prisma.supportTicket.update({
        where: { id },
        data: { status: 'OPEN' },
      })
    }

    const message = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        senderId: session!.userId,
        isAdmin: isAdminUser,
        content: parsed.data.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            displayId: true,
          },
        },
      },
    })

    // Track first response time for admin messages
    if (isAdminUser) {
      await prisma.supportTicket.update({
        where: { id },
        data: {
          firstResponseAt: new Date(),
        },
      })
    }

    // Send email notification to the other party
    const ticketWithUser = await prisma.supportTicket.findUnique({
      where: { id },
      include: { user: true },
    })

    if (ticketWithUser) {
      // If admin sent message, notify user
      if (isAdminUser && ticketWithUser.user.email) {
        await emailService.sendSupportMessage({
          ticketNumber: ticketWithUser.ticketNumber,
          ticketSubject: ticketWithUser.subject,
          recipientName: ticketWithUser.user.name,
          recipientEmail: ticketWithUser.user.email,
          senderName: 'Support Team',
          message: parsed.data.content,
          isAdmin: true,
        }).catch((err) => console.error('[EMAIL] Failed to send message email:', err))
      }
      // If user sent message, notify admin (placeholder - would need admin email list)
      else if (!isAdminUser) {
        // TODO: Implement admin notification system
        console.log('[EMAIL] User sent message - notify admin team')
      }
    }

    return NextResponse.json({ success: true, data: message }, { status: 201 })
  } catch (err) {
    console.error('[SUPPORT_MESSAGES/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
