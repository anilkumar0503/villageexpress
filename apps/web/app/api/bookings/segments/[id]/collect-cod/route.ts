import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requirePermission(req, 'booking:update')
  if (error) return error

  const { id: segmentId } = await params

  try {
    // Check if this is a direct booking (starts with "direct-")
    if (segmentId.startsWith('direct-')) {
      const bookingId = segmentId.replace('direct-', '')
      
      // Get the booking details
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          calculatedPrice: true,
          pickupLocationId: true,
          dropLocationId: true,
          codCollectedAt: true as any,
        },
      })

      if (!booking) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
      }

      // Verify booking is not cancelled
      if (booking.status === 'CANCELLED') {
        return NextResponse.json({ success: false, error: 'Cannot collect COD for cancelled bookings' }, { status: 400 })
      }

      // Verify it's a COD booking
      if (booking.paymentMethod !== 'COD') {
        return NextResponse.json({ success: false, error: 'This is not a COD booking' }, { status: 400 })
      }

      // Verify COD hasn't been collected yet
      if (booking.codCollectedAt) {
        return NextResponse.json({ success: false, error: 'COD already collected for this booking' }, { status: 400 })
      }

      // Get Point Manager's shop location
      const pmProfile = await prisma.pointManagerProfile.findUnique({
        where: { userId: session!.userId },
        select: { shopLocationId: true },
      })

      if (!pmProfile) {
        return NextResponse.json({ success: false, error: 'Point Manager profile not found' }, { status: 404 })
      }

      // Verify PM is at either pickup or drop location of this booking
      const isAtPickup = booking.pickupLocationId === pmProfile.shopLocationId
      const isAtDrop = booking.dropLocationId === pmProfile.shopLocationId

      if (!isAtPickup && !isAtDrop) {
        return NextResponse.json({ success: false, error: 'You can only collect COD at pickup or drop location' }, { status: 403 })
      }

      // Determine which location to record
      const collectionLocationId = isAtPickup ? booking.pickupLocationId : booking.dropLocationId

      // Update booking with COD collection details and create CodCollection record
      const updatedBooking = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: 'PAID',
            codCollectedBy: session!.userId,
            codCollectedAt: new Date(),
            codCollectedAtLocation: collectionLocationId,
          } as any,
        })

        // Create CodCollection record for admin tracking
        await tx.codCollection.create({
          data: {
            userId: session!.userId,
            bookingId: booking.id,
            amount: booking.calculatedPrice,
            collectionMethod: 'MANUAL',
            status: 'COLLECTED',
          },
        })

        return booking
      })

      console.log('COD collected for direct booking:', updatedBooking.codCollectedAt)

      return NextResponse.json({ success: true, message: 'COD collected successfully' })
    }

    // Handle regular segment COD collection
    const segment = await prisma.bookingSegment.findUnique({
      where: { id: segmentId },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            paymentMethod: true,
            paymentStatus: true,
            calculatedPrice: true,
            pickupLocationId: true,
            dropLocationId: true,
          },
        },
        routeSegment: {
          select: {
            fromLocationId: true,
            toLocationId: true,
          },
        },
      },
    })

    if (!segment) {
      return NextResponse.json({ success: false, error: 'Segment not found' }, { status: 404 })
    }

    // Verify booking is not cancelled
    if (segment.booking.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Cannot collect COD for cancelled bookings' }, { status: 400 })
    }

    // Verify it's a COD booking
    if (segment.booking.paymentMethod !== 'COD') {
      return NextResponse.json({ success: false, error: 'This is not a COD booking' }, { status: 400 })
    }

    // Verify COD hasn't been collected yet
    if (segment.codCollectedAt) {
      return NextResponse.json({ success: false, error: 'COD already collected for this segment' }, { status: 400 })
    }

    // Get Point Manager's shop location
    const pmProfile = await prisma.pointManagerProfile.findUnique({
      where: { userId: session!.userId },
      select: { shopLocationId: true },
    })

    if (!pmProfile) {
      return NextResponse.json({ success: false, error: 'Point Manager profile not found' }, { status: 404 })
    }

    // Verify PM is at either pickup or drop location of this segment
    const isAtPickup = segment.routeSegment.fromLocationId === pmProfile.shopLocationId
    const isAtDrop = segment.routeSegment.toLocationId === pmProfile.shopLocationId

    if (!isAtPickup && !isAtDrop) {
      return NextResponse.json({ success: false, error: 'You can only collect COD at pickup or drop location' }, { status: 403 })
    }

    // Determine which location to record
    const collectionLocationId = isAtPickup ? segment.routeSegment.fromLocationId : segment.routeSegment.toLocationId

    // Update segment with COD collection details and create CodCollection record
    const updatedSegment = await prisma.$transaction(async (tx) => {
      const segment = await tx.bookingSegment.update({
        where: { id: segmentId },
        data: {
          codCollectedBy: session!.userId,
          codCollectedAt: new Date(),
          codCollectedAtLocation: collectionLocationId,
        } as any,
      })

      // Fetch booking to get calculated price
      const booking = await tx.booking.findUnique({
        where: { id: segment.bookingId },
        select: { calculatedPrice: true },
      })

      // Create CodCollection record for admin tracking
      await tx.codCollection.create({
        data: {
          userId: session!.userId,
          bookingId: segment.bookingId,
          amount: booking?.calculatedPrice || 0,
          collectionMethod: 'MANUAL',
          status: 'COLLECTED',
        },
      })

      return segment
    })

    console.log('COD collected for segment:', updatedSegment.codCollectedAt)

    // Check if this is the last segment for the booking
    const totalSegments = await prisma.bookingSegment.count({
      where: { bookingId: segment.bookingId },
    })

    const collectedSegments = await prisma.bookingSegment.count({
      where: {
        bookingId: segment.bookingId,
        codCollectedAt: { not: null },
      },
    })

    // If all segments have collected COD, update booking payment status
    if (collectedSegments === totalSegments) {
      const updatedBooking = await prisma.booking.update({
        where: { id: segment.bookingId },
        data: {
          paymentStatus: 'PAID',
          codCollectedBy: session!.userId,
          codCollectedAt: new Date(),
          codCollectedAtLocation: collectionLocationId,
        } as any,
      })
      console.log('COD collected for booking (all segments):', updatedBooking.codCollectedAt)
    }

    return NextResponse.json({ success: true, message: 'COD collected successfully' })
  } catch (err) {
    console.error('[BOOKINGS/SEGMENTS/COLLECT_COD]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
