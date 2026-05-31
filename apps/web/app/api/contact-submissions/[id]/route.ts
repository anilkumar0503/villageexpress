import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requirePermission(req, 'contact:update')
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

    const submission = await prisma.contactSubmission.update({
      where: { id },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: 'UPDATE',
        resource: `contactSubmission:${submission.id}`,
        result: 'GRANTED',
      },
    })

    return NextResponse.json({ success: true, data: submission })
  } catch (err) {
    console.error('[CONTACT_SUBMISSIONS/PUT]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requirePermission(req, 'contact:delete')
  if (error) return error

  const { id } = await params

  try {
    await prisma.contactSubmission.delete({
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

    return NextResponse.json({ success: true, message: 'Contact submission deleted' })
  } catch (err) {
    console.error('[CONTACT_SUBMISSIONS/DELETE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
