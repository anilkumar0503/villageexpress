import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'
import { emailService } from '@/lib/email/service'

const createSchema = z.object({
  subject: z.string().min(1).max(200),
  category: z.enum(['PAYMENT', 'BOOKING', 'ONBOARDING', 'GENERAL', 'TECHNICAL']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  bookingId: z.string().optional(),
  refundId: z.string().optional(),
  captainProfileId: z.string().optional(),
  payoutId: z.string().optional(),
  codRemittanceId: z.string().optional(),
  issueType: z.string().optional(),
  message: z.string().min(1),
})

const updateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
})

// Generate ticket number: VE-SUP-YYYYMMDD-XXXX
function generateTicketNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `VE-SUP-${date}-${random}`
}

// Calculate SLA due date based on priority
function calculateSLADueDate(priority: string): Date {
  const now = new Date()
  const hours = {
    LOW: 48,
    MEDIUM: 24,
    HIGH: 8,
    URGENT: 2,
  }[priority] || 24
  return new Date(now.getTime() + hours * 60 * 60 * 1000)
}

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const priority = searchParams.get('priority')
  const isAdmin = searchParams.get('admin') === 'true'

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session!.userId },
    include: { userRoles: { include: { role: true } } },
  })

  const isAdminUser = user?.userRoles.some((ur) => ur.role.name === 'ADMIN' || ur.role.name === 'SUPER_ADMIN')

  const where: any = {}
  
  // Non-admin users can only see their own tickets
  if (!isAdminUser) {
    where.userId = session!.userId
  }

  if (status) where.status = status
  if (category) where.category = category
  if (priority) where.priority = priority

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
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
        take: 1,
      },
      _count: {
        select: { messages: true },
      },
    },
  })

  return NextResponse.json({ success: true, data: tickets })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    // If bookingId is provided, verify it belongs to the user
    if (parsed.data.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: parsed.data.bookingId },
      })

      if (!booking || booking.customerId !== session!.userId) {
        return NextResponse.json(
          { success: false, error: 'Invalid booking ID' },
          { status: 400 },
        )
      }
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        userId: session!.userId,
        subject: parsed.data.subject,
        category: parsed.data.category,
        priority: parsed.data.priority,
        bookingId: parsed.data.bookingId,
        refundId: parsed.data.refundId,
        captainProfileId: parsed.data.captainProfileId,
        payoutId: parsed.data.payoutId,
        codRemittanceId: parsed.data.codRemittanceId,
        issueType: parsed.data.issueType,
        slaDueDate: calculateSLADueDate(parsed.data.priority),
        messages: {
          create: {
            senderId: session!.userId,
            isAdmin: false,
            content: parsed.data.message,
          },
        },
      },
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
        captainProfile: {
          select: {
            id: true,
            aadhaarVerificationStatus: true,
            licenseVerificationStatus: true,
            onboardingStatus: true,
          },
        },
        messages: true,
      },
    })

    // Send email notification to user
    if (ticket.user.email) {
      await emailService.sendSupportTicketCreated({
        ticketNumber: ticket.ticketNumber,
        userName: ticket.user.name,
        userEmail: ticket.user.email,
        userPhone: ticket.user.phone,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        message: parsed.data.message,
        bookingNumber: ticket.booking?.bookingNumber,
      }).catch((err) => console.error('[EMAIL] Failed to send ticket created email:', err))
    }

    return NextResponse.json({ success: true, data: ticket }, { status: 201 })
  } catch (err) {
    console.error('[SUPPORT_TICKETS/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
