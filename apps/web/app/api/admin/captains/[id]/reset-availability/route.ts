import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'admin:manage_captains')
  if (error) return error

  const { id } = await params

  try {
    const captain = await prisma.user.findUnique({
      where: { id },
      include: {
        captainProfile: true,
      },
    })

    if (!captain || !captain.captainProfile) {
      return NextResponse.json({ success: false, error: 'Captain not found' }, { status: 404 })
    }

    const updated = await prisma.captainProfile.update({
      where: { userId: id },
      data: { availabilityStatus: 'AVAILABLE' },
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'RESET_CAPTAIN_AVAILABILITY',
        resource: `captain:${id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({
      success: true,
      data: { availabilityStatus: updated.availabilityStatus },
      message: 'Captain availability reset to AVAILABLE'
    })
  } catch (err) {
    console.error('[ADMIN/CAPTAINS/RESET-AVAILABILITY]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
