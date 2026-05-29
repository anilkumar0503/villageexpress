import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

// GET /api/cod/admin - Get all COD collections and remittances for admin
export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { error: permissionError } = await requirePermission(req, 'commission:view')
  if (permissionError) return permissionError

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const type = searchParams.get('type') ?? 'collections' // 'collections' or 'remittances'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))

  try {
    if (type === 'collections') {
      const where: any = {}
      if (status) where.status = status

      const [items, total] = await Promise.all([
        prisma.codCollection.findMany({
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
            booking: {
              select: {
                bookingNumber: true,
                calculatedPrice: true,
                paymentStatus: true,
                customer: {
                  select: {
                    name: true,
                    phone: true,
                  },
                },
              },
            },
            remittances: {
              select: {
                id: true,
                amount: true,
                remittanceMethod: true,
                status: true,
                remittanceDate: true,
              },
            },
          },
          orderBy: { collectionDate: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.codCollection.count({ where }),
      ])

      return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
    } else {
      const where: any = {}
      if (status) where.status = status

      const [items, total] = await Promise.all([
        prisma.codRemittance.findMany({
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
            collection: {
              include: {
                booking: {
                  select: {
                    bookingNumber: true,
                    calculatedPrice: true,
                  },
                },
              },
            },
          },
          orderBy: { remittanceDate: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.codRemittance.count({ where }),
      ])

      return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
    }
  } catch (err) {
    console.error('Error fetching COD data:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch COD data' }, { status: 500 })
  }
}
