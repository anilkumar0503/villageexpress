import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  routeSegmentId: z.string().uuid().optional(),
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']).nullable().optional(),
  captainCommissionPct: z.number().min(0).max(100),
  pmCommissionPct: z.number().min(0).max(100),
  isActive: z.boolean().default(true),
})

// GET /api/commission-rules?routeSegmentId=xxx&global=true
export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, 'booking:read')
  if (error) return error

  const { searchParams } = req.nextUrl
  const routeSegmentId = searchParams.get('routeSegmentId') ?? undefined
  const routeId = searchParams.get('routeId') ?? undefined
  const isGlobal = searchParams.get('global') === 'true'

  if (isGlobal) {
    const rules = await prisma.globalCommissionRule.findMany({
      orderBy: [{ vehicleType: 'asc' }],
    })
    return NextResponse.json({ success: true, data: rules })
  }

  const where: any = {}
  if (routeSegmentId) where.routeSegmentId = routeSegmentId
  if (routeId) {
    where.routeSegment = { routeId }
  }

  const rules = await prisma.routeCommissionRule.findMany({
    where,
    include: {
      routeSegment: {
        include: {
          fromLocation: { select: { id: true, pointName: true } },
          toLocation: { select: { id: true, pointName: true } },
        },
      },
    },
    orderBy: [{ routeSegmentId: 'asc' }, { vehicleType: 'asc' }],
  })

  return NextResponse.json({ success: true, data: rules })
}

// POST /api/commission-rules
export async function POST(req: NextRequest) {
  const { error } = await requirePermission(req, 'booking:create')
  if (error) return error

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { routeSegmentId, vehicleType, captainCommissionPct, pmCommissionPct, isActive } = parsed.data

    // If no routeSegmentId, create global rule
    if (!routeSegmentId) {
      // Find existing rule by vehicleType
      const existingRule = await prisma.globalCommissionRule.findFirst({
        where: {
          vehicleType: vehicleType ?? null,
        },
      })

      if (existingRule) {
        const rule = await prisma.globalCommissionRule.update({
          where: { id: existingRule.id },
          data: { captainCommissionPct, pmCommissionPct, isActive },
        })
        return NextResponse.json({ success: true, data: rule }, { status: 200 })
      }

      const rule = await prisma.globalCommissionRule.create({
        data: { vehicleType: vehicleType ?? null, captainCommissionPct, pmCommissionPct, isActive },
      })
      return NextResponse.json({ success: true, data: rule }, { status: 201 })
    }

    const rule = await prisma.routeCommissionRule.upsert({
      where: {
        routeSegmentId_vehicleType: {
          routeSegmentId,
          vehicleType: vehicleType as any,
        },
      },
      create: { routeSegmentId, vehicleType: vehicleType as any, captainCommissionPct, pmCommissionPct, isActive },
      update: { captainCommissionPct, pmCommissionPct, isActive },
      include: {
        routeSegment: {
          include: {
            fromLocation: { select: { id: true, pointName: true } },
            toLocation: { select: { id: true, pointName: true } },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: rule }, { status: 201 })
  } catch (err) {
    console.error('[COMMISSION-RULES/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
