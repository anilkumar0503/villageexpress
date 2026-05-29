import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const updateSchema = z.object({
  name: z.string().min(2).max(50).toUpperCase().optional(),
  description: z.string().min(5).max(500).optional(),
  level: z.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { error } = await requirePermission(req, 'role:manage')
  if (error) return error

  const { id } = await params
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
      _count: { select: { userRoles: true } },
    },
  })

  if (!role) {
    return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: role })
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'role:manage')
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  if (parsed.data.name) {
    const existing = await prisma.role.findFirst({ where: { name: parsed.data.name, id: { not: id } } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Role name already exists' }, { status: 409 })
    }
  }

  const role = await prisma.role.update({
    where: { id },
    data: parsed.data,
  })

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: `ROLE_UPDATED:${role.name}`,
      resource: `role:${id}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, data: role })
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'role:manage')
  if (error) return error

  const { id } = await params

  const role = await prisma.role.findUnique({ where: { id }, include: { userRoles: true } })
  if (!role) {
    return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 })
  }
  if (role.userRoles.length > 0) {
    return NextResponse.json({ success: false, error: 'Cannot delete role with assigned users' }, { status: 409 })
  }

  await prisma.role.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: `ROLE_DELETED:${role.name}`,
      resource: `role:${id}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, message: 'Role deleted' })
}
