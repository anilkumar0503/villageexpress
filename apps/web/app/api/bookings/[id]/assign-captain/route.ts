import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'
import { sendCaptainAssignedEmail, sendCaptainAssignmentEmail } from '@/lib/email'

const schema = z.object({
  captainId: z.string().uuid(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'booking:assign_captain')
  if (error) return error

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Valid captainId (UUID) is required' },
        { status: 400 },
      )
    }

    const { captainId } = parsed.data

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    if (!['CONFIRMED', 'PENDING'].includes(booking.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot assign captain to a booking with status: ${booking.status}` },
        { status: 422 },
      )
    }

    const captain = await prisma.user.findUnique({
      where: { id: captainId },
      include: {
        captainProfile: {
          include: {
            pointAssignments: {
              where: { isActive: true },
              include: { location: true },
            },
          },
        },
        userRoles: { include: { role: true } },
      },
    })

    if (!captain || !captain.isActive || captain.approvalStatus !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Captain not found or not approved' },
        { status: 404 },
      )
    }

    const isCaptain = captain.userRoles.some((ur: any) => ur.role.name === 'CAPTAIN')
    if (!isCaptain) {
      return NextResponse.json(
        { success: false, error: 'Selected user is not a Captain' },
        { status: 400 },
      )
    }

    if (captain.captainProfile?.availabilityStatus === 'BUSY') {
      return NextResponse.json(
        { success: false, error: 'Captain is currently busy' },
        { status: 409 },
      )
    }

    // Check if captain has point coverage for booking locations
    const bookingWithLocations = await prisma.booking.findUnique({
      where: { id },
      select: {
        pickupLocationId: true,
        dropLocationId: true,
      },
    })

    if (bookingWithLocations && captain.captainProfile?.pointAssignments) {
      const assignedLocationIds = captain.captainProfile.pointAssignments.map((pa: any) => pa.locationId)
      const hasPickupCoverage = assignedLocationIds.includes(bookingWithLocations.pickupLocationId)
      const hasDropCoverage = assignedLocationIds.includes(bookingWithLocations.dropLocationId)

      if (!hasPickupCoverage || !hasDropCoverage) {
        return NextResponse.json(
          {
            success: false,
            error: 'Captain does not have coverage for this route. They must be assigned to both pickup and drop points.',
          },
          { status: 400 },
        )
      }
    }

    // Handle wallet payment if applicable
    let updated
    if (booking.paymentMethod === 'WALLET' as any && booking.paymentStatus === 'PENDING_PAYMENT' as any) {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: booking.customerId },
      })

      if (!wallet) {
        return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })
      }

      if (wallet.balance.toNumber() < Number(booking.calculatedPrice)) {
        return NextResponse.json({ success: false, error: 'Insufficient wallet balance' }, { status: 400 })
      }

      // Debit wallet and update booking
      const debitAmount = Number(booking.calculatedPrice)
      const balanceBefore = wallet.balance
      const balanceAfter = balanceBefore.minus(debitAmount)

      console.log('[WALLET_DEBIT]', {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        calculatedPrice: debitAmount,
        balanceBefore: balanceBefore.toString(),
        balanceAfter: balanceAfter.toString(),
      })

      const result = await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: balanceAfter },
        }),
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: booking.customerId,
            type: 'BOOKING_PAYMENT',
            amount: debitAmount,
            balanceBefore,
            balanceAfter,
            description: `Payment for booking ${booking.bookingNumber}`,
            referenceId: booking.id,
            referenceType: 'BOOKING',
          },
        }),
        prisma.booking.update({
          where: { id },
          data: {
            assignedCaptainId: captainId,
            status: 'ASSIGNED',
            paymentStatus: 'PAID',
            paidAmount: debitAmount,
            paidAt: new Date(),
          },
          select: { id: true, bookingNumber: true, status: true, assignedCaptainId: true },
        }),
        prisma.captainProfile.update({
          where: { userId: captainId },
          data: { availabilityStatus: 'BUSY' },
        }),
      ])

      console.log('[WALLET_DEBIT_SUCCESS]', {
        bookingId: booking.id,
        newBalance: balanceAfter.toString(),
      })

      updated = result[2]
    } else {
      // Normal captain assignment
      const result = await prisma.$transaction([
        prisma.booking.update({
          where: { id },
          data: { assignedCaptainId: captainId, status: 'ASSIGNED' },
          select: { id: true, bookingNumber: true, status: true, assignedCaptainId: true },
        }),
        prisma.captainProfile.update({
          where: { userId: captainId },
          data: { availabilityStatus: 'BUSY' },
        }),
      ])
      updated = result[0]
    }

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: `ASSIGN_CAPTAIN:${captainId}`,
        resource: `booking:${id}`,
        result: 'GRANTED',
      },
    })

    const bookingWithEmails = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true, email: true } },
        pickupLocation: { select: { pointName: true } },
        captain: { select: { name: true, email: true } },
      },
    })

    if (bookingWithEmails?.customer.email) {
      sendCaptainAssignedEmail(bookingWithEmails.customer.email, bookingWithEmails.customer.name, bookingWithEmails.bookingNumber, bookingWithEmails.captain?.name ?? 'Captain').catch(() => {})
    }
    if (bookingWithEmails?.captain?.email) {
      sendCaptainAssignmentEmail(bookingWithEmails.captain.email, bookingWithEmails.captain.name, bookingWithEmails.bookingNumber, bookingWithEmails.pickupLocation.pointName).catch(() => {})
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('[BOOKINGS/ASSIGN-CAPTAIN]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
