import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  customerName: z.string().min(1),
  customerLocation: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
  content: z.string().min(1),
  isApproved: z.boolean().default(false),
})

const updateSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerLocation: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  content: z.string().min(1).optional(),
  isApproved: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

// Public GET - only approved and active testimonials
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const isAdmin = searchParams.get('admin') === 'true'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))

  // If admin, require auth and show all testimonials
  if (isAdmin) {
    const { error } = await requireAuth(req)
    if (error) return error
  }

  const where = isAdmin ? {} : { isApproved: true, isActive: true }

  const [items, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.testimonial.count({ where }),
  ])

  return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'testimonial:create')
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

    const testimonial = await prisma.testimonial.create({
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'CREATE',
        resource: `testimonial:${testimonial.id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: testimonial }, { status: 201 })
  } catch (err) {
    console.error('[TESTIMONIALS/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
