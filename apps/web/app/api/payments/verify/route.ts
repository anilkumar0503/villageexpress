import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

const schema = z.object({
  bookingId: z.string().uuid(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
})

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ?? '')
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  if (expectedSignature !== razorpaySignature) {
    return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, customerId: true, paymentStatus: true, paymentMethod: true, calculatedPrice: true },
  })

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
  }
  if (booking.customerId !== session!.userId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      paidAt: new Date(),
      paidAmount: booking.calculatedPrice,
      // If this was a COD or WALLET booking being converted to online payment, update paymentMethod
      ...(booking.paymentMethod === 'COD' && { paymentMethod: 'ONLINE' }),
      ...(booking.paymentMethod === 'WALLET' && { paymentMethod: 'ONLINE' }),
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: 'PAYMENT_VERIFIED',
      resource: `booking:${bookingId}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, message: 'Payment verified and booking confirmed' })
}
