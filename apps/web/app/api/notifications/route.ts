import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ success: true, data: notifications })
  } catch (error) {
    console.error('[NOTIFICATIONS/GET]', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { notificationIds } = body

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.userId,
      },
      data: { read: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[NOTIFICATIONS/PATCH]', error)
    return NextResponse.json({ success: false, error: 'Failed to mark notifications as read' }, { status: 500 })
  }
}
