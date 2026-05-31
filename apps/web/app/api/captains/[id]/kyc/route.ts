import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'
import { sendDocumentRejectionEmail } from '@/lib/email'

const kycSchema = z.object({
  documentType: z.enum(['AADHAAR', 'LICENSE']),
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'user:approve')
  if (error) return error

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = kycSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { documentType, status, rejectionReason } = parsed.data

    const captain = await prisma.captainProfile.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!captain) {
      return NextResponse.json({ success: false, error: 'Captain not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (documentType === 'AADHAAR') {
      updateData.aadhaarVerificationStatus = status
      updateData.aadhaarRejectionReason = status === 'REJECTED' ? rejectionReason : null
    } else if (documentType === 'LICENSE') {
      updateData.licenseVerificationStatus = status
      updateData.licenseRejectionReason = status === 'REJECTED' ? rejectionReason : null
    }

    const updated = await prisma.captainProfile.update({
      where: { id },
      data: updateData,
    })

    // Send rejection email if document is rejected
    if (status === 'REJECTED' && rejectionReason && captain.user.email) {
      await sendDocumentRejectionEmail(
        captain.user.email,
        captain.user.name,
        documentType === 'AADHAAR' ? 'Aadhaar Card' : 'Driving License',
        rejectionReason,
      )
    }

    // Check if both documents are verified, then auto-approve the user
    if (captain.aadhaarVerificationStatus === 'VERIFIED' && captain.licenseVerificationStatus === 'VERIFIED') {
      await prisma.user.update({
        where: { id: captain.userId },
        data: { approvalStatus: 'APPROVED', isActive: true },
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: `KYC_${documentType}_${status}`,
        resource: `captain:${id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('[CAPTAINS/KYC]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
