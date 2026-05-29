import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'
import { BookingStatus } from '@ve/db'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') as BookingStatus | undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(50, Number(searchParams.get('pageSize') ?? 10))

  const where = {
    assignedCaptainId: session!.userId,
    ...(status && { status }),
  }

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        calculatedPrice: true,
        createdAt: true,
        customer: { select: { name: true, phone: true } },
        pickupLocation: { select: { pointName: true, village: true, district: true } },
        dropLocation: { select: { pointName: true, village: true, district: true } },
      },
    }),
    prisma.booking.count({ where }),
  ])

  return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
}
