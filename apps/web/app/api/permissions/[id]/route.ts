import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const updateSchema = z.object({
  name: z.string().min(3).max(100).regex(/^[a-z_]+:[a-z_]+$/, 'Must be in format resource:action').optional(),
  description: z.string().min(5).max(500).optional(),
  resource: z.string().min(2).max(50).optional(),
  action: z.string().min(2).max(50).optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { error } = await requirePermission(req, 'permission:manage')
  if (error) return error

  const { id } = await params
  const permission = await prisma.permission.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        include: { role: true },
      },
      _count: { select: { rolePermissions: true } },
    },
  })

  if (!permission) {
    return NextResponse.json({ success: false, error: 'Permission not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: permission })
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'permission:manage')
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  if (parsed.data.name) {
    const existing = await prisma.permission.findFirst({ where: { name: parsed.data.name, id: { not: id } } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Permission name already exists' }, { status: 409 })
    }
  }

  const permission = await prisma.permission.update({
    where: { id },
    data: parsed.data,
  })

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: `PERMISSION_UPDATED:${permission.name}`,
      resource: `permission:${id}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, data: permission })
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'permission:manage')
  if (error) return error

  const { id } = await params

  const permission = await prisma.permission.findUnique({ where: { id }, include: { rolePermissions: true } })
  if (!permission) {
    return NextResponse.json({ success: false, error: 'Permission not found' }, { status: 404 })
  }
  if (permission.rolePermissions.length > 0) {
    return NextResponse.json({ success: false, error: 'Cannot delete permission assigned to roles' }, { status: 409 })
  }

  await prisma.permission.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: `PERMISSION_DELETED:${permission.name}`,
      resource: `permission:${id}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, message: 'Permission deleted' })
}
