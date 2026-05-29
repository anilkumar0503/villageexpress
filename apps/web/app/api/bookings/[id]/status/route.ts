import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, type BookingStatus } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'
import { canTransition } from '@/lib/booking/state-machine'
import { sendNotificationToUser } from '@/lib/firebase-admin'
import { sendBookingPickedUpEmail, sendBookingDeliveredEmail, sendBookingCancelledEmail } from '@/lib/email'

const STATUS_MESSAGES: Partial<Record<string, string>> = {
  CONFIRMED: 'Your booking has been confirmed!',
  ASSIGNED: 'A captain has been assigned to your booking.',
  PICKED_UP: 'Your parcel has been picked up.',
  IN_TRANSIT: 'Your parcel is in transit.',
  OUT_FOR_DELIVERY: 'Your parcel is out for delivery!',
  DELIVERED: 'Your parcel has been delivered.',
  CANCELLED: 'Your booking has been cancelled.',
}

const schema = z.object({
  status: z.enum([
    'PENDING', 'PAYMENT_FAILED', 'CONFIRMED', 'ASSIGNED',
    'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY',
    'DELIVERED', 'CANCELLED', 'RETURN_INITIATED', 'RETURNED',
  ]),
  note: z.string().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'booking:update_status')
  if (error) return error

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid status', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { status: newStatus } = parsed.data

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    if (!canTransition(booking.status as BookingStatus, newStatus as BookingStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot transition from ${booking.status} to ${newStatus}`,
        },
        { status: 422 },
      )
    }

    const updateData: Record<string, unknown> = { status: newStatus }

    if (newStatus === 'CONFIRMED') {
      updateData.paymentStatus = 'PAID'
      updateData.paidAt = new Date()
    }
    if (newStatus === 'PAYMENT_FAILED') {
      updateData.paymentStatus = 'FAILED'
    }
    if (newStatus === 'CANCELLED') {
      if (booking.paymentStatus === 'PAID') {
        updateData.paymentStatus = 'REFUNDED'
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      select: { id: true, bookingNumber: true, status: true, paymentStatus: true, assignedCaptainId: true },
    })

    if (['DELIVERED', 'CANCELLED'].includes(newStatus) && booking.assignedCaptainId) {
      await prisma.captainProfile.updateMany({
        where: { userId: booking.assignedCaptainId },
        data: { availabilityStatus: 'AVAILABLE' },
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: `STATUS_CHANGE:${booking.status}→${newStatus}`,
        resource: `booking:${id}`,
        result: 'GRANTED',
      },
    })

    const message = STATUS_MESSAGES[newStatus]
    if (message && booking.customerId) {
      sendNotificationToUser(booking.customerId, {
        title: 'Village Express',
        body: `${updated.bookingNumber}: ${message}`,
        data: { url: `/bookings/${id}`, bookingId: id },
      }).catch(() => {})
    }

    const bookingWithEmails = await prisma.booking.findUnique({
      where: { id },
      include: { customer: { select: { name: true, email: true } } },
    })

    if (newStatus === 'PICKED_UP' && bookingWithEmails?.customer.email) {
      sendBookingPickedUpEmail(bookingWithEmails.customer.email, bookingWithEmails.customer.name, updated.bookingNumber).catch(() => {})
    }
    if (newStatus === 'DELIVERED' && bookingWithEmails?.customer.email) {
      sendBookingDeliveredEmail(bookingWithEmails.customer.email, bookingWithEmails.customer.name, updated.bookingNumber).catch(() => {})
    }
    if (newStatus === 'CANCELLED' && bookingWithEmails?.customer.email) {
      sendBookingCancelledEmail(bookingWithEmails.customer.email, bookingWithEmails.customer.name, updated.bookingNumber, updated.paymentStatus === 'REFUNDED').catch(() => {})
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('[BOOKINGS/STATUS]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
