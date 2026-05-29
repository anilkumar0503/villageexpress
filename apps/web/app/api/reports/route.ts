import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  try {
    const { error, session } = await requireAuth(req)
    if (error) return error

    const { searchParams } = req.nextUrl
    const days = Math.min(90, Number(searchParams.get('days') ?? 30))
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const pmProfile = await prisma.pointManagerProfile.findUnique({
      where: { userId: session!.userId },
      select: { shopLocationId: true },
    })

    const locationId = pmProfile?.shopLocationId

    // Get segments at this point (both incoming and outgoing)
    const segmentsWhere = locationId
      ? {
          createdAt: { gte: startDate },
          OR: [
            { routeSegment: { fromLocationId: locationId } },
            { routeSegment: { toLocationId: locationId } },
          ],
        }
      : { createdAt: { gte: startDate } }

    const [
      totalSegments,
      receivedSegments,
      assignedSegments,
      deliveredSegments,
      codCollectedSegments,
      commissionsEarned,
      segmentStatusBreakdown,
    ] = await Promise.all([
      prisma.bookingSegment.count({ where: segmentsWhere }),
      prisma.bookingSegment.count({ where: { ...segmentsWhere, status: 'RECEIVED_AT_POINT' } }),
      prisma.bookingSegment.count({ where: { ...segmentsWhere, status: 'ASSIGNED' } }),
      prisma.bookingSegment.count({ where: { ...segmentsWhere, status: 'DELIVERED' } }),
      prisma.bookingSegment.findMany({
        where: { ...segmentsWhere, codCollectedAt: { not: null } },
        include: { booking: { select: { calculatedPrice: true } } },
      }),
      prisma.commissionLedger.aggregate({
        where: {
          userId: session!.userId,
          role: 'POINT_MANAGER',
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.bookingSegment.groupBy({
        by: ['status'],
        where: segmentsWhere,
        _count: true,
      }),
    ])

    const statusMap = segmentStatusBreakdown.reduce(
      (acc, { status, _count }) => ({ ...acc, [status]: _count }),
      {} as Record<string, number>
    )

    // Get daily trends using Prisma instead of raw SQL
    const dailyTrends = await prisma.bookingSegment.groupBy({
      by: ['createdAt'],
      where: segmentsWhere,
      _count: true,
      orderBy: { createdAt: 'desc' },
    })

    // Group by date
    const dailyTrendMap = dailyTrends.reduce((acc, item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + item._count
      return acc
    }, {} as Record<string, number>)

    const dailyTrendData = Object.entries(dailyTrendMap)
      .slice(0, 7)
      .map(([date, count]) => ({ date, count }))

    const codCollected = codCollectedSegments.reduce(
      (sum, seg) => sum + Number(seg.booking.calculatedPrice),
      0
    )

    return NextResponse.json({
      success: true,
      data: {
        totalSegments,
        receivedSegments,
        assignedSegments,
        deliveredSegments,
        codCollected,
        commissionsEarned: Number(commissionsEarned._sum.amount ?? 0),
        segmentStatusBreakdown: statusMap,
        dailyTrends: dailyTrendData,
        days,
      },
    })
  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports data' },
      { status: 500 }
    )
  }
}
