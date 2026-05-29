import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: any = { customerId: session.userId }
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (search) {
      where.bookingNumber = { contains: search, mode: 'insensitive' }
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        pickupLocation: { select: { id: true, pointName: true, village: true, state: true } },
        dropLocation: { select: { id: true, pointName: true, village: true, state: true } },
        captain: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ success: true, data: bookings })
  } catch (error) {
    console.error('[CUSTOMER_BOOKINGS/GET]', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
