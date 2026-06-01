import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))
  const status = searchParams.get('status') ?? undefined

  // Check user role
  const userRoles = await prisma.userRole.findMany({
    where: { userId: session!.userId },
    include: { role: { select: { name: true } } },
  })

  const roleNames = userRoles.map((ur: any) => ur.role.name)
  const isAdmin = roleNames.includes('ADMIN')
  const isPointManager = roleNames.includes('POINT_MANAGER')
  const isCustomer = roleNames.includes('CUSTOMER')

  let where: any = {
    paymentStatus: 'REFUNDED',
  }

  if (status) {
    where.status = status
  }

  // Filter based on role
  if (isCustomer) {
    where.customerId = session!.userId
  } else if (isPointManager) {
    // Get PM's shop location
    const pmProfile = await prisma.pointManagerProfile.findUnique({
      where: { userId: session!.userId },
      select: { shopLocationId: true },
    })

    if (pmProfile) {
      where.OR = [
        { pickupLocationId: pmProfile.shopLocationId },
        { dropLocationId: pmProfile.shopLocationId },
      ]
    }
  }
  // Admins see all refunds

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
        paymentStatus: true,
        paymentMethod: true,
        createdAt: true,
        customer: { select: { id: true, name: true, phone: true } },
        pickupLocation: { select: { pointName: true, village: true } },
        dropLocation: { select: { pointName: true, village: true } },
      },
    }),
    prisma.booking.count({ where }),
  ])

  return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
}
