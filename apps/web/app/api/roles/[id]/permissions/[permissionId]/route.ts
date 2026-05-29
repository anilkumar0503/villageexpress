import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const schema = z.object({
  scope: z.enum(['GLOBAL', 'REGION', 'DISTRICT', 'LOCATION']).default('GLOBAL'),
})

type RouteContext = { params: Promise<{ id: string; permissionId: string }> }

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'role:manage')
  if (error) return error

  const { id, permissionId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid scope' }, { status: 400 })
  }

  const existing = await prisma.rolePermission.findUnique({
    where: { roleId_permissionId_scope: { roleId: id, permissionId, scope: parsed.data.scope } },
  })
  if (existing) {
    return NextResponse.json({ success: false, error: 'Permission already assigned to role with this scope' }, { status: 409 })
  }

  const assignment = await prisma.rolePermission.create({
    data: { roleId: id, permissionId, scope: parsed.data.scope },
  })

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: `PERMISSION_ASSIGNED:${permissionId}:${parsed.data.scope}`,
      resource: `role:${id}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, data: assignment })
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'role:manage')
  if (error) return error

  const { id, permissionId } = await params
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') ?? 'GLOBAL'

  await prisma.rolePermission.deleteMany({
    where: { roleId: id, permissionId, scope: scope as 'GLOBAL' | 'REGION' | 'DISTRICT' | 'LOCATION' },
  })

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: `PERMISSION_REMOVED:${permissionId}:${scope}`,
      resource: `role:${id}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, message: 'Permission removed from role' })
}
