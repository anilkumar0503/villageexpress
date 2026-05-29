import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

// GET /api/routes/available?pickupLocationId=xxx&dropLocationId=xxx
// Get available routes for customer based on pickup and drop locations
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { searchParams } = req.nextUrl
  const pickupLocationId = searchParams.get('pickupLocationId')
  const dropLocationId = searchParams.get('dropLocationId')

  if (!pickupLocationId || !dropLocationId) {
    return NextResponse.json(
      { success: false, error: 'pickupLocationId and dropLocationId are required' },
      { status: 400 }
    )
  }

  try {
    const routes = await prisma.route.findMany({
      where: {
        sourceLocationId: pickupLocationId,
        destinationLocationId: dropLocationId,
        isActive: true,
      },
      include: {
        sourceLocation: {
          select: { id: true, pointName: true, village: true, district: true },
        },
        destinationLocation: {
          select: { id: true, pointName: true, village: true, district: true },
        },
        segments: {
          orderBy: { sequenceOrder: 'asc' },
          include: {
            fromLocation: {
              select: { id: true, pointName: true, village: true },
            },
            toLocation: {
              select: { id: true, pointName: true, village: true },
            },
          },
        },
        pricingRules: {
          where: { isActive: true },
        },
      },
      orderBy: { estimatedDays: 'asc' },
    })

    // Calculate total distance for each route
    const routesWithDistance = routes.map((route) => {
      const totalDistance = route.segments.reduce((sum, seg) => sum + Number(seg.distanceKm), 0)
      return {
        ...route,
        totalDistance,
      }
    })

    return NextResponse.json({ success: true, data: routesWithDistance })
  } catch (err) {
    console.error('[ROUTES/AVAILABLE/GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
