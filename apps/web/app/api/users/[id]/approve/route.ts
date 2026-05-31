import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'
import { sendApprovalEmail, sendWelcomeEmail, sendDocumentRejectionEmail } from '@/lib/email'

const schema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'user:approve')
  if (error) return error

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'action must be APPROVE or REJECT' },
        { status: 400 },
      )
    }

    const { action, reason } = parsed.data

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (target.approvalStatus !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'User is not in PENDING state' },
        { status: 409 },
      )
    }

    const approved = action === 'APPROVE'

    const user = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: approved ? 'APPROVED' : 'REJECTED',
        isActive: approved,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: action,
        resource: `user:${id}`,
        result: 'GRANTED',
      },
    })

    if (user.email) {
      await sendApprovalEmail(user.email, user.name, approved, reason)
      // Send welcome email for approved users
      if (approved) {
        await sendWelcomeEmail(user.email, user.name)
      }
      // Send document rejection email for rejected users with reason
      if (!approved && reason) {
        await sendDocumentRejectionEmail(user.email, user.name, 'Registration Documents', reason)
      }
    }

    return NextResponse.json({
      success: true,
      message: approved ? 'User approved successfully' : 'User registration rejected',
      data: { id: user.id, approvalStatus: user.approvalStatus },
    })
  } catch (err) {
    console.error('[USERS/APPROVE]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
