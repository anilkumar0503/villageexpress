import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  vehicleConfigId: z.string().uuid(),
  minDistance: z.number().nonnegative(),
  maxDistance: z.number().positive(),
  pricePerKm: z.number().positive(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
})

const updateSchema = z.object({
  minDistance: z.number().nonnegative().optional(),
  maxDistance: z.number().positive().optional(),
  pricePerKm: z.number().positive().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'settings:manage')
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const tier = await prisma.distancePricingTier.create({
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'CREATE',
        resource: `distance-pricing-tier:${tier.id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: tier }, { status: 201 })
  } catch (err) {
    console.error('[DISTANCE_PRICING_TIERS/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
