import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'
import { z } from 'zod'

const autoDebitSchema = z.object({
  collectionId: z.string().uuid(),
})

// POST /api/cod/auto-debit - Auto-debit COD from commissions
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { error: permissionError } = await requirePermission(req, 'commission:process_payout')
  if (permissionError) return permissionError

  const body = await req.json()
  const parsed = autoDebitSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { collectionId } = parsed.data

  try {
    // Get collection details
    const collection = await prisma.codCollection.findUnique({
      where: { id: collectionId },
      include: {
        booking: {
          select: {
            calculatedPrice: true,
          },
        },
      },
    })

    if (!collection) {
      return NextResponse.json({ success: false, error: 'COD collection not found' }, { status: 404 })
    }

    // Check if already remitted
    if (collection.status === 'REMITTED') {
      return NextResponse.json({ success: false, error: 'COD already remitted' }, { status: 400 })
    }

    // Get user's pending commissions
    const pendingCommissions = await prisma.commissionLedger.findMany({
      where: {
        userId: collection.userId,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'asc' },
    })

    const totalPendingCommission = pendingCommissions.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    )

    if (totalPendingCommission < Number(collection.amount)) {
      return NextResponse.json({ 
        success: false, 
        error: `Insufficient commission balance. Available: ₹${totalPendingCommission}, Required: ₹${collection.amount}` 
      }, { status: 400 })
    }

    // Process auto-debit using transaction
    await prisma.$transaction(async (tx: any) => {
      let remainingToDebit = Number(collection.amount)
      const commissionsToDebit: string[] = []

      // Debit from commissions
      for (const commission of pendingCommissions) {
        if (remainingToDebit <= 0) break

        const commissionAmount = Number(commission.amount)
        const debitAmount = Math.min(commissionAmount, remainingToDebit)

        if (debitAmount === commissionAmount) {
          // Fully debit this commission
          await tx.commissionLedger.update({
            where: { id: commission.id },
            data: { status: 'PAID', paidAt: new Date() },
          })
          commissionsToDebit.push(commission.id)
        } else {
          // Partially debit (not supported in current model, skip)
          continue
        }

        remainingToDebit -= debitAmount
      }

      // Create remittance record
      await tx.codRemittance.create({
        data: {
          collectionId,
          userId: collection.userId,
          amount: collection.amount,
          remittanceMethod: 'AUTO_DEBIT',
          status: 'COMPLETED',
          notes: `Auto-debited from ${commissionsToDebit.length} commission(s)`,
        },
      })

      // Update collection status
      await tx.codCollection.update({
        where: { id: collectionId },
        data: { status: 'REMITTED' },
      })
    })

    return NextResponse.json({ success: true, message: 'COD auto-debited from commissions successfully' })
  } catch (err) {
    console.error('Error processing auto-debit:', err)
    return NextResponse.json({ success: false, error: 'Failed to process auto-debit' }, { status: 500 })
  }
}
