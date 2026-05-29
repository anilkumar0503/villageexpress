import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

// PUT /api/commissions/[id]/approve - Approve a commission entry
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { error: permissionError } = await requirePermission(req, 'commission:approve')
  if (permissionError) return permissionError

  const { id } = await params

  const commission = await prisma.commissionLedger.findUnique({
    where: { id },
  })

  if (!commission) {
    return NextResponse.json({ success: false, error: 'Commission entry not found' }, { status: 404 })
  }

  if (commission.status !== 'PENDING') {
    return NextResponse.json({ success: false, error: 'Only pending commissions can be approved' }, { status: 400 })
  }

  const updated = await prisma.commissionLedger.update({
    where: { id },
    data: { status: 'APPROVED' },
  })

  return NextResponse.json({ success: true, data: updated })
}
