import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

const schema = z.object({
  availabilityStatus: z.enum(['AVAILABLE', 'BUSY', 'OFF_DUTY']),
})

export async function PUT(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
  }

  const profile = await prisma.captainProfile.findUnique({ where: { userId: session!.userId } })
  if (!profile) {
    return NextResponse.json({ success: false, error: 'Captain profile not found' }, { status: 404 })
  }

  // If captain is BUSY and trying to change to AVAILABLE, check for active bookings
  if (profile.availabilityStatus === 'BUSY' && parsed.data.availabilityStatus === 'AVAILABLE') {
    // Check for active booking segments
    const activeSegments = await prisma.bookingSegment.findMany({
      where: {
        assignedCaptainId: session!.userId,
        status: {
          in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
        },
      },
      select: {
        id: true,
        booking: {
          select: {
            id: true,
            bookingNumber: true,
          },
        },
      },
    })

    // Check for active direct bookings (bookings without segments)
    const activeDirectBookings = await prisma.booking.findMany({
      where: {
        assignedCaptainId: session!.userId,
        status: {
          in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
        },
      },
      select: {
        id: true,
        bookingNumber: true,
      },
    })

    const totalActive = activeSegments.length + activeDirectBookings.length

    if (totalActive > 0) {
      const bookingNumbers = [
        ...activeSegments.map(s => s.booking.bookingNumber),
        ...activeDirectBookings.map(b => b.bookingNumber),
      ].join(', ')

      return NextResponse.json(
        {
          success: false,
          error: `Cannot change availability while assigned to ${totalActive} active booking(s): ${bookingNumbers}`,
          bookings: {
            segments: activeSegments.map(s => ({ id: s.booking.id, bookingNumber: s.booking.bookingNumber })),
            direct: activeDirectBookings.map(b => ({ id: b.id, bookingNumber: b.bookingNumber })),
          },
        },
        { status: 409 },
      )
    }
  }

  const updated = await prisma.captainProfile.update({
    where: { userId: session!.userId },
    data: { availabilityStatus: parsed.data.availabilityStatus },
  })

  return NextResponse.json({ success: true, data: { availabilityStatus: updated.availabilityStatus } })
}
