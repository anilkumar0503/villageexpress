import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const paymentStatus = searchParams.get('paymentStatus') ?? undefined
  const paymentMethod = searchParams.get('paymentMethod') ?? undefined
  const parcelType = searchParams.get('parcelType') ?? undefined
  const deliveryPriority = searchParams.get('deliveryPriority') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(50, Number(searchParams.get('pageSize') ?? 10))
  const dateFrom = searchParams.get('dateFrom') ?? undefined
  const dateTo = searchParams.get('dateTo') ?? undefined

  const where: any = {
    customerId: session!.userId,
    ...(status && { status: status as 'PENDING' }),
    ...(paymentStatus && { paymentStatus: paymentStatus as 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED' }),
    ...(paymentMethod && { paymentMethod: paymentMethod as 'COD' | 'ONLINE' }),
    ...(parcelType && { parcelType: parcelType as 'DOCUMENTS' | 'GENERAL' | 'FRAGILE' | 'PERISHABLE' }),
    ...(deliveryPriority && { deliveryPriority: deliveryPriority as 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' }),
  }

  if (dateFrom || dateTo) {
    const dateFilter: any = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) dateFilter.lte = new Date(dateTo)
    where.createdAt = dateFilter
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
        parcelType: true,
        deliveryPriority: true,
        calculatedPrice: true,
        estimatedDeliveryDate: true,
        paymentStatus: true,
        paymentMethod: true,
        createdAt: true,
        pickupLocation: { select: { pointName: true, village: true, district: true } },
        dropLocation: { select: { pointName: true, village: true, district: true } },
        captain: { select: { displayId: true, name: true, phone: true } },
      },
    }),
    prisma.booking.count({ where }),
  ])

  return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
}
