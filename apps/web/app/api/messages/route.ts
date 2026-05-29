import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 })
    }

    const messages = await prisma.message.findMany({
      where: { bookingId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            displayId: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            displayId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Mark messages as read if the current user is the receiver
    await prisma.message.updateMany({
      where: {
        bookingId,
        receiverId: session.userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    console.error('[MESSAGES/GET]', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { bookingId, receiverId, content } = body

    if (!bookingId || !receiverId || !content) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the user has access to this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { customerId: true, assignedCaptainId: true },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    if (booking.customerId !== session.userId && booking.assignedCaptainId !== session.userId) {
      return NextResponse.json({ success: false, error: 'You do not have access to this booking' }, { status: 403 })
    }

    const message = await prisma.message.create({
      data: {
        bookingId,
        senderId: session.userId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            displayId: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            displayId: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: message })
  } catch (error) {
    console.error('[MESSAGES/POST]', error)
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 })
  }
}
