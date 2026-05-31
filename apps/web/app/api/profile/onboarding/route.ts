import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

const onboardingSchema = z.object({
  aadhaarNumber: z.string().min(12).max(12),
  aadhaarFileUrl: z.string().optional(),
  drivingLicense: z.string().min(1),
  licenseFileUrl: z.string().optional(),
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']),
  vehicleNumber: z.string().min(1),
  districtIds: z.array(z.string()).min(1),
  selectedPoints: z.array(z.string()).min(1),
})

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  try {
    const body = await req.json()
    const parsed = onboardingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { aadhaarNumber, aadhaarFileUrl, drivingLicense, licenseFileUrl, vehicleType, vehicleNumber, districtIds, selectedPoints } = parsed.data

    // Check if captain profile exists
    let captainProfile = await prisma.captainProfile.findUnique({
      where: { userId: session!.userId },
    })

    if (!captainProfile) {
      // Create captain profile
      captainProfile = await prisma.captainProfile.create({
        data: {
          userId: session!.userId,
          aadhaarNumber,
          aadhaarPhoto: aadhaarFileUrl,
          drivingLicense,
          licensePhoto: licenseFileUrl,
          vehicleType,
          vehicleNumber,
          districtId: districtIds[0], // Use first district as primary
          // @ts-ignore - onboardingStatus field exists in DB but TypeScript needs client regeneration
          onboardingStatus: 'IN_PROGRESS',
        },
      })
    } else {
      // Update existing captain profile
      captainProfile = await prisma.captainProfile.update({
        where: { userId: session!.userId },
        data: {
          aadhaarNumber,
          aadhaarPhoto: aadhaarFileUrl,
          drivingLicense,
          licensePhoto: licenseFileUrl,
          vehicleType,
          vehicleNumber,
          districtId: districtIds[0],
          // @ts-ignore - onboardingStatus field exists in DB but TypeScript needs client regeneration
          onboardingStatus: 'IN_PROGRESS',
        },
      })
    }

    // Create point assignments
    await prisma.captainPointAssignment.deleteMany({
      where: { captainId: captainProfile.id },
    })

    await prisma.captainPointAssignment.createMany({
      data: selectedPoints.map((pointId) => ({
        captainId: captainProfile.id,
        locationId: pointId,
      })),
    })

    // Update onboarding status to completed
    await prisma.captainProfile.update({
      where: { id: captainProfile.id },
      // @ts-ignore - onboardingStatus field exists in DB but TypeScript needs client regeneration
      data: { onboardingStatus: 'COMPLETED' },
    })

    return NextResponse.json({ success: true, data: captainProfile })
  } catch (err) {
    console.error('[PROFILE/ONBOARDING]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
