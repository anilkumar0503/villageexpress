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
  aadhaarNumber: z.string().length(12),
  aadhaarPhoto: z.string().url().optional(),
  drivingLicense: z.string().min(5),
  licensePhoto: z.string().url().optional(),
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']),
  vehicleNumber: z.string().min(4),
  districtIds: z.array(z.string().min(2)).min(1),
  selectedPoints: z.array(z.string().uuid()).min(1),
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

    const {
      name, email, phone, password,
      aadhaarNumber, aadhaarPhoto,
      drivingLicense, licensePhoto,
      vehicleType, vehicleNumber, districtIds,
      selectedPoints,
    } = parsed.data

    // Use the first district as the primary district
    const districtId = districtIds[0]

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email or phone already registered' },
        { status: 409 },
      )
    }

    const captainRole = await prisma.role.findUnique({ where: { name: 'CAPTAIN' } })
    const count = await prisma.user.count()
    const displayId = generateDisplayId('CAPTAIN', count + 1)
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        displayId,
        name,
        email,
        phone,
        password: hashedPassword,
        approvalStatus: 'PENDING',
        isActive: false,
        userRoles: captainRole
          ? { create: { roleId: captainRole.id, isPrimary: true } }
          : undefined,
        captainProfile: {
          create: {
            aadhaarNumber,
            aadhaarPhoto,
            drivingLicense,
            licensePhoto,
            vehicleType,
            vehicleNumber,
            districtId,
            availabilityStatus: 'OFF_DUTY',
            pointAssignments: {
              create: selectedPoints.map((locationId) => ({ locationId })),
            },
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'KYC submitted. You will be notified once your documents are verified.',
        data: { id: user.id, displayId: user.displayId },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[REGISTER/CAPTAIN]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
