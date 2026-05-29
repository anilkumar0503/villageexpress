import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@ve/db'
import { sendNotificationToUser } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ?? '')
    .update(rawBody)
    .digest('hex')

  if (expectedSignature !== signature) {
    return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)
  const { event: eventName, payload } = event

  if (eventName === 'payment.captured') {
    const paymentId = payload.payment.entity.id as string
    const orderId = payload.payment.entity.order_id as string
    const notes = payload.payment.entity.notes as Record<string, string>
    const bookingId = notes?.bookingId

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { id: true, customerId: true, paymentStatus: true, bookingNumber: true },
      })
      if (booking && booking.paymentStatus !== 'PAID') {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
            paymentGatewayRef: paymentId,
            paidAt: new Date(),
          },
        })
        if (booking.customerId) {
          sendNotificationToUser(booking.customerId, {
            title: 'Village Express',
            body: `${booking.bookingNumber}: Payment received. Booking confirmed!`,
            data: { url: `/bookings/${bookingId}` },
          }).catch(() => {})
        }
      }
    }
  }

  if (eventName === 'payment.failed') {
    const notes = payload.payment.entity.notes as Record<string, string>
    const bookingId = notes?.bookingId
    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: 'FAILED', status: 'PAYMENT_FAILED' },
      })
    }
  }

  return NextResponse.json({ received: true })
}
