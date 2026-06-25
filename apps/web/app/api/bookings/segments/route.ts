import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

// GET /api/bookings/segments?status=PENDING
// Get booking segments for Point Manager based on their location
export async function GET(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'booking:read')
  if (error) return error

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 50))

  // Handle NEEDS_ACTION as a special case - it's not a real status
  const isNeedsAction = status === 'NEEDS_ACTION'
  const isCancelled = status === 'CANCELLED'
  const actualStatus = (isNeedsAction || isCancelled) ? undefined : status

  try {
    // Get Point Manager's shop location
    const pmProfile = await prisma.pointManagerProfile.findUnique({
      where: { userId: session!.userId },
      select: { shopLocationId: true },
    })

    if (!pmProfile) {
      return NextResponse.json({ success: false, error: 'Point Manager profile not found' }, { status: 404 })
    }

    // Get route segments that start or end at PM's location
    const routeSegmentIds = await prisma.routeSegment.findMany({
      where: {
        OR: [
          { fromLocationId: pmProfile.shopLocationId },
          { toLocationId: pmProfile.shopLocationId },
        ],
      },
      select: { id: true, fromLocationId: true, toLocationId: true },
    })

    const segmentIds = routeSegmentIds.map((rs: any) => rs.id)

    // Get booking segments for these route segments
    // Filter logic: 
    // - If PM's location is fromLocation (source): show all statuses
    // - If PM's location is toLocation (destination): only show when segment is IN_TRANSIT or higher (captain assigned and on the way)
    const sourceSegmentIds = routeSegmentIds
      .filter((rs: any) => rs.fromLocationId === pmProfile.shopLocationId)
      .map((rs: any) => rs.id)
    const destSegmentIds = routeSegmentIds
      .filter((rs: any) => rs.toLocationId === pmProfile.shopLocationId)
      .map((rs: any) => rs.id)

    const allowedDestStatuses = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED']

    const where: any = {
      OR: []
    }

    // Source segments: show all (or filtered if status specified)
    if (sourceSegmentIds.length > 0) {
      if (isCancelled) {
        // CANCELLED is a booking status, not segment status
        where.OR.push({
          routeSegmentId: { in: sourceSegmentIds },
          booking: { status: 'CANCELLED' }
        })
      } else if (isNeedsAction) {
        // For NEEDS_ACTION, show PENDING and RECEIVED_AT_POINT
        where.OR.push({
          routeSegmentId: { in: sourceSegmentIds },
          status: { in: ['PENDING', 'RECEIVED_AT_POINT'] }
        })
      } else if (actualStatus) {
        where.OR.push({
          routeSegmentId: { in: sourceSegmentIds },
          status: actualStatus
        })
      } else {
        where.OR.push({
          routeSegmentId: { in: sourceSegmentIds }
        })
      }
    }

    // Destination segments: only show allowed statuses
    if (destSegmentIds.length > 0) {
      if (isCancelled) {
        // CANCELLED is a booking status, not segment status
        where.OR.push({
          routeSegmentId: { in: destSegmentIds },
          booking: { status: 'CANCELLED' }
        })
      } else if (isNeedsAction) {
        // For NEEDS_ACTION, only show RECEIVED_AT_POINT (since PENDING doesn't apply to destinations)
        where.OR.push({
          routeSegmentId: { in: destSegmentIds },
          status: 'RECEIVED_AT_POINT'
        })
      } else if (actualStatus) {
        // If status filter is applied, only show if it's in allowed list
        if (allowedDestStatuses.includes(actualStatus)) {
          where.OR.push({
            routeSegmentId: { in: destSegmentIds },
            status: actualStatus
          })
        }
      } else {
        // No filter: show all allowed statuses
        where.OR.push({
          routeSegmentId: { in: destSegmentIds },
          status: { in: allowedDestStatuses }
        })
      }
    }

    const [segments, segmentsTotal] = await Promise.all([
      prisma.bookingSegment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          sequenceOrder: true,
          status: true,
          codCollectedAt: true,
          vehicleType: true,
          handedOffAt: true,
          deliveredAt: true,
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              status: true,
              parcelWeight: true,
              parcelType: true,
              deliveryPriority: true,
              calculatedPrice: true,
              paymentStatus: true,
              paymentMethod: true,
              codCollectedAt: true,
              createdAt: true,
              paidAt: true,
              receiverName: true,
              receiverPhone: true,
              customer: {
                select: { id: true, name: true, phone: true },
              },
              segments: {
                orderBy: { sequenceOrder: 'asc' },
                select: {
                  id: true,
                  sequenceOrder: true,
                  status: true,
                  handedOffAt: true,
                  deliveredAt: true,
                  routeSegment: {
                    select: {
                      fromLocation: { select: { id: true, pointName: true } },
                      toLocation: { select: { id: true, pointName: true } },
                    },
                  },
                },
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
          captain: {
            select: { 
              id: true, 
              name: true, 
              phone: true,
              captainProfile: {
                select: { vehicleType: true, vehicleNumber: true }
              }
            },
          },
        },
        orderBy: [
          { bookingId: 'desc' },
          { sequenceOrder: 'asc' },
        ],
      }),
      prisma.bookingSegment.count({ where }),
    ])

    // Also get direct bookings (without segments) where PM's location is pickup or drop
    // Note: Not paginating direct bookings for simplicity - they're typically fewer
    // Apply same logic: destination only sees bookings when captain assigned, picked up, or in transit
    const directBookings = await prisma.booking.findMany({
      where: {
        segments: { none: {} },
        OR: [
          { pickupLocationId: pmProfile.shopLocationId },
          { 
            dropLocationId: pmProfile.shopLocationId,
            status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'] }
          },
        ],
      },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        parcelWeight: true,
        parcelType: true,
        deliveryPriority: true,
        calculatedPrice: true,
        paymentStatus: true,
        paymentMethod: true,
        codCollectedAt: true as any,
        vehicleType: true,
        customer: {
          select: { id: true, name: true, phone: true },
        },
        pickupLocation: {
          select: { id: true, pointName: true, village: true },
        },
        dropLocation: {
          select: { id: true, pointName: true, village: true },
        },
        captain: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Convert direct bookings to segment-like format for consistent UI
    // Map booking statuses to segment statuses for consistent filtering
    const statusMap: Record<string, string> = {
      PENDING: 'PENDING',
      CONFIRMED: 'PENDING',
      ASSIGNED: 'ASSIGNED',
      PICKED_UP: 'PICKED_UP',
      IN_TRANSIT: 'IN_TRANSIT',
      OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
      DELIVERED: 'DELIVERED',
      CANCELLED: 'CANCELLED',
    }

    const directSegments = directBookings.map((booking: any) => ({
      id: `direct-${booking.id}`,
      sequenceOrder: 1,
      status: statusMap[booking.status] || booking.status,
      codCollectedAt: booking.codCollectedAt,
      vehicleType: booking.vehicleType,
      booking: {
        ...booking,
        codCollectedAt: booking.codCollectedAt,
        segments: [],
      },
      routeSegment: {
        fromLocation: booking.pickupLocation,
        toLocation: booking.dropLocation,
      },
      pointManager: null,
      captain: booking.captain,
      pmRole: booking.dropLocation.id === pmProfile.shopLocationId ? 'INCOMING' : 'OUTGOING' as const,
    }))

    // Combine segments and direct bookings
    const allItems = [...segments, ...directSegments]

    // Annotate each segment with the PM's role at this stop
    const annotated = allItems.map((seg: any) => {
      const toLocationId = (seg.routeSegment as any).toLocationId || seg.routeSegment.toLocation.id
      return {
        ...seg,
        pmRole: toLocationId === pmProfile.shopLocationId ? 'INCOMING' : 'OUTGOING' as const,
      }
    })

    return NextResponse.json({ success: true, data: { items: annotated, total: segmentsTotal, page, pageSize } })
  } catch (err) {
    console.error('[BOOKINGS/SEGMENTS/GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
