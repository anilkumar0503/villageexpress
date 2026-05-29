import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'
import { z } from 'zod'

const withdrawalSchema = z.object({
  amount: z.number().positive(),
  notes: z.string().optional(),
})

// GET /api/withdrawals - Get user's withdrawal requests
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))

  const where: any = { userId: session!.userId }
  if (status) where.status = status

  try {
    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        include: {
          payoutDetails: {
            select: {
              type: true,
              upiId: true,
              bankName: true,
              accountNumber: true,
              ifscCode: true,
              accountHolderName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.withdrawalRequest.count({ where }),
    ])

    return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
  } catch (err) {
    console.error('Error fetching withdrawals:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch withdrawals' }, { status: 500 })
  }
}

// POST /api/withdrawals - Create withdrawal request
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const body = await req.json()
  const parsed = withdrawalSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { amount, notes } = parsed.data

  try {
    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session!.userId },
    })

    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })
    }

    // Check sufficient balance
    if (Number(wallet.balance) < amount) {
      return NextResponse.json({ 
        success: false, 
        error: `Insufficient balance. Available: ₹${wallet.balance}, Requested: ₹${amount}` 
      }, { status: 400 })
    }

    // Get user's payout details
    const payoutDetails = await prisma.payoutDetails.findUnique({
      where: { userId: session!.userId },
    })

    if (!payoutDetails) {
      return NextResponse.json({ success: false, error: 'Please add payout details before requesting withdrawal' }, { status: 400 })
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId: session!.userId,
        walletId: wallet.id,
        amount,
        payoutDetailsId: payoutDetails.id,
        notes,
      },
      include: {
        payoutDetails: {
          select: {
            type: true,
            upiId: true,
            bankName: true,
            accountNumber: true,
            ifscCode: true,
            accountHolderName: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: withdrawal })
  } catch (err) {
    console.error('Error creating withdrawal:', err)
    return NextResponse.json({ success: false, error: 'Failed to create withdrawal request' }, { status: 500 })
  }
}
