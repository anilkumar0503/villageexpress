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
  // SEO fields
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  // Categories and tags
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { id } = await params

  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
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
      const existing = await prisma.blog.findFirst({
        where: {
          slug: parsed.data.slug,
          id: { not: id },
        },
      })

      if (existing) {
        return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 400 })
      }
    }

    const { categoryIds, tagIds, ...blogData } = parsed.data

    const blog = await prisma.$transaction(async (tx: any) => {
      // Update blog
      const updatedBlog = await tx.blog.update({
        where: { id },
        data: {
          ...blogData,
          publishedAt: parsed.data.isPublished ? new Date() : undefined,
        },
      })

      // Update category relationships
      await tx.blogCategoryOnBlog.deleteMany({
        where: { blogId: id },
      })
      if (categoryIds && categoryIds.length > 0) {
        await tx.blogCategoryOnBlog.createMany({
          data: categoryIds.map((categoryId: any) => ({
            blogId: id,
            categoryId,
          })),
        })
      }

      // Update tag relationships
      await tx.blogTagOnBlog.deleteMany({
        where: { blogId: id },
      })
      if (tagIds && tagIds.length > 0) {
        await tx.blogTagOnBlog.createMany({
          data: tagIds.map((tagId: any) => ({
            blogId: id,
            tagId,
          })),
        })
      }

      return updatedBlog
    })

    // Fetch blog with relations
    const blogWithRelations = await prisma.blog.findUnique({
      where: { id: blog.id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
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

    return NextResponse.json({ success: true, data: blogWithRelations })
  } catch (err) {
    console.error('[BLOGS/PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requirePermission(req, 'blog:delete')
  if (error) return error

  const { id } = await params

  try {
    await prisma.blog.delete({
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

    return NextResponse.json({ success: true, message: 'Blog deleted' })
  } catch (err) {
    console.error('[BLOGS/DELETE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
