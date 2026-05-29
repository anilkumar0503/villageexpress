import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const updateSchema = z.object({
  minDistance: z.union([z.number().nonnegative(), z.string()]).transform((val) => typeof val === 'string' ? Number(val) : val).optional(),
  maxDistance: z.union([z.number().positive(), z.string()]).transform((val) => typeof val === 'string' ? Number(val) : val).optional(),
  pricePerKm: z.union([z.number().positive(), z.string()]).transform((val) => typeof val === 'string' ? Number(val) : val).optional(),
  sortOrder: z.union([z.number(), z.string()]).transform((val) => typeof val === 'string' ? Number(val) : val).optional(),
  isActive: z.boolean().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { error } = await requirePermission(req, 'settings:manage')
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const tier = await prisma.distancePricingTier.update({ where: { id }, data: parsed.data })
    return NextResponse.json({ success: true, data: tier })
  } catch (err: unknown) {
    console.error('[DISTANCE_PRICING_TIERS/PUT]', err)
    const isNotFound = err instanceof Error && err.message.includes('Record to update not found')
    return NextResponse.json(
      { success: false, error: isNotFound ? 'Tier not found' : 'Failed to update tier' },
      { status: isNotFound ? 404 : 500 },
    )
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { error } = await requirePermission(req, 'settings:manage')
  if (error) return error

  const { id } = await params
  try {
    await prisma.distancePricingTier.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Tier deleted' })
  } catch (err: unknown) {
    console.error('[DISTANCE_PRICING_TIERS/DELETE]', err)
    const isNotFound = err instanceof Error && err.message.includes('Record to delete does not exist')
    return NextResponse.json(
      { success: false, error: isNotFound ? 'Tier not found' : 'Failed to delete tier' },
      { status: isNotFound ? 404 : 500 },
    )
  }
}
