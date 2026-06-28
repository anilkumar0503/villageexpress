import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@ve/db'
import { generateDisplayId } from '@ve/utils'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10).max(10),
  password: z.string().min(8),
  shopName: z.string().min(2),
  location: z.object({
    pointName: z.string().min(2),
    village: z.string().min(2),
    district: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(6).max(6),
  }),
  shopPhoto: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { name, email, phone, password, shopName, location, shopPhoto } = parsed.data

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email or phone already registered' },
        { status: 409 },
      )
    }

    // Check if location already exists
    const existingLocation = await prisma.location.findFirst({
      where: {
        pointName: location.pointName,
        village: location.village,
        district: location.district,
      },
    })
    if (existingLocation) {
      return NextResponse.json(
        { success: false, error: 'A location with this name already exists in this village' },
        { status: 409 },
      )
    }

    const pmRole = await prisma.role.findUnique({ where: { name: 'POINT_MANAGER' } })
    const count = await prisma.user.count()
    const displayId = generateDisplayId('POINT_MANAGER', count + 1)
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new location
    const newLocation = await prisma.location.create({
      data: {
        pointName: location.pointName,
        village: location.village,
        district: location.district,
        state: location.state,
        pincode: location.pincode,
        latitude: 0,
        longitude: 0,
        locationType: 'POINT',
        isActive: false, // Will be activated after approval
      },
    })

    const user = await prisma.user.create({
      data: {
        displayId,
        name,
        email,
        phone,
        password: hashedPassword,
        approvalStatus: 'PENDING',
        isActive: false,
        userRoles: pmRole
          ? { create: { roleId: pmRole.id, isPrimary: true } }
          : undefined,
        pointManagerProfile: {
          create: { shopName, shopLocationId: newLocation.id, shopPhoto },
        },
      },
      include: { pointManagerProfile: true },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Registration submitted. You will be notified once approved.',
        data: { id: user.id, displayId: user.displayId },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[REGISTER/PM]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
