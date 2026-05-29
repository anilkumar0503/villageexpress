import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

type RouteContext = { params: Promise<{ id: string }> }

const updateSchema = z.object({
  captainCommissionPct: z.number().min(0).max(100).optional(),
  pmCommissionPct: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
})

// PUT /api/commission-rules/[id]
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { error } = await requirePermission(req, 'booking:create')
  if (error) return error

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    // Try to update as route-specific rule first
    let rule
    try {
      rule = await prisma.routeCommissionRule.update({
        where: { id },
        data: parsed.data,
        include: {
          routeSegment: {
            include: {
              fromLocation: { select: { id: true, pointName: true } },
              toLocation: { select: { id: true, pointName: true } },
            },
          },
        },
      })
    } catch {
      // If that fails, try as global rule
      rule = await prisma.globalCommissionRule.update({
        where: { id },
        data: parsed.data,
      })
    }

    return NextResponse.json({ success: true, data: rule })
  } catch (err) {
    console.error('[COMMISSION-RULES/PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/commission-rules/[id]
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { error } = await requirePermission(req, 'booking:create')
  if (error) return error

  const { id } = await params

  try {
    // Try to delete as route-specific rule first
    try {
      await prisma.routeCommissionRule.delete({ where: { id } })
    } catch {
      // If that fails, try as global rule
      await prisma.globalCommissionRule.delete({ where: { id } })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[COMMISSION-RULES/DELETE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
