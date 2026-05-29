import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

// GET /api/bookings/segments/my?status=ASSIGNED
// Get booking segments assigned to the current Captain
export async function GET(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'booking:read')
  if (error) return error

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 50))

  try {
    // Get segments assigned to this captain
    const segmentWhere: any = {
      assignedCaptainId: session!.userId,
    }

    if (status) {
      segmentWhere.status = status
    }

    // Also get direct bookings (without segments) assigned to this captain
    const bookingWhere: any = {
      assignedCaptainId: session!.userId,
      segments: { none: {} },
    }

    if (status) {
      // Map segment status to booking status
      const statusMap: Record<string, string> = {
        ASSIGNED: 'ASSIGNED',
        PICKED_UP: 'PICKED_UP',
        IN_TRANSIT: 'IN_TRANSIT',
        OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
        DELIVERED: 'DELIVERED',
      }
      bookingWhere.status = statusMap[status] || status
    }

    const [segments, segmentsTotal, directBookings] = await Promise.all([
      prisma.bookingSegment.findMany({
        where: segmentWhere,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              status: true,
              parcelWeight: true,
              parcelType: true,
              customer: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
          routeSegment: {
            include: {
              fromLocation: {
                select: { id: true, pointName: true, village: true },
              },
              toLocation: {
                select: { id: true, pointName: true, village: true },
              },
            },
          },
          pointManager: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: [
          { status: 'asc' },
          { sequenceOrder: 'asc' },
        ],
      }),
      prisma.bookingSegment.count({ where: segmentWhere }),
      prisma.booking.findMany({
        where: bookingWhere,
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          parcelWeight: true,
          parcelType: true,
          customer: {
            select: { id: true, name: true, phone: true },
          },
          pickupLocation: {
            select: { id: true, pointName: true, village: true },
          },
          dropLocation: {
            select: { id: true, pointName: true, village: true },
          },
          pointManager: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Convert direct bookings to segment-like format for consistent UI
    const directSegments = directBookings.map((booking: any) => ({
      id: `direct-${booking.id}`,
      status: booking.status,
      sequenceOrder: 1,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        parcelWeight: booking.parcelWeight,
        parcelType: booking.parcelType,
        customer: booking.customer,
      },
      routeSegment: {
        fromLocation: booking.pickupLocation,
        toLocation: booking.dropLocation,
      },
      pointManager: booking.pointManager,
    }))

    const allItems = [...segments, ...directSegments]
    const total = segmentsTotal + directBookings.length

    return NextResponse.json({ success: true, data: { items: allItems, total, page, pageSize } })
  } catch (err) {
    console.error('[BOOKINGS/SEGMENTS/MY/GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
