import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

type RouteContext = { params: Promise<{ bookingId: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { bookingId } = await params

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingNumber: true,
      paymentStatus: true,
      paymentMethod: true,
      calculatedPrice: true,
      paidAt: true,
      customerId: true,
    },
  })

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
  }

  if (booking.customerId !== session!.userId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    success: true,
    data: {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      amount: booking.calculatedPrice,
      paidAt: booking.paidAt,
    },
  })
}
