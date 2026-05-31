import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'
import { sendRefundProcessedEmail } from '@/lib/email'

type RouteContext = { params: Promise<{ bookingId: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'booking:cancel')
  if (error) return error

  const { bookingId } = await params

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, paymentStatus: true, paymentGatewayRef: true, calculatedPrice: true, bookingNumber: true, customerId: true },
  })

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
  }
  if (booking.paymentStatus !== 'PAID') {
    return NextResponse.json({ success: false, error: 'Booking is not paid' }, { status: 400 })
  }
  if (!booking.paymentGatewayRef) {
    return NextResponse.json({ success: false, error: 'No payment reference found' }, { status: 400 })
  }

  try {
    const Razorpay = (await import('razorpay')).default
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID ?? '',
      key_secret: process.env.RAZORPAY_KEY_SECRET ?? '',
    })

    const refund = await razorpay.payments.refund(booking.paymentGatewayRef, {
      amount: Math.round(Number(booking.calculatedPrice) * 100),
    })

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'REFUNDED' },
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: `REFUND:${booking.paymentGatewayRef}`,
        resource: `booking:${bookingId}`,
        result: 'GRANTED',
      },
    })

    // Send email notification to customer
    const customer = await prisma.user.findUnique({
      where: { id: booking.customerId },
      select: { name: true, email: true },
    })
    if (customer?.email) {
      await sendRefundProcessedEmail(
        customer.email,
        customer.name,
        booking.bookingNumber,
        Number(booking.calculatedPrice),
        refund.id,
      )
    }

    return NextResponse.json({ success: true, data: refund })
  } catch (err) {
    console.error('[PAYMENTS/REFUND]', err)
    return NextResponse.json({ success: false, error: 'Refund failed' }, { status: 500 })
  }
}
