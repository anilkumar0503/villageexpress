import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const pmProfile = await prisma.pointManagerProfile.findUnique({
    where: { userId: session!.userId },
    select: { shopLocationId: true },
  })

  if (!pmProfile?.shopLocationId) {
    return NextResponse.json({ success: false, error: 'Point manager location not found' }, { status: 404 })
  }

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))

  const where = {
    pickupLocationId: pmProfile.shopLocationId,
    ...(status && { status: status as 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' }),
  }

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, displayId: true, name: true, phone: true } },
        pickupLocation: { select: { pointName: true, village: true, district: true } },
        dropLocation: { select: { pointName: true, village: true, district: true } },
        captain: { select: { id: true, displayId: true, name: true, phone: true } },
      },
    }),
    prisma.booking.count({ where }),
  ])

  return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
}
