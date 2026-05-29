import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1).optional(),
  coverImage: z.string().optional(),
  author: z.string().optional(),
  isPublished: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth(req)
  if (error) return error

  try {
    const blog = await prisma.blog.findUnique({
      where: { id: params.id },
    })

    if (!blog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: blog })
  } catch (err) {
    console.error('[BLOGS/GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requirePermission(req, 'blog:update')
  if (error) return error

  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    // If updating slug, check if it already exists
    if (parsed.data.slug) {
      const existing = await prisma.blog.findFirst({
        where: {
          slug: parsed.data.slug,
          id: { not: params.id },
        },
      })

      if (existing) {
        return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 400 })
      }
    }

    const blog = await prisma.blog.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        publishedAt: parsed.data.isPublished ? new Date() : undefined,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'UPDATE',
        resource: `blog:${blog.id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: blog })
  } catch (err) {
    console.error('[BLOGS/PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requirePermission(req, 'blog:delete')
  if (error) return error

  try {
    await prisma.blog.delete({
      where: { id: params.id },
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'DELETE',
        resource: `blog:${params.id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, message: 'Blog deleted' })
  } catch (err) {
    console.error('[BLOGS/DELETE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
