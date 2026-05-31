import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

const resubmitSchema = z.object({
  documentType: z.enum(['AADHAAR', 'LICENSE']),
  documentNumber: z.string().optional(),
  documentPhoto: z.string().url().optional(),
})

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  try {
    const body = await req.json()
    const parsed = resubmitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { documentType, documentNumber, documentPhoto } = parsed.data

    const captain = await prisma.captainProfile.findUnique({
      where: { userId: session!.userId },
    })

    if (!captain) {
      return NextResponse.json({ success: false, error: 'Captain profile not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (documentType === 'AADHAAR') {
      if (documentNumber) updateData.aadhaarNumber = documentNumber
      if (documentPhoto) updateData.aadhaarPhoto = documentPhoto
      updateData.aadhaarVerificationStatus = 'PENDING'
      updateData.aadhaarRejectionReason = null
    } else if (documentType === 'LICENSE') {
      if (documentNumber) updateData.drivingLicense = documentNumber
      if (documentPhoto) updateData.licensePhoto = documentPhoto
      updateData.licenseVerificationStatus = 'PENDING'
      updateData.licenseRejectionReason = null
    }

    const updated = await prisma.captainProfile.update({
      where: { userId: session!.userId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('[PROFILE/KYC/RESUBMIT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
