import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Razorpay from 'razorpay'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

const schema = z.object({ amount: z.number().positive() })

// POST /api/wallet/recharge - Recharge wallet via Razorpay
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  // Check Razorpay credentials
  console.log('[WALLET/RECHARGE] RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'SET' : 'NOT SET')
  console.log('[WALLET/RECHARGE] RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET')
  
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
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
    }

    const { amount } = parsed.data
    console.log('[WALLET/RECHARGE] Amount:', amount, 'User:', session!.userId)

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId: session!.userId },
    })

    if (!wallet) {
      console.log('[WALLET/RECHARGE] Creating new wallet for user:', session!.userId)
      wallet = await prisma.wallet.create({
        data: { userId: session!.userId },
      })
    }

    console.log('[WALLET/RECHARGE] Wallet ID:', wallet.id)

    // Create Razorpay order (receipt must be max 40 chars)
    const receipt = `WR${Date.now().toString(36)}`

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt,
      notes: { 
        walletId: wallet.id,
        userId: session!.userId,
        type: 'WALLET_RECHARGE',
      },
    })

    console.log('[WALLET/RECHARGE] Razorpay order created:', order.id)

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
    console.error('[WALLET/RECHARGE/POST] Error:', err)
    console.error('[WALLET/RECHARGE/POST] Error details:', JSON.stringify(err, null, 2))
    return NextResponse.json({ success: false, error: 'Failed to create recharge order' }, { status: 500 })
  }
}
