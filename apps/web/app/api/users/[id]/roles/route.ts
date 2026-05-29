import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

const createSchema = z.object({
  roleId: z.string().uuid(),
  isPrimary: z.boolean().default(false),
  assignedLocationId: z.string().uuid().nullable().optional(),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { error } = await requirePermission(req, 'user:read')
  if (error) return error

  const { id } = await params
  const userRoles = await prisma.userRole.findMany({
    where: { userId: id },
    include: { role: true, assignedLocation: { select: { pointName: true, village: true, district: true } } },
    orderBy: { isPrimary: 'desc' },
  })

  return NextResponse.json({ success: true, data: userRoles })
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { error, session } = await requirePermission(req, 'user:update')
  if (error) return error

  const { id } = await params
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const existing = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId: id, roleId: parsed.data.roleId } },
  })
  if (existing) {
    return NextResponse.json({ success: false, error: 'User already has this role' }, { status: 409 })
  }

  if (parsed.data.isPrimary) {
    await prisma.userRole.updateMany({ where: { userId: id }, data: { isPrimary: false } })
  }

  const assignment = await prisma.userRole.create({
    data: { userId: id, ...parsed.data },
    include: { role: true },
  })

  await prisma.auditLog.create({
    data: {
      userId: session!.userId,
      action: `ROLE_ASSIGNED:${assignment.role.name}`,
      resource: `user:${id}`,
      result: 'GRANTED',
    },
  })

  return NextResponse.json({ success: true, data: assignment })
}
