import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

type RouteContext = { params: Promise<{ bookingId: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { bookingId } = await params

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customer: true },
  })

  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
  }

  if (booking.customerId !== session!.userId) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  if (booking.paymentStatus === 'PAID' || booking.paymentStatus === 'COD') {
    return NextResponse.json({ success: false, error: 'Payment already processed' }, { status: 400 })
  }

  if (booking.paymentMethod === 'COD') {
    return NextResponse.json({ success: false, error: 'COD bookings do not require payment initiation' }, { status: 400 })
  }

  // Initialize Razorpay only if credentials are available
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    return NextResponse.json({ success: false, error: 'Razorpay credentials not configured' }, { status: 500 })
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })

  const options = {
    amount: Math.round(Number(booking.calculatedPrice) * 100),
    currency: 'INR',
    receipt: booking.bookingNumber,
    notes: {
      bookingId: booking.id,
      customerId: booking.customerId,
    },
  }

  try {
    const order = await razorpay.orders.create(options)

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        bookingNumber: booking.bookingNumber,
      },
    })
  } catch (err) {
    console.error('[PAYMENTS/INITIATE]', err)
    return NextResponse.json({ success: false, error: 'Failed to create payment order' }, { status: 500 })
  }
}
