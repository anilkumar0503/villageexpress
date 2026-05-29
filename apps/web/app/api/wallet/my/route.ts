import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

// GET /api/wallet/my - Get current user's wallet balance and transactions
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))

  // Get or create wallet
  let wallet = await prisma.wallet.findUnique({
    where: { userId: session!.userId },
  })

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: session!.userId,
        balance: 0,
      },
    })
  }

  // Get transactions
  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      wallet: {
        id: wallet.id,
        balance: Number(wallet.balance),
        isActive: wallet.isActive,
      },
      transactions,
      total,
      page,
      pageSize,
    },
  })
}
