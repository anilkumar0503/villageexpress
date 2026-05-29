import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { searchParams } = req.nextUrl
  const districtId = searchParams.get('districtId')
  const vehicleType = searchParams.get('vehicleType') ?? undefined

  // If districtId not provided, get it from PM's shop location
  let targetDistrictId: string | null = districtId
  if (!targetDistrictId) {
    const pmProfile = await prisma.pointManagerProfile.findUnique({
      where: { userId: session!.userId },
      select: { shopLocation: { select: { district: true } } },
    })
    targetDistrictId = pmProfile?.shopLocation?.district ?? null
  }

  console.log('[CAPTAINS/AVAILABLE] PM district:', targetDistrictId)

  const where: any = {
    isActive: true,
    approvalStatus: 'APPROVED',
    userRoles: {
      some: {
        role: { name: 'CAPTAIN' },
      },
    },
    captainProfile: {
      availabilityStatus: 'AVAILABLE',
      ...(vehicleType && { vehicleType }),
    },
  }

  // Filter by district: check if captain has points in the target district
  // Captains can have multiple districts through point assignments
  if (targetDistrictId) {
    where.captainProfile = {
      ...where.captainProfile,
      pointAssignments: {
        some: {
          location: {
            district: targetDistrictId,
          },
          isActive: true,
        },
      },
    }
  }

  console.log('[CAPTAINS/AVAILABLE] Query where:', JSON.stringify(where, null, 2))

  // Also fetch all captains without filters for debugging
  const allCaptains = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: { name: 'CAPTAIN' },
        },
      },
    },
    select: {
      id: true,
      displayId: true,
      name: true,
      phone: true,
      isActive: true,
      approvalStatus: true,
      captainProfile: {
        select: {
          vehicleType: true,
          vehicleNumber: true,
          availabilityStatus: true,
          districtId: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  console.log('[CAPTAINS/AVAILABLE] All captains in DB:', allCaptains.length)
  allCaptains.forEach(c => {
    console.log(`- ${c.displayId} ${c.name} (active: ${c.isActive}, approved: ${c.approvalStatus}, district: ${c.captainProfile?.districtId}, availability: ${c.captainProfile?.availabilityStatus})`)
  })

  const captains = await prisma.user.findMany({
    where,
    select: {
      id: true,
      displayId: true,
      name: true,
      phone: true,
      captainProfile: {
        select: {
          vehicleType: true,
          vehicleNumber: true,
          availabilityStatus: true,
          districtId: true,
          pointAssignments: {
            where: { isActive: true },
            select: {
              location: {
                select: { district: true },
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  console.log('[CAPTAINS/AVAILABLE] Found captains:', captains.length)
  captains.forEach(c => {
    const districts = [...new Set(c.captainProfile?.pointAssignments?.map(pa => pa.location.district) || [])]
    console.log(`- ${c.displayId} ${c.name} (primary district: ${c.captainProfile?.districtId}, operating districts: [${districts.join(', ')}], availability: ${c.captainProfile?.availabilityStatus})`)
  })

  return NextResponse.json({
    success: true,
    data: captains,
  })
}
