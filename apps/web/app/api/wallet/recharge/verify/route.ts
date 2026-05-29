import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

const schema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
})

// POST /api/wallet/recharge/verify - Verify Razorpay payment and credit wallet
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  // Check Razorpay credentials
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ success: false, error: 'Payment gateway not configured' }, { status: 500 })
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payment details' }, { status: 400 })
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (generatedSignature !== razorpaySignature) {
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 })
    }

    // Fetch order details from Razorpay
    const order = await razorpay.orders.fetch(razorpayOrderId)
    const amount = Number(order.amount) / 100 // Convert from paise to rupees

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session!.userId },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: session!.userId },
      })
    }

    const balanceBefore = wallet.balance
    const balanceAfter = balanceBefore.plus(amount)

    // Create transaction and update balance
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: session!.userId,
          type: 'RECHARGE',
          amount,
          balanceBefore,
          balanceAfter,
          description: 'Wallet recharge',
          referenceId: razorpayPaymentId,
          referenceType: 'RECHARGE',
        },
      }),
    ])

    return NextResponse.json({ success: true, data: { balance: balanceAfter } })
  } catch (err) {
    console.error('[WALLET/RECHARGE/VERIFY/POST]', err)
    return NextResponse.json({ success: false, error: 'Failed to verify payment' }, { status: 500 })
  }
}
