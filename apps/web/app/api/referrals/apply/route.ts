import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

// POST /api/referrals/apply - Apply a referral code during registration
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req, 'user:write')
  if (error) return error

  try {
    const { referralCode } = await req.json()

    if (!referralCode) {
      return NextResponse.json({ success: false, error: 'Referral code is required' }, { status: 400 })
    }

    // Find referrer by their displayId (using referral code as displayId)
    const referrer = await prisma.user.findUnique({
      where: { displayId: referralCode },
    })

    if (!referrer) {
      return NextResponse.json({ success: false, error: 'Invalid referral code' }, { status: 404 })
    }

    if (referrer.id === session!.userId) {
      return NextResponse.json({ success: false, error: 'Cannot refer yourself' }, { status: 400 })
    }

    // Check if referral already exists
    const existingReferral = await prisma.referral.findUnique({
      where: { refereeId: session!.userId },
    })

    if (existingReferral) {
      return NextResponse.json({ success: false, error: 'Already referred by someone' }, { status: 400 })
    }

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId: session!.userId,
        bonusAmount: 50, // Default bonus amount
      },
    })

    return NextResponse.json({ success: true, data: referral })
  } catch (err) {
    console.error('[REFERRALS/APPLY/POST]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
