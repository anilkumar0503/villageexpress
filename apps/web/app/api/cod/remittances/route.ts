import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'
import { z } from 'zod'

const codRemittanceSchema = z.object({
  collectionId: z.string().uuid(),
  amount: z.number().positive(),
  remittanceMethod: z.enum(['MANUAL', 'RAZORPAY', 'AUTO_DEBIT']),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/cod/remittances - Get COD remittances for point manager
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(100, Number(searchParams.get('pageSize') ?? 20))

  const where: any = { userId: session!.userId }
  if (status && status !== 'ALL') where.status = status

  try {
    const [items, total] = await Promise.all([
      prisma.codRemittance.findMany({
        where,
        include: {
          collection: {
            include: {
              booking: {
                select: {
                  bookingNumber: true,
                  calculatedPrice: true,
                },
              },
            },
          },
        },
        orderBy: { remittanceDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.codRemittance.count({ where }),
    ])

    return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
  } catch (err) {
    console.error('Error fetching COD remittances:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch COD remittances' }, { status: 500 })
  }
}

// POST /api/cod/remittances - Create COD remittance
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const body = await req.json()
  const parsed = codRemittanceSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  try {
    // Verify collection exists and belongs to user
    const collection = await prisma.codCollection.findUnique({
      where: { id: data.collectionId },
      include: {
        booking: {
          select: {
            calculatedPrice: true,
          },
        },
      },
    })

    if (!collection) {
      return NextResponse.json({ success: false, error: 'COD collection not found' }, { status: 404 })
    }

    if (collection.userId !== session!.userId) {
      return NextResponse.json({ success: false, error: 'This collection does not belong to you' }, { status: 403 })
    }

    // Check if remittance amount exceeds collection amount
    const totalRemitted = await prisma.codRemittance.aggregate({
      where: { collectionId: data.collectionId, status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] } },
      _sum: { amount: true },
    })

    const alreadyRemitted = Number(totalRemitted._sum.amount || 0)
    if (alreadyRemitted + data.amount > Number(collection.amount)) {
      return NextResponse.json({ success: false, error: 'Remittance amount exceeds collected amount' }, { status: 400 })
    }

    // Create remittance
    const remittance = await prisma.codRemittance.create({
      data: {
        collectionId: data.collectionId,
        userId: session!.userId,
        amount: data.amount,
        remittanceMethod: data.remittanceMethod,
        transactionId: data.transactionId,
        notes: data.notes,
      },
      include: {
        collection: {
          include: {
            booking: {
              select: {
                bookingNumber: true,
              },
            },
          },
        },
      },
    })

    // Update collection status if fully remitted
    if (alreadyRemitted + data.amount >= Number(collection.amount)) {
      await prisma.codCollection.update({
        where: { id: data.collectionId },
        data: { status: 'REMITTED' },
      })
    } else {
      await prisma.codCollection.update({
        where: { id: data.collectionId },
        data: { status: 'PARTIALLY_REMITTED' },
      })
    }

    return NextResponse.json({ success: true, data: remittance })
  } catch (err) {
    console.error('Error creating COD remittance:', err)
    return NextResponse.json({ success: false, error: 'Failed to create COD remittance' }, { status: 500 })
  }
}
