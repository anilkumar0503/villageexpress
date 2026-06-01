import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const userId = session!.userId
  const { searchParams } = req.nextUrl
  const period = searchParams.get('period') ?? 'daily' // daily, weekly, monthly

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: { include: { role: true } },
      pointManagerProfile: true,
    },
  })

  const roles = user?.userRoles.map((ur: any) => ur.role.name) ?? []
  const isPM = roles.includes('POINT_MANAGER')

  if (!isPM) {
    return NextResponse.json({ success: false, error: 'Only point managers can access this endpoint' }, { status: 403 })
  }

  const locationId = user?.pointManagerProfile?.shopLocationId

  if (!locationId) {
    return NextResponse.json({ success: false, error: 'Point manager has no shop location assigned' }, { status: 400 })
  }

  // Calculate date range based on period
  const now = new Date()
  let startDate: Date
  let groupBy: string

  if (period === 'daily') {
    startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 30) // Last 30 days
    groupBy = 'day'
  } else if (period === 'weekly') {
    startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 84) // Last 12 weeks
    groupBy = 'week'
  } else {
    startDate = new Date(now)
    startDate.setMonth(startDate.getMonth() - 12) // Last 12 months
    groupBy = 'month'
  }

  // Fetch segments for deliveries (all segments at this location, regardless of creation date)
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

  // Fetch COD collections (all collections for this user)
  const codCollections = await prisma.codCollection.findMany({
    where: {
      userId,
    },
  })

  // Fetch commission ledger (all commissions for this user)
  const commissionLedger = await prisma.commissionLedger.findMany({
    where: {
      userId,
    },
  })

  // Group data by time period
  const timeSeriesData = generateTimeSeriesData(
    startDate,
    now,
    period,
    segments,
    codCollections,
    commissionLedger
  )

  return NextResponse.json({
    success: true,
    data: {
      period,
      startDate,
      endDate: now,
      data: timeSeriesData,
    },
  })
}

function generateTimeSeriesData(
  startDate: Date,
  endDate: Date,
  period: string,
  segments: any[],
  codCollections: any[],
  commissionLedger: any[]
) {
  const data: any[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    const periodStart = new Date(current)
    const periodEnd = new Date(current)

    if (period === 'daily') {
      periodEnd.setHours(23, 59, 59, 999)
      current.setDate(current.getDate() + 1)
    } else if (period === 'weekly') {
      periodEnd.setDate(periodEnd.getDate() + 6)
      periodEnd.setHours(23, 59, 59, 999)
      current.setDate(current.getDate() + 7)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
      periodEnd.setDate(0)
      periodEnd.setHours(23, 59, 59, 999)
      current.setMonth(current.getMonth() + 1)
      current.setDate(1)
    }

    // Filter data for this period
    const periodSegments = segments.filter(s => {
      // Use updatedAt for delivery date (when status changed to DELIVERED)
      const segDate = s.status === 'DELIVERED' ? new Date(s.updatedAt) : new Date(s.createdAt)
      return segDate >= periodStart && segDate <= periodEnd
    })

    const periodCOD = codCollections.filter(c => {
      const codDate = new Date(c.collectionDate)
      return codDate >= periodStart && codDate <= periodEnd
    })

    const periodCommission = commissionLedger.filter(c => {
      const commDate = new Date(c.createdAt)
      return commDate >= periodStart && commDate <= periodEnd
    })

    // Calculate metrics
    const deliveries = periodSegments.filter(s => s.status === 'DELIVERED').length
    const codCollected = periodCOD.reduce((sum: number, c: any) => sum + Number(c.amount), 0)
    const commissionEarned = periodCommission.reduce((sum: number, c: any) => sum + Number(c.amount), 0)

    // Format label
    let label: string
    if (period === 'daily') {
      label = periodStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    } else if (period === 'weekly') {
      label = `W${Math.ceil(periodStart.getDate() / 7)} ${periodStart.toLocaleDateString('en-IN', { month: 'short' })}`
    } else {
      label = periodStart.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    }

    data.push({
      date: periodStart.toISOString(),
      label,
      deliveries,
      codCollected,
      commissionEarned,
    })
  }

  return data
}
