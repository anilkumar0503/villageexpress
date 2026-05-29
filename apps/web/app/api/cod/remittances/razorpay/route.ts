import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

// POST /api/cod/remittances/razorpay - Create Razorpay order for COD remittance
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const body = await req.json()
  const { collectionId, amount } = body

  if (!collectionId || !amount) {
    return NextResponse.json({ success: false, error: 'collectionId and amount are required' }, { status: 400 })
  }

  try {
    // Verify collection exists and belongs to user
    const collection = await prisma.codCollection.findUnique({
      where: { id: collectionId },
    })

    if (!collection) {
      return NextResponse.json({ success: false, error: 'COD collection not found' }, { status: 404 })
    }

    if (collection.userId !== session!.userId) {
      return NextResponse.json({ success: false, error: 'This collection does not belong to you' }, { status: 403 })
    }

    // Check if remittance amount exceeds collection amount
    const totalRemitted = await prisma.codRemittance.aggregate({
      where: { collectionId, status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] } },
      _sum: { amount: true },
    })

    const alreadyRemitted = Number(totalRemitted._sum.amount || 0)
    if (alreadyRemitted + amount > Number(collection.amount)) {
      return NextResponse.json({ success: false, error: 'Remittance amount exceeds collected amount' }, { status: 400 })
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `cod_remittance_${collectionId}`,
      notes: {
        collectionId,
        userId: session!.userId,
      },
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    })
  } catch (err) {
    console.error('Error creating Razorpay order:', err)
    return NextResponse.json({ success: false, error: 'Failed to create payment order' }, { status: 500 })
  }
}
