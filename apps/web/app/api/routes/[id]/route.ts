import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const routeSchema = z.object({
  name: z.string().min(1).optional(),
  sourceLocationId: z.string().uuid().optional(),
  destinationLocationId: z.string().uuid().optional(),
  estimatedDays: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/routes/[id] - Get single route
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const route = await prisma.route.findUnique({
      where: { id },
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

    if (!route) return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: route })
  } catch (err) {
    console.error('[ROUTES/[id]/GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/routes/[id] - Update route
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: permError } = await requirePermission(req, 'pricing:manage')
    if (permError) return permError

    const { id } = await params
    const body = await req.json()
    const parsed = routeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { segments, ...routeData } = body

    // Delete existing segments and create new ones
    if (segments && Array.isArray(segments)) {
      await prisma.routeSegment.deleteMany({ where: { routeId: id } })
    }

    const route = await prisma.route.update({
      where: { id },
      data: {
        ...routeData,
        ...(segments && Array.isArray(segments) ? {
          segments: {
            create: segments.map((seg: any, idx: number) => ({
              ...seg,
              sequenceOrder: idx + 1,
            })),
          },
        } : {}),
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

    return NextResponse.json({ success: true, data: route })
  } catch (err) {
    console.error('[ROUTES/[id]/PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/routes/[id] - Delete route
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error: permError } = await requirePermission(req, 'pricing:manage')
    if (permError) return permError

    const { id } = await params
    await prisma.route.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Route deleted' })
  } catch (err) {
    console.error('[ROUTES/[id]/DELETE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
