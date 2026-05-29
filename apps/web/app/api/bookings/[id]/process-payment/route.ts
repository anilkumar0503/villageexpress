import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const schema = z.object({
  paymentMethod: z.enum(['WALLET', 'COD']),
  notes: z.string().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/bookings/[id]/process-payment - Manually process pending payment
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'booking:update_status')
  if (error) return error

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { paymentMethod, notes } = parsed.data

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    if (booking.paymentStatus !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { success: false, error: 'Payment is not pending' },
        { status: 400 }
      )
    }

    if (paymentMethod === 'WALLET') {
      // Process wallet payment
      const wallet = await prisma.wallet.findUnique({
        where: { userId: booking.customerId },
      })

      if (!wallet) {
        return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })
      }

      if (Number(wallet.balance) < Number(booking.calculatedPrice)) {
        return NextResponse.json({ success: false, error: 'Insufficient wallet balance' }, { status: 400 })
      }

      const debitAmount = Number(booking.calculatedPrice)
      const balanceBefore = wallet.balance
      const balanceAfter = balanceBefore.minus(debitAmount)

      await prisma.$transaction([
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
            description: `Manual payment for booking ${booking.bookingNumber}`,
            referenceId: booking.id,
            referenceType: 'BOOKING',
          },
        }),
        prisma.booking.update({
          where: { id },
          data: {
            paymentStatus: 'PAID',
            paidAmount: debitAmount,
            paidAt: new Date(),
          },
        }),
      ])

      return NextResponse.json({ success: true, message: 'Wallet payment processed successfully' })
    }

    if (paymentMethod === 'COD') {
      // Process COD collection
      await prisma.booking.update({
        where: { id },
        data: {
          paymentStatus: 'PAID',
          paidAmount: booking.calculatedPrice,
          paidAt: new Date(),
          codCollectedAt: new Date(),
        },
      })

      // Create COD collection record
      await prisma.codCollection.create({
        data: {
          userId: session!.userId,
          bookingId: id,
          amount: booking.calculatedPrice,
          collectionMethod: 'MANUAL',
          status: 'COLLECTED',
          notes: notes || 'Manual COD collection',
        },
      })

      return NextResponse.json({ success: true, message: 'COD collection recorded successfully' })
    }

    return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 })
  } catch (err) {
    console.error('[BOOKINGS/PROCESS-PAYMENT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
