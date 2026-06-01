import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requirePermission } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error } = await requirePermission(req, 'settings:manage')
  if (error) return error

  try {
    const searchParams = req.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: any = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.lte = new Date(endDate)
    }

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      ticketsByCategory,
      ticketsByPriority,
      ticketsByStatus,
      avgResponseTime,
    ] = await Promise.all([
      prisma.supportTicket.count({ where: dateFilter }),
      prisma.supportTicket.count({ where: { ...dateFilter, status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { ...dateFilter, status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { ...dateFilter, status: 'RESOLVED' } }),
      prisma.supportTicket.count({ where: { ...dateFilter, status: 'CLOSED' } }),
      prisma.supportTicket.groupBy({
        by: ['category'],
        where: dateFilter,
        _count: true,
      }),
      prisma.supportTicket.groupBy({
        by: ['priority'],
        where: dateFilter,
        _count: true,
      }),
      prisma.supportTicket.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: true,
      }),
      // Calculate average response time (time from ticket creation to first admin message)
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (m."createdAt" - t."createdAt")) / 3600) as avg_hours
        FROM "SupportTicket" t
        INNER JOIN "SupportMessage" m ON m."ticketId" = t."id"
        WHERE m."isAdmin" = true
        AND m."id" = (
          SELECT id FROM "SupportMessage" 
          WHERE "ticketId" = t."id" AND "isAdmin" = true 
          ORDER BY "createdAt" ASC LIMIT 1
        )
        ${startDate ? prisma.$queryRaw`AND t."createdAt" >= ${new Date(startDate)}` : prisma.$queryRaw``}
        ${endDate ? prisma.$queryRaw`AND t."createdAt" <= ${new Date(endDate)}` : prisma.$queryRaw``}
      `,
    ])

    const avgResponseHours = avgResponseTime && Array.isArray(avgResponseTime) && avgResponseTime[0]?.avg_hours ? Number(avgResponseTime[0].avg_hours).toFixed(2) : null

    return NextResponse.json({
      success: true,
      data: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        ticketsByCategory: ticketsByCategory.map((item) => ({
          category: item.category,
          count: item._count,
        })),
        ticketsByPriority: ticketsByPriority.map((item) => ({
          priority: item.priority,
          count: item._count,
        })),
        ticketsByStatus: ticketsByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        avgResponseHours,
      },
    })
  } catch (err) {
    console.error('[SUPPORT_ANALYTICS/GET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
