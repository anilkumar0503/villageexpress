import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, 'audit:read')
  if (error) return error

  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(50, Number(searchParams.get('pageSize') ?? 20))
  const action = searchParams.get('action') ?? undefined
  const resource = searchParams.get('resource') ?? undefined
  const userId = searchParams.get('userId') ?? undefined

  const where = {
    ...(action && { action }),
    ...(resource && { resource: { contains: resource } }),
    ...(userId && { userId }),
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { displayId: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
}
