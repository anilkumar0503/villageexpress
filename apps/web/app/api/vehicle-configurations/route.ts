import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  vehicleType: z.enum(['BIKE', 'AUTO', 'MINI_VAN', 'VAN']),
  displayName: z.string().min(1),
  description: z.string().optional(),
  defaultWeight: z.number().positive(),
  maxWeight: z.number().positive(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const publicAccess = searchParams.get('public') === 'true'

  // Allow public access for read operations
  if (!publicAccess) {
    const { error } = await requireAuth(req)
    if (error) return error
  }

  const isActive = searchParams.get('isActive')

  const where: any = {
    ...(isActive !== null && { isActive: isActive === 'true' }),
  }

  const items = await prisma.vehicleConfiguration.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      distanceTiers: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  return NextResponse.json({ success: true, data: items })
}

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

    const configuration = await prisma.vehicleConfiguration.create({
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'CREATE',
        resource: `vehicle-configuration:${configuration.id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: configuration }, { status: 201 })
  } catch (err) {
    console.error('[VEHICLE_CONFIGURATIONS/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
