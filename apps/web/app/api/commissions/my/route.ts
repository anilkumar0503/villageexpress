import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

// GET /api/commissions/my - Get commission ledger for current captain or PM
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined

  const where: any = { userId: session!.userId }
  if (status && status !== 'ALL') where.status = status

  const [entries, totals] = await Promise.all([
    prisma.commissionLedger.findMany({
      where,
      include: {
        bookingSegment: {
          include: {
            booking: { select: { bookingNumber: true, calculatedPrice: true } },
            routeSegment: {
              include: {
                fromLocation: { select: { pointName: true } },
                toLocation: { select: { pointName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.commissionLedger.groupBy({
      by: ['status'],
      where: { userId: session!.userId },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  const summary = {
    pending: 0,
    approved: 0,
    paid: 0,
  }
  for (const t of totals) {
    if (t.status === 'PENDING') summary.pending = Number(t._sum.amount ?? 0)
    if (t.status === 'APPROVED') summary.approved = Number(t._sum.amount ?? 0)
    if (t.status === 'PAID') summary.paid = Number(t._sum.amount ?? 0)
  }

  return NextResponse.json({ success: true, data: { entries, summary } })
}
