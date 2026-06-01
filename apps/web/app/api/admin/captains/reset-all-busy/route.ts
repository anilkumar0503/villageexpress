import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'admin:manage_captains')
  if (error) return error

  try {
    // Get all busy captains
    const busyCaptains = await prisma.captainProfile.findMany({
      where: { availabilityStatus: 'BUSY' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayId: true,
          },
        },
      },
    })

    if (busyCaptains.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No busy captains found',
        data: { resetCount: 0, captains: [] },
      })
    }

    // Reset all to AVAILABLE
    const result = await prisma.captainProfile.updateMany({
      where: { availabilityStatus: 'BUSY' },
      data: { availabilityStatus: 'AVAILABLE' },
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'BULK_RESET_CAPTAIN_AVAILABILITY',
        resource: 'captains:all',
        result: 'GRANTED',
      },
    })

    return NextResponse.json({
      success: true,
      message: `Reset ${result.count} captains to AVAILABLE`,
      data: {
        resetCount: result.count,
        captains: busyCaptains.map((c: any) => ({
          id: c.user.id,
          displayId: c.user.displayId,
          name: c.user.name,
        })),
      },
    })
  } catch (err) {
    console.error('[ADMIN/CAPTAINS/RESET-ALL-BUSY]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
