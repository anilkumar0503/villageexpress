import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'
import Razorpay from 'razorpay'

type RouteContext = { params: Promise<{ id: string }> }

const CANCELLABLE_STATUSES = ['PENDING', 'PAYMENT_FAILED', 'CONFIRMED', 'ASSIGNED']

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const { reason } = body

  if (!reason || !reason.trim()) {
    return NextResponse.json({ success: false, error: 'Cancellation reason is required' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true } },
      captain: { select: { id: true } },
      segments: {
        select: {
          id: true,
          status: true,
          sequenceOrder: true,
          assignedPointManagerId: true,
          routeSegmentId: true,
        },
      },
    },
  })

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
  }

  // Check if user is customer or point manager
  const isCustomer = booking.customerId === session!.userId
  const pmProfile = await prisma.pointManagerProfile.findUnique({
    where: { userId: session!.userId },
    select: { id: true, shopLocationId: true },
  })

  const isPointManager = !!pmProfile

  if (!isCustomer && !isPointManager) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  // For point managers, check if they have a pending segment at their location
  if (isPointManager) {
    // Check if booking has segments (multi-segment routing)
    if (booking.segments.length > 0) {
      // Get route segments at PM's location
      const routeSegmentIds = await prisma.routeSegment.findMany({
        where: {
          OR: [
            { fromLocationId: pmProfile!.shopLocationId },
            { toLocationId: pmProfile!.shopLocationId },
          ],
        },
        select: { id: true },
      })

      const segmentIds = routeSegmentIds.map((rs: any) => rs.id)

      // Check if booking has a pending segment at PM's location
      const hasPendingSegment = booking.segments.some(
        (seg) => segmentIds.includes(seg.routeSegmentId) && seg.status === 'PENDING'
      )

      if (!hasPendingSegment) {
        return NextResponse.json(
          { success: false, error: 'You can only cancel bookings with pending segments at your location' },
          { status: 403 },
        )
      }
    } else {
      // Direct booking (without segments) - check if PM's location is pickup or drop
      const bookingWithLocations = await prisma.booking.findUnique({
        where: { id },
        select: { pickupLocationId: true, dropLocationId: true },
      })

      const isAtPMLocation = bookingWithLocations?.pickupLocationId === pmProfile!.shopLocationId ||
                             bookingWithLocations?.dropLocationId === pmProfile!.shopLocationId

      if (!isAtPMLocation) {
        return NextResponse.json(
          { success: false, error: 'You can only cancel bookings at your location' },
          { status: 403 },
        )
      }
    }
  }

  if (!CANCELLABLE_STATUSES.includes(booking.status)) {
    return NextResponse.json(
      { success: false, error: `Cannot cancel a booking with status: ${booking.status}` },
      { status: 422 },
    )
  }

  // Process refund - add to wallet for both ONLINE and WALLET payments
  if (booking.paymentStatus === 'PAID' || booking.paymentStatus === 'PARTIALLY_PAID') {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: booking.customerId },
      })

      if (wallet) {
        const refundAmount = booking.paidAmount || booking.calculatedPrice
        const balanceBefore = wallet.balance
        const balanceAfter = balanceBefore.plus(refundAmount)

        console.log('[WALLET_REFUND]', {
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          paymentMethod: booking.paymentMethod,
          paymentStatus: booking.paymentStatus,
          paidAmount: refundAmount.toString(),
          balanceBefore: balanceBefore.toString(),
          balanceAfter: balanceAfter.toString(),
        })

        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: balanceAfter },
          }),
          prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              userId: booking.customerId,
              type: 'REFUND',
              amount: refundAmount,
              balanceBefore,
              balanceAfter,
              description: `Refund for cancelled booking ${booking.bookingNumber} (${booking.paymentMethod})`,
              referenceId: booking.id,
              referenceType: 'BOOKING',
            },
          }),
        ])

        console.log('[WALLET_REFUND_SUCCESS]', {
          bookingId: booking.id,
          newBalance: balanceAfter.toString(),
        })
      } else {
        console.log('[WALLET_REFUND_SKIP]', {
          bookingId: booking.id,
          reason: 'Wallet not found for customer',
        })
      }
    } catch (err) {
      console.error('[WALLET_REFUND_ERROR]', err)
      return NextResponse.json(
        { success: false, error: 'Failed to process refund to wallet. Please try again or contact support.' },
        { status: 500 },
      )
    }
  }

  await prisma.booking.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      paymentStatus: booking.paymentStatus === 'PAID' ? 'REFUNDED' : booking.paymentStatus,
      cancelReason: reason as any,
    },
  } as any)

  if (booking.captain) {
    await prisma.captainProfile.updateMany({
      where: { userId: booking.captain.id },
      data: { availabilityStatus: 'AVAILABLE' },
    })
  }

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: 'BOOKING_CANCELLED',
      resource: `booking:${id}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, message: 'Booking cancelled' })
}
