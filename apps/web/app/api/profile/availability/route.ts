import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

const schema = z.object({
  availabilityStatus: z.enum(['AVAILABLE', 'BUSY', 'OFF_DUTY']),
})

export async function PUT(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
  }

  const profile = await prisma.captainProfile.findUnique({ where: { userId: session!.userId } })
  if (!profile) {
    return NextResponse.json({ success: false, error: 'Captain profile not found' }, { status: 404 })
  }

  if (profile.availabilityStatus === 'BUSY') {
    return NextResponse.json(
      { success: false, error: 'Cannot change availability while assigned to an active booking' },
      { status: 409 },
    )
  }

  const updated = await prisma.captainProfile.update({
    where: { userId: session!.userId },
    data: { availabilityStatus: parsed.data.availabilityStatus },
  })

  return NextResponse.json({ success: true, data: { availabilityStatus: updated.availabilityStatus } })
}
