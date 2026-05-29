import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const updateSchema = z.object({
  state: z.string().min(1).optional(),
  district: z.string().min(1).optional(),
  mandal: z.string().optional(),
  village: z.string().min(1).optional(),
  pointName: z.string().min(1).optional(),
  pincode: z.string().length(6).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationType: z.enum(['POINT', 'HUB', 'WAREHOUSE']).optional(),
  isActive: z.boolean().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { id } = await params

  const location = await prisma.location.findUnique({ where: { id } })
  if (!location) {
    return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: location })
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'location:update')
  if (error) return error

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const location = await prisma.location.update({
      where: { id },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'UPDATE',
        resource: `location:${id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: location })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 })
    }
    console.error('[LOCATIONS/PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'location:delete')
  if (error) return error

  const { id } = await params

  try {
    await prisma.location.update({
      where: { id },
      data: { isActive: false },
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'DELETE',
        resource: `location:${id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, message: 'Location deactivated' })
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 })
    }
    console.error('[LOCATIONS/DELETE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
