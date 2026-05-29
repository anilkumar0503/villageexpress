import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'
import { z } from 'zod'

const payoutDetailsSchema = z.object({
  type: z.enum(['UPI', 'BANK_TRANSFER']),
  upiId: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  accountHolderName: z.string().optional(),
})

// GET /api/payout-details - Get current user's payout details
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  try {
    const payoutDetails = await prisma.payoutDetails.findUnique({
      where: { userId: session!.userId },
    })

    return NextResponse.json({ success: true, data: payoutDetails })
  } catch (err: any) {
    // If table doesn't exist yet, return null
    if (err.code === 'P2021') {
      return NextResponse.json({ success: true, data: null })
    }
    throw err
  }
}

// POST /api/payout-details - Save payout details
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  try {
    const body = await req.json()
    const parsed = payoutDetailsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Validate based on type
    if (data.type === 'UPI' && !data.upiId) {
      return NextResponse.json({ success: false, error: 'UPI ID is required for UPI payments' }, { status: 400 })
    }

    if (data.type === 'BANK_TRANSFER') {
      if (!data.bankName || !data.accountNumber || !data.ifscCode || !data.accountHolderName) {
        return NextResponse.json({ success: false, error: 'All bank details are required for bank transfer' }, { status: 400 })
      }
    }

    // Upsert payout details
    const payoutDetails = await prisma.payoutDetails.upsert({
      where: { userId: session!.userId },
      update: data,
      create: {
        userId: session!.userId,
        ...data,
      },
    })

    return NextResponse.json({ success: true, data: payoutDetails })
  } catch (err: any) {
    // If table doesn't exist yet
    if (err.code === 'P2021') {
      return NextResponse.json({ success: false, error: 'Payout details table not yet created. Please contact admin.' }, { status: 500 })
    }
    throw err
  }
}
