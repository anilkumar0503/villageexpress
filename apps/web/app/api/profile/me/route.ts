import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).max(10).optional(),
  email: z.string().email().optional().or(z.literal('')),
  profilePhoto: z.string().url().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']).optional(),
  vehicleNumber: z.string().optional(),
  shopName: z.string().min(2).optional(),
  shopPhoto: z.string().optional(),
  selectedPoints: z.array(z.string().uuid()).optional(),
  districtId: z.string().optional(),
}).refine(
  (data) => !(data.newPassword && !data.currentPassword),
  { message: 'Current password is required to set a new password', path: ['currentPassword'] },
)

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const user = await prisma.user.findUnique({
    where: { id: session!.userId },
    select: {
      id: true,
      displayId: true,
      name: true,
      email: true,
      phone: true,
      approvalStatus: true,
      isActive: true,
      createdAt: true,
      userRoles: {
        select: {
          isPrimary: true,
          role: { select: { name: true, level: true } },
        },
      },
      pointManagerProfile: {
        select: { shopName: true, shopPhoto: true, shopLocation: { select: { pointName: true, village: true, district: true } } },
      },
      captainProfile: {
        select: {
          vehicleType: true,
          vehicleNumber: true,
          availabilityStatus: true,
          districtId: true,
          pointAssignments: {
            where: { isActive: true },
            select: {
              locationId: true,
              location: { select: { pointName: true, village: true, district: true } },
            },
          },
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: user })
}

export async function PUT(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { name, phone, email, profilePhoto, currentPassword, newPassword, vehicleType, vehicleNumber, shopName, shopPhoto, selectedPoints, districtId } = parsed.data

    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (email !== undefined) updateData.email = email || null
    if (profilePhoto) updateData.profilePhoto = profilePhoto

    if (newPassword && currentPassword) {
      const existing = await prisma.user.findUnique({ where: { id: session!.userId } })
      if (!existing?.password) {
        return NextResponse.json(
          { success: false, error: 'Password change not supported for OTP accounts' },
          { status: 400 },
        )
      }
      const match = await bcrypt.compare(currentPassword, existing.password)
      if (!match) {
        return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 })
      }
      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    const user = await prisma.user.update({
      where: { id: session!.userId },
      data: updateData,
      select: { id: true, displayId: true, name: true, email: true, phone: true },
    })

    if (vehicleType || vehicleNumber || selectedPoints || districtId) {
      const captainProfile = await prisma.captainProfile.findUnique({
        where: { userId: session!.userId },
      })

      if (captainProfile) {
        const updateData: any = {}
        if (vehicleType) updateData.vehicleType = vehicleType
        if (vehicleNumber) updateData.vehicleNumber = vehicleNumber
        if (districtId) updateData.districtId = districtId

        await prisma.captainProfile.update({
          where: { userId: session!.userId },
          data: updateData,
        })

        // Update point assignments if provided
        if (selectedPoints) {
          // Delete existing assignments
          await prisma.captainPointAssignment.deleteMany({
            where: { captainId: captainProfile.id },
          })

          // Create new assignments
          if (selectedPoints.length > 0) {
            await prisma.captainPointAssignment.createMany({
              data: selectedPoints.map((locationId) => ({
                captainId: captainProfile.id,
                locationId,
              })),
            })
          }
        }
      }
    }

    if (shopName || shopPhoto) {
      await prisma.pointManagerProfile.updateMany({
        where: { userId: session!.userId },
        data: {
          ...(shopName && { shopName }),
          ...(shopPhoto && { shopPhoto }),
        },
      })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (err) {
    console.error('[PROFILE/ME/PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
