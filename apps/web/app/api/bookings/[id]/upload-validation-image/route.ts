import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

const schema = z.object({
  imageUrl: z.string().url(),
  imageType: z.enum(['PICKUP', 'DROP']),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { id } = await params

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      pickupLocationId: true,
      dropLocationId: true,
      status: true,
      assignedCaptainId: true,
    },
  })

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
  }

  // Check if user is a point manager
  const pmProfile = await prisma.pointManagerProfile.findUnique({
    where: { userId: session!.userId },
    select: { shopLocationId: true },
  })

  // Check if user is a captain
  const captainProfile = await prisma.captainProfile.findUnique({
    where: { userId: session!.userId },
    select: { id: true },
  })

  if (pmProfile) {
    // Point manager authorization
    if (parsed.data.imageType === 'PICKUP' && pmProfile.shopLocationId !== booking.pickupLocationId) {
      return NextResponse.json({ success: false, error: 'You are not authorized to upload pickup validation image for this booking' }, { status: 403 })
    }

    if (parsed.data.imageType === 'DROP' && pmProfile.shopLocationId !== booking.dropLocationId) {
      return NextResponse.json({ success: false, error: 'You are not authorized to upload drop validation image for this booking' }, { status: 403 })
    }
  } else if (captainProfile) {
    // Captain authorization - only allowed for PICKUP images
    if (parsed.data.imageType !== 'PICKUP') {
      return NextResponse.json({ success: false, error: 'Captains can only upload pickup validation images' }, { status: 403 })
    }

    // Verify captain is assigned to this booking (either directly or via segment)
    const isAssignedToBooking = booking.assignedCaptainId === session!.userId

    // Check if captain is assigned to any segment of this booking
    const segmentAssignment = await prisma.bookingSegment.findFirst({
      where: {
        bookingId: id,
        assignedCaptainId: session!.userId,
      },
    })

    if (!isAssignedToBooking && !segmentAssignment) {
      return NextResponse.json({ success: false, error: 'You are not assigned to this booking' }, { status: 403 })
    }
  } else {
    return NextResponse.json({ success: false, error: 'Only point managers and captains can upload validation images' }, { status: 403 })
  }

  // Update booking with validation image
  const updateData: any = {}
  if (parsed.data.imageType === 'PICKUP') {
    updateData.pickupValidationImage = parsed.data.imageUrl
  } else {
    updateData.dropValidationImage = parsed.data.imageUrl
  }

  await prisma.booking.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({ success: true, message: 'Validation image uploaded successfully' })
}
