import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'
import { DEFAULT_WORKING_HOURS } from '@/lib/working-hours'

const dayScheduleSchema = z.object({
  isOpen: z.boolean(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
})

const workingHoursSchema = z.object({
  monday:    dayScheduleSchema,
  tuesday:   dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday:  dayScheduleSchema,
  friday:    dayScheduleSchema,
  saturday:  dayScheduleSchema,
  sunday:    dayScheduleSchema,
})

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const profile = await prisma.pointManagerProfile.findUnique({
    where: { userId: session!.userId },
    // @ts-ignore - workingHours exists in DB but TypeScript needs client regeneration
    select: { workingHours: true },
  })

  // @ts-ignore - workingHours exists in DB but TypeScript needs client regeneration
  const workingHours = (profile?.workingHours as any) ?? DEFAULT_WORKING_HOURS

  return NextResponse.json({ success: true, data: workingHours, profileExists: !!profile })
}

export async function PUT(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const body = await req.json()
  const parsed = workingHoursSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid working hours', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const profile = await prisma.pointManagerProfile.findUnique({
    where: { userId: session!.userId },
  })

  if (!profile) {
    return NextResponse.json({ success: false, error: 'Point manager profile not found' }, { status: 404 })
  }

  const updated = await prisma.pointManagerProfile.update({
    where: { userId: session!.userId },
    // @ts-ignore - workingHours exists in DB but TypeScript needs client regeneration
    data: { workingHours: parsed.data },
    // @ts-ignore - workingHours exists in DB but TypeScript needs client regeneration
    select: { workingHours: true },
  })

  // @ts-ignore - workingHours exists in DB but TypeScript needs client regeneration
  return NextResponse.json({ success: true, data: updated.workingHours })
}
