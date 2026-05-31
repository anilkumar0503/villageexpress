import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
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

  const tags = await prisma.blogTag.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { blogs: true },
      },
    },
  })

  return NextResponse.json({ success: true, data: tags })
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
    const existing = await prisma.blogTag.findUnique({
      where: { slug: parsed.data.slug },
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 400 })
    }

    const tag = await prisma.blogTag.create({
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'CREATE',
        resource: `blogTag:${tag.id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: tag }, { status: 201 })
  } catch (err) {
    console.error('[BLOG_TAGS/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
