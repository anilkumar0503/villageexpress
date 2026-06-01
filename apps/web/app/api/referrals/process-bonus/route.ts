import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

// POST /api/referrals/process-bonus - Process referral bonus after first booking
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  try {
    const { bookingId } = await req.json()

    // Get booking to verify it's completed
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'DELIVERED') {
      return NextResponse.json({ success: false, error: 'Booking must be delivered first' }, { status: 400 })
    }

    // Find referral for this user
    const referral = await prisma.referral.findFirst({
      where: { refereeId: booking.customerId },
    })

    if (!referral) {
      return NextResponse.json({ success: false, error: 'No referral found' }, { status: 404 })
    }

    if (referral.refereeEarned) {
      return NextResponse.json({ success: false, error: 'Referral bonus already processed' }, { status: 400 })
    }

    // Get or create wallets for both referrer and referee
    const [referrerWallet, refereeWallet] = await Promise.all([
      prisma.wallet.findUnique({ where: { userId: referral.referrerId } }),
      prisma.wallet.findUnique({ where: { userId: referral.refereeId } }),
    ])

    if (!referrerWallet || !refereeWallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })
    }

    const bonusAmount = referral.bonusAmount

    // Process bonuses in transaction
    await prisma.$transaction([
      // Credit referrer
      prisma.wallet.update({
        where: { id: referrerWallet.id },
        data: { balance: { increment: bonusAmount } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: referrerWallet.id,
          userId: referral.referrerId,
          type: 'REFERRAL_EARNING',
          amount: bonusAmount,
          balanceBefore: referrerWallet.balance,
          balanceAfter: referrerWallet.balance.plus(bonusAmount),
          description: 'Referral bonus for inviting a new user',
          referenceId: referral.id,
          referenceType: 'REFERRAL',
        },
      }),
      // Credit referee
      prisma.wallet.update({
        where: { id: refereeWallet.id },
        data: { balance: { increment: bonusAmount } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: refereeWallet.id,
          userId: referral.refereeId,
          type: 'REFERRAL_BONUS',
          amount: bonusAmount,
          balanceBefore: refereeWallet.balance,
          balanceAfter: refereeWallet.balance.plus(bonusAmount),
          description: 'Referral bonus for signing up with a referral code',
          referenceId: referral.id,
          referenceType: 'REFERRAL',
        },
      }),
      // Mark referral as completed
      prisma.referral.update({
        where: { id: referral.id },
        data: {
          referrerEarned: true,
          refereeEarned: true,
          completedAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({ success: true, data: { bonusAmount } })
  } catch (err) {
    console.error('[REFERRALS/PROCESS-BONUS/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
