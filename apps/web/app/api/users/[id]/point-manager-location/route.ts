import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'
import { prisma } from '@ve/db'

const schema = z.object({
  shopLocationId: z.string().uuid(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error: authError } = await requirePermission(req, 'user:update')
  if (authError) return authError

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { shopLocationId } = parsed.data
    const { id: userId } = await params

    // Check if user exists and is a Point Manager
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pointManagerProfile: true, userRoles: { include: { role: true } } },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const isPointManager = user.userRoles.some((ur) => ur.role.name === 'POINT_MANAGER')
    if (!isPointManager) {
      return NextResponse.json({ success: false, error: 'User is not a Point Manager' }, { status: 400 })
    }

    // Check if the new location exists
    const location = await prisma.location.findUnique({
      where: { id: shopLocationId },
    })

    if (!location) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 })
    }

    // Update the Point Manager's shop location
    await prisma.pointManagerProfile.update({
      where: { userId },
      data: { shopLocationId },
    })

    return NextResponse.json({ success: true, message: 'Location updated successfully' })
  } catch (err) {
    console.error('[PM_LOCATION_UPDATE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
