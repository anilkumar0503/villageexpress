import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const userId = session!.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: { include: { role: true } },
      pointManagerProfile: true,
    },
  })

  const roles = user?.userRoles.map((ur) => ur.role.name) ?? []
  const isAdmin = roles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r))
  const isPM = roles.includes('POINT_MANAGER')
  const isCaptain = roles.includes('CAPTAIN')
  const isCustomer = roles.includes('CUSTOMER') || (!isAdmin && !isPM && !isCaptain)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (isAdmin) {
    const [totalBookings, totalUsers, pendingApprovals, activeLocations, todayBookings, revenue] = await Promise.all([
      prisma.booking.count(),
      prisma.user.count(),
      prisma.user.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.location.count({ where: { isActive: true } }),
      prisma.booking.count({ where: { createdAt: { gte: today } } }),
      prisma.booking.aggregate({
        _sum: { calculatedPrice: true },
        where: { paymentStatus: 'PAID' },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalBookings,
        totalUsers,
        pendingApprovals,
        activeLocations,
        todayBookings,
        totalRevenue: Number(revenue._sum.calculatedPrice ?? 0),
      },
    })
  }

  if (isPM) {
    const locationId = user?.pointManagerProfile?.shopLocationId

    // Fetch segments at PM's location
    const segments = await prisma.bookingSegment.findMany({
      where: {
        routeSegment: {
          fromLocationId: locationId,
        },
      },
      include: {
        booking: {
          select: {
            calculatedPrice: true,
          },
        },
      },
    })

    // Calculate metrics
    const pending = segments.filter(s => s.status === 'PENDING').length
    const inTransit = segments.filter(s => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(s.status)).length
    const deliveredToday = segments.filter(s => s.status === 'DELIVERED' && s.updatedAt >= today).length

    // COD metrics
    const codCollected = segments
      .filter(s => s.codCollectedAt)
      .reduce((sum, s) => sum + Number(s.booking.calculatedPrice), 0)

    // Fetch pending COD from COD collections
    const codCollections = await prisma.codCollection.findMany({
      where: {
        userId,
        status: 'COLLECTED',
      },
    })
    const pendingCOD = codCollections.reduce((sum, c) => sum + Number(c.amount), 0)

    // Commission metrics
    const commissionLedger = await prisma.commissionLedger.groupBy({
      by: ['status'],
      where: { userId },
      _sum: { amount: true },
    })
    const commission = commissionLedger.reduce((sum, t) => sum + Number(t._sum.amount ?? 0), 0)

    return NextResponse.json({
      success: true,
      data: {
        pending,
        inTransit,
        deliveredToday,
        codCollected,
        pendingCOD,
        commission,
      },
    })
  }

  if (isCaptain) {
    const [assigned, deliveredToday] = await Promise.all([
      prisma.bookingSegment.count({ where: { assignedCaptainId: userId, status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } }),
      prisma.bookingSegment.count({ where: { assignedCaptainId: userId, status: 'DELIVERED', updatedAt: { gte: today } } }),
    ])

    return NextResponse.json({
      success: true,
      data: { assigned, deliveredToday },
    })
  }

  // Customer
  const [total, active, delivered] = await Promise.all([
    prisma.booking.count({ where: { customerId: userId } }),
    prisma.booking.count({ where: { customerId: userId, status: { in: ['CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } }),
    prisma.booking.count({ where: { customerId: userId, status: 'DELIVERED' } }),
  ])

  return NextResponse.json({
    success: true,
    data: { total, active, delivered },
  })
}
