import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { getSession } from '@/lib/auth/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const favorites = await prisma.favoriteLocation.findMany({
      where: { userId: session.userId },
      include: {
        location: {
          select: {
            id: true,
            pointName: true,
            village: true,
            district: true,
            state: true,
            pincode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: favorites })
  } catch (error) {
    console.error('[FAVORITE_LOCATIONS/GET]', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch favorite locations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { locationId, label, locationType } = body

    if (!locationId || !label) {
      return NextResponse.json({ success: false, error: 'Location ID and label are required' }, { status: 400 })
    }

    const favorite = await prisma.favoriteLocation.create({
      data: {
        userId: session.userId,
        locationId,
        label,
        locationType: locationType || 'BOTH',
      },
      include: {
        location: {
          select: {
            id: true,
            pointName: true,
            village: true,
            district: true,
            state: true,
            pincode: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: favorite })
  } catch (error) {
    console.error('[FAVORITE_LOCATIONS/POST]', error)
    return NextResponse.json({ success: false, error: 'Failed to add favorite location' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json({ success: false, error: 'Location ID is required' }, { status: 400 })
    }

    await prisma.favoriteLocation.deleteMany({
      where: {
        userId: session.userId,
        locationId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[FAVORITE_LOCATIONS/DELETE]', error)
    return NextResponse.json({ success: false, error: 'Failed to remove favorite location' }, { status: 500 })
  }
}
