import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth, requirePermission } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))
  const status = searchParams.get('status')

  const where: any = {}
  if (status) {
    where.status = status
  }

  const [items, total] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contactSubmission.count({ where }),
  ])

  return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
}
