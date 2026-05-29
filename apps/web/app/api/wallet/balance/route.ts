import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.userId },
    })

    if (!wallet) {
      return NextResponse.json({ success: true, data: { balance: 0 } })
    }

    return NextResponse.json({ success: true, data: { balance: wallet.balance } })
  } catch (error) {
    console.error('[WALLET_BALANCE/GET]', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch wallet balance' }, { status: 500 })
  }
}
