import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const updateSchema = z.object({
  basePrice: z.number().positive().optional(),
  pricePerKm: z.number().positive().optional(),
  weightSurcharge: z.number().nonnegative().optional(),
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']).nullable().optional(),
  isActive: z.boolean().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { error } = await requirePermission(req, 'pricing:manage')
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const rule = await prisma.routePricingRule.update({ where: { id }, data: parsed.data })
    return NextResponse.json({ success: true, data: rule })
  } catch (err: unknown) {
    console.error('[ROUTE-PRICING-RULES/PUT]', err)
    const isNotFound = err instanceof Error && err.message.includes('Record to update not found')
    return NextResponse.json(
      { success: false, error: isNotFound ? 'Rule not found' : 'Failed to update rule' },
      { status: isNotFound ? 404 : 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { error } = await requirePermission(req, 'pricing:manage')
  if (error) return error

  const { id } = await params
  try {
    await prisma.routePricingRule.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Rule deleted' })
  } catch (err: unknown) {
    console.error('[ROUTE-PRICING-RULES/DELETE]', err)
    const isNotFound = err instanceof Error && err.message.includes('Record to delete does not exist')
    return NextResponse.json(
      { success: false, error: isNotFound ? 'Rule not found' : 'Failed to delete rule' },
      { status: isNotFound ? 404 : 500 },
    )
  }
}
