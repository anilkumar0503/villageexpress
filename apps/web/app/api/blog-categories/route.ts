import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const isAdmin = searchParams.get('admin') === 'true'

  if (isAdmin) {
    const { error } = await requireAuth(req)
    if (error) return error
  }

  const where = isAdmin ? {} : { isActive: true }

  const categories = await prisma.blogCategory.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { blogs: true },
      },
    },
  })

  return NextResponse.json({ success: true, data: categories })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'blog:create')
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

    // Check if slug already exists
    const existing = await prisma.blogCategory.findUnique({
      where: { slug: parsed.data.slug },
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 400 })
    }

    const category = await prisma.blogCategory.create({
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'CREATE',
        resource: `blogCategory:${category.id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: category }, { status: 201 })
  } catch (err) {
    console.error('[BLOG_CATEGORIES/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
