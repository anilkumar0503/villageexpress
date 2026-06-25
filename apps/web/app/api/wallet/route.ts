import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

// GET /api/wallet - Get wallet balance and recent transactions
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  //console.log('[WALLET/GET] Auth header:', authHeader?.substring(0, 20) + '...')

  const { error, session } = await requireAuth(req)
  if (error) {
    //console.log('[WALLET/GET] Auth error:', error)
    return error
  }

  //console.log('[WALLET/GET] Session:', session?.userId)

  const { searchParams } = new URL(req.url)
  const skip = parseInt(searchParams.get('skip') || '0')
  const take = parseInt(searchParams.get('take') || '10')
  const typeFilter = searchParams.get('type')

  //console.log('[WALLET/GET] Filter params:', { skip, take, typeFilter })

  try {
    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session!.userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          ...(typeFilter ? { where: { type: typeFilter as any } } : {}),
        },
      },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: session!.userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            skip,
            take,
            ...(typeFilter ? { where: { type: typeFilter as any } } : {}),
          },
        },
      })
    }

    //console.log('[WALLET/GET] Transactions found:', wallet.transactions.length)

    // Get total transaction count for pagination
    const totalCount = await prisma.walletTransaction.count({
      where: {
        walletId: wallet.id,
        ...(typeFilter ? { type: typeFilter as any } : {}),
      },
    })

    //console.log('[WALLET/GET] Total count:', totalCount)

    return NextResponse.json({
      success: true,
      data: wallet,
      pagination: {
        skip,
        take,
        total: totalCount,
        hasMore: skip + take < totalCount,
      },
    })
  } catch (err) {
    console.error('[WALLET/GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
