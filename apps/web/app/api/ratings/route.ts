import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { getSession } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { bookingId, rating, comment } = body

    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Invalid rating data' }, { status: 400 })
    }

    // Get the booking to find the captain
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { captain: true, customer: true },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    if (booking.customerId !== session.userId) {
      return NextResponse.json({ success: false, error: 'You can only rate your own bookings' }, { status: 403 })
    }

    if (!booking.captain) {
      return NextResponse.json({ success: false, error: 'No captain assigned to this booking' }, { status: 400 })
    }

    if (booking.status !== 'DELIVERED') {
      return NextResponse.json({ success: false, error: 'You can only rate delivered bookings' }, { status: 400 })
    }

    // Check if already rated
    const existingRating = await prisma.rating.findUnique({
      where: {
        bookingId_raterId: {
          bookingId,
          raterId: session.userId,
        },
      },
    })

    if (existingRating) {
      return NextResponse.json({ success: false, error: 'You have already rated this booking' }, { status: 400 })
    }

    // Create the rating
    const newRating = await prisma.rating.create({
      data: {
        rating,
        comment: comment || null,
        bookingId,
        raterId: session.userId,
        ratedId: booking.captain.id,
      },
    })

    return NextResponse.json({ success: true, data: newRating })
  } catch (error) {
    console.error('[RATINGS/POST]', error)
    return NextResponse.json({ success: false, error: 'Failed to submit rating' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const captainId = searchParams.get('captainId')

    if (!captainId) {
      return NextResponse.json({ success: false, error: 'Captain ID is required' }, { status: 400 })
    }

    const ratings = await prisma.rating.findMany({
      where: { ratedId: captainId },
      include: {
        rater: {
          select: {
            id: true,
            name: true,
            displayId: true,
          },
        },
        booking: {
          select: {
            bookingNumber: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate average rating
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
      : 0

    return NextResponse.json({
      success: true,
      data: {
        ratings,
        averageRating: avgRating,
        totalRatings: ratings.length,
      },
    })
  } catch (error) {
    console.error('[RATINGS/GET]', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch ratings' }, { status: 500 })
  }
}
