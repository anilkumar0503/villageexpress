import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

// GET /api/commissions/admin - Get all commissions for admin
export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { error: permissionError } = await requirePermission(req, 'commission:view')
  if (permissionError) return permissionError

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const role = searchParams.get('role') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))

  const where: any = {}
  if (status && status !== 'ALL') where.status = status
  if (role && role !== 'ALL') where.role = role

  try {
    const [items, total] = await Promise.all([
      prisma.commissionLedger.findMany({
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
          bookingSegment: {
            include: {
              booking: {
                select: {
                  bookingNumber: true,
                  calculatedPrice: true,
                },
              },
              routeSegment: {
                include: {
                  fromLocation: {
                    select: {
                      pointName: true,
                      village: true,
                      district: true,
                    },
                  },
                  toLocation: {
                    select: {
                      pointName: true,
                      village: true,
                      district: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.commissionLedger.count({ where }),
    ])

    return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
  } catch (err) {
    console.error('Error fetching commissions:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch commissions' }, { status: 500 })
  }
}
