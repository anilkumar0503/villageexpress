import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const updateSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerLocation: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  content: z.string().min(1).optional(),
  isApproved: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth(req)
  if (error) return error

  try {
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: params.id },
    })

    if (!testimonial) {
      return NextResponse.json({ success: false, error: 'Testimonial not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: testimonial })
  } catch (err) {
    console.error('[TESTIMONIALS/GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requirePermission(req, 'testimonial:update')
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

    const testimonial = await prisma.testimonial.update({
      where: { id: params.id },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'UPDATE',
        resource: `testimonial:${testimonial.id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: testimonial })
  } catch (err) {
    console.error('[TESTIMONIALS/PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requirePermission(req, 'testimonial:delete')
  if (error) return error

  try {
    await prisma.testimonial.delete({
      where: { id: params.id },
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'DELETE',
        resource: `testimonial:${params.id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, message: 'Testimonial deleted' })
  } catch (err) {
    console.error('[TESTIMONIALS/DELETE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
