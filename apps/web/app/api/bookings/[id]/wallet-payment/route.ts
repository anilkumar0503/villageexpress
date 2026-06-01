import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

// POST /api/bookings/[id]/wallet-payment - Pay for booking using wallet
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  try {
    const { id } = await params
    const body = await req.json()
    const { partialPayment = false } = body

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    if (booking.customerId !== session!.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json({ success: false, error: 'Booking already paid' }, { status: 400 })
    }

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session!.userId },
    })

    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })
    }

    const fullAmount = booking.calculatedPrice
    const walletBalance = wallet.balance

    // If partial payment requested or insufficient balance
    if (partialPayment || walletBalance < fullAmount) {
      // Calculate how much to pay: either the remaining amount or the full wallet balance (whichever is less)
      const currentPaidAmount = booking.paidAmount || 0
      const remainingToPay = fullAmount.minus(currentPaidAmount)
      const paymentAmount = walletBalance < remainingToPay ? walletBalance : remainingToPay

      if (paymentAmount.lte(0)) {
        return NextResponse.json({ success: false, error: 'No wallet balance available' }, { status: 400 })
      }

      const balanceBefore = walletBalance
      const balanceAfter = balanceBefore.minus(paymentAmount)
      const remainingAmount = fullAmount.minus(currentPaidAmount.plus(paymentAmount))
      const newPaidAmount = currentPaidAmount.plus(paymentAmount)

      // Process partial payment in transaction
      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: balanceAfter },
        }),
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: session!.userId,
            type: 'BOOKING_PAYMENT',
            amount: paymentAmount,
            balanceBefore,
            balanceAfter,
            description: `Partial payment for booking ${booking.bookingNumber}`,
            referenceId: booking.id,
            referenceType: 'BOOKING',
          },
        }),
        prisma.booking.update({
          where: { id },
          data: {
            paymentStatus: 'PARTIALLY_PAID',
            paidAmount: newPaidAmount,
            paidAt: new Date(),
          },
        }),
      ])

      return NextResponse.json({ 
        success: true, 
        data: { 
          balance: balanceAfter,
          paidAmount: paymentAmount,
          totalPaid: newPaidAmount,
          remainingAmount,
          partialPayment: true
        } 
      })
    }

    // Full payment
    const balanceBefore = walletBalance
    const balanceAfter = balanceBefore.minus(fullAmount)

    // Process payment in transaction
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: session!.userId,
          type: 'BOOKING_PAYMENT',
          amount: fullAmount,
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
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          paymentMethod: 'WALLET' as any,
          paidAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({ success: true, data: { balance: balanceAfter, partialPayment: false } })
  } catch (err) {
    console.error('[BOOKINGS/[id]/WALLET-PAYMENT/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
