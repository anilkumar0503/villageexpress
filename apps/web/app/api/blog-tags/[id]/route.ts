import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requirePermission(req, 'blog:update')
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

    // If updating slug, check if it already exists
    if (parsed.data.slug) {
      const existing = await prisma.blogTag.findFirst({
        where: {
          slug: parsed.data.slug,
          id: { not: id },
        },
      })

      if (existing) {
        return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 400 })
      }
    }

    const tag = await prisma.blogTag.update({
      where: { id },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'UPDATE',
        resource: `blogTag:${tag.id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: tag })
  } catch (err) {
    console.error('[BLOG_TAGS/PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requirePermission(req, 'blog:delete')
  if (error) return error

  const { id } = await params

  try {
    await prisma.blogTag.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'DELETE',
        resource: id,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, message: 'Tag deleted' })
  } catch (err) {
    console.error('[BLOG_TAGS/DELETE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
