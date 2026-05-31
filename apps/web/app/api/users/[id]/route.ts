import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'
import { sendAccountSuspendedEmail } from '@/lib/email'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(10).optional(),
  isActive: z.boolean().optional(),
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']).optional(),
  vehicleNumber: z.string().min(4).optional(),
  districtIds: z.array(z.string()).optional(),
  selectedPoints: z.array(z.string().uuid()).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { error } = await requirePermission(req, 'user:read')
  if (error) return error

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayId: true,
      name: true,
      email: true,
      phone: true,
      approvalStatus: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      userRoles: {
        select: {
          isPrimary: true,
          role: { select: { id: true, name: true, level: true } },
          assignedLocation: { select: { id: true, pointName: true, village: true } },
        },
      },
      pointManagerProfile: true,
      captainProfile: true,
    },
  })

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: user })
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'user:update')
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

    const { vehicleType, vehicleNumber, districtIds, selectedPoints, ...userData } = parsed.data

    // Update basic user data
    const user = await prisma.user.update({
      where: { id },
      data: userData,
      select: { id: true, displayId: true, name: true, email: true, phone: true, isActive: true },
    })

    // Send suspension email if account is being deactivated
    if (userData.isActive === false && user.email) {
      await sendAccountSuspendedEmail(user.email, user.name, 'Account deactivated by admin')
    }

    // Update captain profile if captain-specific fields are provided
    if (vehicleType || vehicleNumber || districtIds || selectedPoints) {
      const captainProfile = await prisma.captainProfile.findUnique({
        where: { userId: id },
      })

      if (captainProfile) {
        const captainUpdateData: any = {}
        if (vehicleType) captainUpdateData.vehicleType = vehicleType
        if (vehicleNumber) captainUpdateData.vehicleNumber = vehicleNumber
        if (districtIds && districtIds.length > 0) {
          captainUpdateData.districtId = districtIds[0]
          // Note: districtIds would need to be stored in a separate table if we want full multi-district support
        }

        console.log('[USERS/PUT] Updating captain profile:', captainUpdateData)
        await prisma.captainProfile.update({
          where: { userId: id },
          data: captainUpdateData,
        })

        // Update point assignments if provided
        if (selectedPoints && selectedPoints.length > 0) {
          console.log('[USERS/PUT] Updating point assignments:', selectedPoints)
          // Delete existing point assignments
          await prisma.captainPointAssignment.deleteMany({
            where: { captainId: captainProfile.id },
          })

          // Create new point assignments
          await prisma.captainPointAssignment.createMany({
            data: selectedPoints.map((locationId) => ({
              captainId: captainProfile.id,
              locationId,
            })),
          })
          console.log('[USERS/PUT] Point assignments updated successfully')
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'UPDATE',
        resource: `user:${id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: user })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }
    console.error('[USERS/PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'user:delete')
  if (error) return error

  const { id } = await params

  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'DEACTIVATE',
        resource: `user:${id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, message: 'User deactivated' })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }
    console.error('[USERS/DELETE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
