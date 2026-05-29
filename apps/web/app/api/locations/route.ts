import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  state: z.string().min(1),
  district: z.string().min(1),
  mandal: z.string().optional(),
  village: z.string().min(1),
  pointName: z.string().min(1),
  pincode: z.string().length(6),
  latitude: z.number(),
  longitude: z.number(),
  locationType: z.enum(['POINT', 'HUB', 'WAREHOUSE']),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search = searchParams.get('search') ?? undefined
  const state = searchParams.get('state') ?? undefined
  const district = searchParams.get('district') ?? undefined
  const locationType = searchParams.get('locationType') ?? undefined
  const isActive = searchParams.get('isActive')
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))
  const publicAccess = searchParams.get('public') === 'true'

  // Only require auth if not public access
  if (!publicAccess) {
    const { error } = await requireAuth(req)
    if (error) return error
  }

  const where: any = {
    ...(state && { state }),
    ...(locationType && { locationType: locationType as 'POINT' | 'HUB' | 'WAREHOUSE' }),
    ...(isActive !== null && { isActive: isActive === 'true' }),
    ...(search && {
      OR: [
        { village: { contains: search, mode: 'insensitive' } },
        { pointName: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  // Handle district filter - could be district name or location ID
  if (district) {
    // Check if it's a UUID (location ID) or district name
    if (district.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      where.id = district
    } else {
      where.district = district
    }
  }

  const [items, total] = await Promise.all([
    prisma.location.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ state: 'asc' }, { district: 'asc' }, { village: 'asc' }],
      select: {
        id: true,
        pointName: true,
        village: true,
        district: true,
        state: true,
        pincode: true,
        locationType: true,
        isActive: true,
      },
    }),
    prisma.location.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: { items, total, page, pageSize },
  })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'location:create')
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

    const location = await prisma.location.create({
      data: {
        ...parsed.data,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'CREATE',
        resource: `location:${location.id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: location }, { status: 201 })
  } catch (err) {
    console.error('[LOCATIONS/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
