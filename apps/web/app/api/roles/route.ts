import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  name: z.string().min(2).max(50).toUpperCase(),
  description: z.string().min(5).max(500),
  level: z.number().int().min(1).max(100),
})

const updateSchema = z.object({
  name: z.string().min(2).max(50).toUpperCase().optional(),
  description: z.string().min(5).max(500).optional(),
  level: z.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, 'role:manage')
  if (error) return error

  const roles = await prisma.role.findMany({
    orderBy: { level: 'desc' },
    include: {
      _count: { select: { userRoles: true } },
    },
  })

  return NextResponse.json({ success: true, data: roles })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requirePermission(req, 'role:manage')
  if (error) return error

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await prisma.role.findUnique({ where: { name: parsed.data.name } })
  if (existing) {
    return NextResponse.json({ success: false, error: 'Role name already exists' }, { status: 409 })
  }

  const role = await prisma.role.create({
    data: parsed.data,
  })

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: `ROLE_CREATED:${role.name}`,
      resource: `role:${role.id}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, data: role })
}
