import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Razorpay from 'razorpay'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

const schema = z.object({ bookingId: z.string().uuid() })

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ?? '',
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? '',
})

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: { id: true, customerId: true, calculatedPrice: true, paymentStatus: true, paymentMethod: true, bookingNumber: true, paidAmount: true },
  })

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
  }
  if (booking.customerId !== session!.userId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  if (booking.paymentStatus === 'PAID') {
    return NextResponse.json({ success: false, error: 'Booking already paid' }, { status: 409 })
  }

  // Calculate remaining amount for partial payments
  const remainingAmount = booking.calculatedPrice.minus(booking.paidAmount || 0)
  if (remainingAmount.lte(0)) {
    return NextResponse.json({ success: false, error: 'Booking already fully paid' }, { status: 409 })
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(Number(remainingAmount) * 100),
      currency: 'INR',
      receipt: booking.bookingNumber,
      notes: { bookingId: booking.id },
    })

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingNumber: booking.bookingNumber,
      },
    })
  } catch (err) {
    console.error('[PAYMENTS/CREATE-ORDER]', err)
    return NextResponse.json({ success: false, error: 'Failed to create payment order' }, { status: 500 })
  }
}
