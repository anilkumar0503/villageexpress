import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  routeId: z.string().uuid(),
  basePrice: z.number().nonnegative(),
  pricePerKm: z.number().nonnegative(),
  weightSurcharge: z.number().default(0),
  priority: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT']).default('STANDARD'),
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']).nullable().optional(),
  isActive: z.boolean().default(true),
})

// POST /api/route-pricing-rules - Add pricing rule to existing route
// Note: Uses create instead of upsert until unique constraint migration is applied
export async function POST(req: NextRequest) {
  const { error } = await requirePermission(req, 'pricing:manage')
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const rule = await prisma.routePricingRule.create({
      data: {
        routeId: parsed.data.routeId,
        basePrice: parsed.data.basePrice,
        pricePerKm: parsed.data.pricePerKm,
        weightSurcharge: parsed.data.weightSurcharge,
        priority: parsed.data.priority,
        vehicleType: parsed.data.vehicleType,
        isActive: parsed.data.isActive,
      },
    })

    return NextResponse.json({ success: true, data: rule }, { status: 201 })
  } catch (err) {
    console.error('[ROUTE-PRICING-RULES/POST]', err)
    if ((err as any)?.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A pricing rule with the same route, priority, and vehicle type already exists.' },
        { status: 409 },
      )
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
