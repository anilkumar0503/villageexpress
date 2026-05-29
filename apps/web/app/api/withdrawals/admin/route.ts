import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

// GET /api/withdrawals/admin - Get all withdrawal requests for admin
export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { error: permissionError } = await requirePermission(req, 'commission:view')
  if (permissionError) return permissionError

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))

  const where: any = {}
  if (status) where.status = status

  try {
    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              displayId: true,
            },
          },
          wallet: {
            select: {
              balance: true,
            },
          },
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
