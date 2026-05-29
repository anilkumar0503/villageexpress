import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requireAnyRole } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { error: permissionError } = await requireAnyRole(req, ['ADMIN', 'SUPER_ADMIN'])
  if (permissionError) return permissionError

  const settings = await prisma.adminPaymentSettings.findFirst({
    where: { isActive: true },
  })

  return NextResponse.json({
    success: true,
    data: settings,
  })
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { error: permissionError } = await requireAnyRole(req, ['ADMIN', 'SUPER_ADMIN'])
  if (permissionError) return permissionError

  const body = await req.json()
  const { bankName, accountNumber, ifscCode, accountHolderName, upiId, qrCodeUrl } = body

  const existing = await prisma.adminPaymentSettings.findFirst()

  if (existing) {
    const updated = await prisma.adminPaymentSettings.update({
      where: { id: existing.id },
      data: {
        bankName,
        accountNumber,
        ifscCode,
        accountHolderName,
        upiId,
        qrCodeUrl,
      },
    })
    return NextResponse.json({ success: true, data: updated })
  } else {
    const created = await prisma.adminPaymentSettings.create({
      data: {
        bankName,
        accountNumber,
        ifscCode,
        accountHolderName,
        upiId,
        qrCodeUrl,
      },
    })
    return NextResponse.json({ success: true, data: created })
  }
}
