import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

// GET /api/captains?locationId=xxx - List captains by point
export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, 'user:read')
  if (error) return error

  const { searchParams } = req.nextUrl
  const locationId = searchParams.get('locationId') ?? undefined
  const availabilityStatus = searchParams.get('availabilityStatus') ?? undefined

  if (!locationId) {
    return NextResponse.json({ success: false, error: 'locationId is required' }, { status: 400 })
  }

  const where: any = {
    pointAssignments: {
      some: {
        locationId,
        isActive: true,
      },
    },
  }

  if (availabilityStatus) {
    where.availabilityStatus = availabilityStatus
  }

  const captains = await prisma.captainProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          displayId: true,
          name: true,
          phone: true,
          email: true,
          approvalStatus: true,
          isActive: true,
        },
      },
      pointAssignments: {
        where: { isActive: true },
        include: {
          location: {
            select: {
              id: true,
              pointName: true,
              village: true,
              district: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: captains })
}
