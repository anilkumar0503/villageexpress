import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const updateSchema = z.object({
  selectedPoints: z.array(z.string().uuid()).min(1),
})

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/captains/[id]/points - Get captain's point assignments
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { error } = await requirePermission(req, 'user:read')
  if (error) return error

  const { id } = await params

  const captain = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      displayId: true,
      captainProfile: {
        select: {
          id: true,
          vehicleType: true,
          vehicleNumber: true,
          districtId: true,
          pointAssignments: {
            where: { isActive: true },
            select: {
              locationId: true,
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
      },
    },
  })

  if (!captain || !captain.captainProfile) {
    return NextResponse.json({ success: false, error: 'Captain not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: captain })
}

// PUT /api/captains/[id]/points - Update captain's point assignments
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { error } = await requirePermission(req, 'user:update')
  if (error) return error

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { selectedPoints } = parsed.data

    const captainProfile = await prisma.captainProfile.findUnique({
      where: { userId: id },
    })

    if (!captainProfile) {
      return NextResponse.json({ success: false, error: 'Captain profile not found' }, { status: 404 })
    }

    // Delete existing assignments
    await prisma.captainPointAssignment.deleteMany({
      where: { captainId: captainProfile.id },
    })

    // Create new assignments
    if (selectedPoints.length > 0) {
      await prisma.captainPointAssignment.createMany({
        data: selectedPoints.map((locationId: any) => ({
          captainId: captainProfile.id,
          locationId,
        })),
      })
    }

    return NextResponse.json({ success: true, message: 'Point assignments updated' })
  } catch (err) {
    console.error('[CAPTAINS/POINTS/PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
