import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  coverImage: z.string().optional(),
  author: z.string().optional(),
  isPublished: z.boolean().default(false),
})

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1).optional(),
  coverImage: z.string().optional(),
  author: z.string().optional(),
  isPublished: z.boolean().optional(),
})

// Public GET - only published blogs
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const isAdmin = searchParams.get('admin') === 'true'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))
  const slug = searchParams.get('slug')

  // If admin, require auth and show all blogs
  if (isAdmin) {
    const { error } = await requireAuth(req)
    if (error) return error
  }

  // If slug is provided, return single blog
  if (slug) {
    const where = isAdmin ? { slug } : { slug, isPublished: true }
    const blog = await prisma.blog.findUnique({
      where,
    })

    if (!blog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: blog })
  }

  const where = isAdmin ? {} : { isPublished: true }

  const [items, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.blog.count({ where }),
  ])

  return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
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
    const existing = await prisma.blog.findUnique({
      where: { slug: parsed.data.slug },
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 400 })
    }

    const blog = await prisma.blog.create({
      data: {
        ...parsed.data,
        publishedAt: parsed.data.isPublished ? new Date() : null,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'CREATE',
        resource: `blog:${blog.id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: blog }, { status: 201 })
  } catch (err) {
    console.error('[BLOGS/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
