import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'
import { z } from 'zod'

const approveSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
  transactionId: z.string().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/withdrawals/[id]/approve - Approve or reject withdrawal request
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { error: permissionError } = await requirePermission(req, 'commission:process_payout')
  if (permissionError) return permissionError

  const { id } = await params
  const body = await req.json()
  const parsed = approveSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { action, rejectionReason, transactionId } = parsed.data

  try {
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        wallet: true,
      },
    })

    if (!withdrawal) {
      return NextResponse.json({ success: false, error: 'Withdrawal request not found' }, { status: 404 })
    }

    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'Withdrawal request is not pending' }, { status: 400 })
    }

    if (action === 'REJECT') {
      await prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason,
          processedAt: new Date(),
          processedBy: session!.userId,
        },
      })

      return NextResponse.json({ success: true, message: 'Withdrawal request rejected' })
    }

    if (action === 'APPROVE') {
      await prisma.$transaction(async (tx: any) => {
        // Update withdrawal status
        await tx.withdrawalRequest.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            transactionId,
            processedAt: new Date(),
            processedBy: session!.userId,
          },
        })

        // Deduct from wallet
        await tx.wallet.update({
          where: { id: withdrawal.walletId },
          data: {
            balance: {
              decrement: withdrawal.amount,
            },
          },
        })

        // Create wallet transaction
        await tx.walletTransaction.create({
          data: {
            walletId: withdrawal.walletId,
            userId: withdrawal.userId,
            type: 'ADMIN_ADJUSTMENT',
            amount: withdrawal.amount,
            balanceBefore: withdrawal.wallet.balance,
            balanceAfter: Number(withdrawal.wallet.balance) - Number(withdrawal.amount),
            description: 'Withdrawal payout',
            referenceId: id,
            referenceType: 'WITHDRAWAL',
          },
        })
      })

      return NextResponse.json({ success: true, message: 'Withdrawal approved and processed' })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Error processing withdrawal:', err)
    return NextResponse.json({ success: false, error: 'Failed to process withdrawal' }, { status: 500 })
  }
}
