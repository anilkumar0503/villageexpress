import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'
import { sendReviewRequestEmail } from '@/lib/email'

const schema = z.object({
  otp: z.string().length(6),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { id } = await params

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid OTP format' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      deliveryOtp: true,
      deliveryOtpExpiresAt: true,
      dropLocationId: true,
      status: true,
      dropValidationImage: true,
      bookingNumber: true,
      customerId: true,
    },
  })

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
  }

  // Check if OTP is expired
  if (booking.deliveryOtpExpiresAt && new Date() > booking.deliveryOtpExpiresAt) {
    return NextResponse.json({ success: false, error: 'OTP has expired' }, { status: 400 })
  }

  // Check if OTP matches
  if (booking.deliveryOtp !== parsed.data.otp) {
    return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 })
  }

  // Check if drop validation image is uploaded
  if (!booking.dropValidationImage) {
    return NextResponse.json({ success: false, error: 'Drop validation image is required before OTP validation' }, { status: 400 })
  }

  // Verify that the user is the point manager for the drop location
  const pmProfile = await prisma.pointManagerProfile.findUnique({
    where: { userId: session!.userId },
    select: { shopLocationId: true },
  })

  if (!pmProfile || pmProfile.shopLocationId !== booking.dropLocationId) {
    return NextResponse.json({ success: false, error: 'You are not authorized to validate this booking' }, { status: 403 })
  }

  // Update booking status to DELIVERED
  await prisma.booking.update({
    where: { id },
    data: {
      status: 'DELIVERED',
    },
  })

  // Update the last segment's deliveredAt
  const lastSegment = await prisma.bookingSegment.findFirst({
    where: { bookingId: id },
    orderBy: { sequenceOrder: 'desc' },
  })

  if (lastSegment) {
    await prisma.bookingSegment.update({
      where: { id: lastSegment.id },
      data: {
        deliveredAt: new Date(),
      },
    })

    // Create commission for final destination PM when OTP is validated
    if (lastSegment.assignedPointManagerId) {
      //console.log('[COMMISSION] Creating final destination PM commission for segment:', lastSegment.id, 'PM:', lastSegment.assignedPointManagerId)

      // Look up commission rule for this route segment + vehicle type
      let commissionRule = await prisma.routeCommissionRule.findFirst({
        where: {
          routeSegmentId: lastSegment.routeSegmentId,
          OR: [
            { vehicleType: lastSegment.vehicleType ?? null },
            { vehicleType: null },
          ],
          isActive: true,
        },
        orderBy: { vehicleType: 'desc' },
      })

      // Fallback to global commission rules if no route-specific rule found
      if (!commissionRule) {
        const globalRule = await prisma.globalCommissionRule.findFirst({
          where: {
            OR: [
              { vehicleType: lastSegment.vehicleType ?? null },
              { vehicleType: null },
            ],
            isActive: true,
          },
          orderBy: { vehicleType: 'desc' },
        })

        if (!globalRule) {
          const anyGlobalRule = await prisma.globalCommissionRule.findFirst({
            where: { isActive: true },
            orderBy: { vehicleType: 'desc' },
          })
          commissionRule = anyGlobalRule as any
        } else {
          commissionRule = globalRule as any
        }
      }

      if (commissionRule) {
        const bookingPrice = Number((await prisma.booking.findUnique({
          where: { id },
          select: { calculatedPrice: true },
        }))?.calculatedPrice ?? 0)
        const pmAmount = (bookingPrice * Number(commissionRule.pmCommissionPct)) / 100
        //console.log('[COMMISSION] Final destination PM commission amount:', pmAmount, 'from booking price:', bookingPrice, 'rate:', commissionRule.pmCommissionPct)
        if (pmAmount > 0) {
          await prisma.commissionLedger.create({
            data: {
              userId: lastSegment.assignedPointManagerId,
              bookingSegmentId: lastSegment.id,
              role: 'POINT_MANAGER',
              amount: pmAmount,
            },
          })
          //console.log('[COMMISSION] Final destination PM commission created successfully')
        }
      }
    }
  }

  // Send review request email to customer
  const customer = await prisma.user.findUnique({
    where: { id: booking.customerId },
    select: { name: true, email: true },
  })
  if (customer?.email) {
    await sendReviewRequestEmail(customer.email, customer.name, booking.bookingNumber)
  }

  return NextResponse.json({ success: true, message: 'Delivery validated successfully' })
}
