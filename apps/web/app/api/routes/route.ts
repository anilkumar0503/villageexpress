import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const routeSchema = z.object({
  name: z.string().min(1),
  sourceLocationId: z.string().uuid(),
  destinationLocationId: z.string().uuid(),
  estimatedDays: z.number().int().min(1),
  isActive: z.boolean().optional(),
})

const segmentSchema = z.object({
  fromLocationId: z.string().uuid(),
  toLocationId: z.string().uuid(),
  distanceKm: z.number().positive(),
  estimatedHours: z.number().int().min(1),
})

const pricingRuleSchema = z.object({
  basePrice: z.number().positive(),
  pricePerKm: z.number().positive(),
  weightSurcharge: z.number().nonnegative().optional(),
  priority: z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT']).optional(),
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']).nullable().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/routes - List all routes
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sourceId = searchParams.get('sourceId')
    const destId = searchParams.get('destId')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where: any = {}
    if (sourceId) where.sourceLocationId = sourceId
    if (destId) where.destinationLocationId = destId
    if (activeOnly) where.isActive = true

    const routes = await prisma.route.findMany({
      where,
      include: {
        sourceLocation: true,
        destinationLocation: true,
        segments: {
          orderBy: { sequenceOrder: 'asc' },
          include: {
            fromLocation: true,
            toLocation: true,
          },
        },
        pricingRules: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: routes })
  } catch (err) {
    console.error('[ROUTES/GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/routes - Create new route
export async function POST(req: NextRequest) {
  try {
    const { error: permError, session } = await requirePermission(req, 'pricing:manage')
    if (permError) return permError

    const body = await req.json()
    const parsed = routeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { segments, pricingRules, ...routeData } = body

    const route = await prisma.route.create({
      data: {
        ...routeData,
        segments: {
          create: segments?.map((seg: any, idx: number) => ({
            ...seg,
            sequenceOrder: idx + 1,
          })) || [],
        },
        pricingRules: {
          create: pricingRules?.map((rule: any) => ({
            ...rule,
            priority: rule.priority || 'STANDARD',
            isActive: rule.isActive !== false,
          })) || [],
        },
      },
      include: {
        sourceLocation: true,
        destinationLocation: true,
        segments: {
          orderBy: { sequenceOrder: 'asc' },
          include: {
            fromLocation: true,
            toLocation: true,
          },
        },
        pricingRules: true,
      },
    })

    return NextResponse.json({ success: true, data: route }, { status: 201 })
  } catch (err) {
    console.error('[ROUTES/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
