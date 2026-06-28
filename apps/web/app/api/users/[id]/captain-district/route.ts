import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'
import { prisma } from '@ve/db'

const schema = z.object({
  districtId: z.string(),
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

    const { districtId } = parsed.data
    const { id: userId } = await params

    // Check if user exists and is a Captain
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { captainProfile: true, userRoles: { include: { role: true } } },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const isCaptain = user.userRoles.some((ur) => ur.role.name === 'CAPTAIN')
    if (!isCaptain) {
      return NextResponse.json({ success: false, error: 'User is not a Captain' }, { status: 400 })
    }

    // Update the Captain's district
    await prisma.captainProfile.update({
      where: { userId },
      data: { districtId },
    })

    return NextResponse.json({ success: true, message: 'District updated successfully' })
  } catch (err) {
    console.error('[CAPTAIN_DISTRICT_UPDATE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
