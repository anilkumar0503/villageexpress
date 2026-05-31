import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'
import { sendCommissionPayoutEmail } from '@/lib/email'

// POST /api/commissions/payout - Process approved commissions as payouts
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { error: permissionError } = await requirePermission(req, 'commission:process_payout')
  if (permissionError) return permissionError

  const body = await req.json()
  const { commissionIds } = body

  if (!Array.isArray(commissionIds) || commissionIds.length === 0) {
    return NextResponse.json({ success: false, error: 'commissionIds array is required' }, { status: 400 })
  }

  // Get all approved commissions
  const commissions = await prisma.commissionLedger.findMany({
    where: {
      id: { in: commissionIds },
      status: 'APPROVED',
    },
  })

  if (commissions.length === 0) {
    return NextResponse.json({ success: false, error: 'No approved commissions found' }, { status: 400 })
  }

  // Process each commission as a payout
  const results = await prisma.$transaction(async (tx) => {
    const processed = []

    for (const commission of commissions) {
      // Ensure user has a wallet
      let wallet = await tx.wallet.findUnique({
        where: { userId: commission.userId },
      })
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: commission.userId,
            balance: 0,
          },
        })
      }

      const balanceBefore = wallet.balance
      const balanceAfter = balanceBefore.plus(commission.amount)

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      })

      // Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: commission.userId,
          type: 'ADMIN_ADJUSTMENT',
          amount: commission.amount,
          balanceBefore,
          balanceAfter,
          description: 'Commission payout',
          referenceId: commission.id,
          referenceType: 'COMMISSION',
        },
      })

      // Update commission status to PAID
      const updated = await tx.commissionLedger.update({
        where: { id: commission.id },
        data: { status: 'PAID', paidAt: new Date() },
      })

      processed.push(updated)
    }

    return processed
  })

  // Send email notifications for each payout
  for (const commission of results) {
    const user = await prisma.user.findUnique({
      where: { id: commission.userId },
      select: { name: true, email: true },
    })
    if (user?.email) {
      await sendCommissionPayoutEmail(
        user.email,
        user.name,
        commission.id,
        Number(commission.amount),
        commission.paidAt ? commission.paidAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      )
    }
  }

  return NextResponse.json({ success: true, data: results })
}
