import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

type RouteContext = { params: Promise<{ id: string; roleId: string }> }

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'user:update')
  if (error) return error

  const { id, roleId } = await params

  const assignment = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId: id, roleId } },
    include: { role: true },
  })
  if (!assignment) {
    return NextResponse.json({ success: false, error: 'Role assignment not found' }, { status: 404 })
  }
  if (assignment.isPrimary) {
    return NextResponse.json({ success: false, error: 'Cannot remove primary role' }, { status: 400 })
  }

  await prisma.userRole.delete({
    where: { userId_roleId: { userId: id, roleId } },
  })

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: `ROLE_REMOVED:${assignment.role.name}`,
      resource: `user:${id}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, message: 'Role removed from user' })
}
