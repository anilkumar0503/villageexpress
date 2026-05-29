import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  name: z.string().min(3).max(100).regex(/^[a-z_]+:[a-z_]+$/, 'Must be in format resource:action'),
  description: z.string().min(5).max(500),
  resource: z.string().min(2).max(50),
  action: z.string().min(2).max(50),
})

const updateSchema = z.object({
  name: z.string().min(3).max(100).regex(/^[a-z_]+:[a-z_]+$/, 'Must be in format resource:action').optional(),
  description: z.string().min(5).max(500).optional(),
  resource: z.string().min(2).max(50).optional(),
  action: z.string().min(2).max(50).optional(),
})

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, 'permission:manage')
  if (error) return error

  const permissions = await prisma.permission.findMany({
    orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    include: {
      _count: { select: { rolePermissions: true } },
    },
  })

  return NextResponse.json({ success: true, data: permissions })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'permission:manage')
  if (error) return error

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await prisma.permission.findUnique({ where: { name: parsed.data.name } })
  if (existing) {
    return NextResponse.json({ success: false, error: 'Permission name already exists' }, { status: 409 })
  }

  const permission = await prisma.permission.create({
    data: parsed.data,
  })

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: `PERMISSION_CREATED:${permission.name}`,
      resource: `permission:${permission.id}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, data: permission })
}
