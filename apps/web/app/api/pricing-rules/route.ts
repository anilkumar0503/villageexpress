import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  sourceLocationId: z.string().uuid().nullable().optional(),
  destinationLocationId: z.string().uuid().nullable().optional(),
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']).nullable().optional(),
  deliveryPriority: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT']).default('STANDARD'),
  basePrice: z.number().positive(),
  pricePerKm: z.number().positive(),
  weightSurcharge: z.number().default(0),
  estimatedDeliveryDays: z.number().int().positive().default(3),
})

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  const rules = await prisma.pricingRule.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      sourceLocation: { select: { pointName: true, village: true, district: true } },
      destinationLocation: { select: { pointName: true, village: true, district: true } },
    },
  })

  return NextResponse.json({ success: true, data: rules })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'pricing:manage')
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

    // Check for duplicate global rule (no source/destination) with same vehicle type and delivery priority
    if (!parsed.data.sourceLocationId && !parsed.data.destinationLocationId) {
      const existingGlobalRule = await prisma.pricingRule.findFirst({
        where: {
          sourceLocationId: null,
          destinationLocationId: null,
          vehicleType: parsed.data.vehicleType ?? null,
          deliveryPriority: parsed.data.deliveryPriority,
        },
      })
      if (existingGlobalRule) {
        return NextResponse.json(
          { success: false, error: 'A global rule for this vehicle type and delivery priority already exists' },
          { status: 400 },
        )
      }
    }

    const rule = await prisma.pricingRule.create({
      data: {
        sourceLocationId: parsed.data.sourceLocationId ?? null,
        destinationLocationId: parsed.data.destinationLocationId ?? null,
        vehicleType: parsed.data.vehicleType ?? null,
        deliveryPriority: parsed.data.deliveryPriority,
        basePrice: parsed.data.basePrice,
        pricePerKm: parsed.data.pricePerKm,
        weightSurcharge: parsed.data.weightSurcharge,
        estimatedDeliveryDays: parsed.data.estimatedDeliveryDays,
      },
    })

    await prisma.auditLog.create({
      data: { userId: session!.userId, action: 'CREATE', resource: `pricing_rule:${rule.id}`, result: 'GRANTED' },
    })

    return NextResponse.json({ success: true, data: rule }, { status: 201 })
  } catch (err) {
    console.error('[PRICING-RULES/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
