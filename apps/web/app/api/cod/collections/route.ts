import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'
import { z } from 'zod'

const codCollectionSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  collectionMethod: z.enum(['MANUAL', 'AUTO_DEBIT']),
  collectedBy: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/cod/collections - Get COD collections for point manager
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))

  const where: any = { userId: session!.userId }
  if (status) where.status = status

  try {
    const [items, total] = await Promise.all([
      prisma.codCollection.findMany({
        where,
        include: {
          booking: {
            select: {
              bookingNumber: true,
              calculatedPrice: true,
              paymentStatus: true,
              customer: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { collectionDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.codCollection.count({ where }),
    ])

    return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
  } catch (err) {
    console.error('Error fetching COD collections:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch COD collections' }, { status: 500 })
  }
}

// POST /api/cod/collections - Record COD collection
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const body = await req.json()
  const parsed = codCollectionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  try {
    // Verify booking exists and is COD
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      select: { paymentMethod: true, calculatedPrice: true, assignedPointManagerId: true },
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    if (booking.paymentMethod !== 'COD') {
      return NextResponse.json({ success: false, error: 'This booking is not a COD payment' }, { status: 400 })
    }

    if (booking.assignedPointManagerId !== session!.userId) {
      return NextResponse.json({ success: false, error: 'You are not assigned to this booking' }, { status: 403 })
    }

    // Check if COD already collected for this booking
    const existingCollection = await prisma.codCollection.findUnique({
      where: { bookingId: data.bookingId },
    })

    if (existingCollection) {
      return NextResponse.json({ success: false, error: 'COD already collected for this booking' }, { status: 400 })
    }

    // Create COD collection
    const codCollection = await prisma.codCollection.create({
      data: {
        userId: session!.userId,
        bookingId: data.bookingId,
        amount: data.amount,
        collectionMethod: data.collectionMethod,
        collectedBy: data.collectedBy,
        notes: data.notes,
      },
      include: {
        booking: {
          select: {
            bookingNumber: true,
            calculatedPrice: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: codCollection })
  } catch (err) {
    console.error('Error creating COD collection:', err)
    return NextResponse.json({ success: false, error: 'Failed to create COD collection' }, { status: 500 })
  }
}
