import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAndSendOtp } from '@/lib/auth/otp'
import { checkOtpRateLimit } from '@/lib/rate-limit'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 },
      )
    }

    const rateLimit = checkOtpRateLimit(parsed.data.email)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please try again in 1 hour.' },
        { status: 429 },
      )
    }

    await createAndSendOtp(parsed.data.email)

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email address',
      remaining: rateLimit.remaining,
    })
  } catch (err) {
    console.error('[AUTH/OTP/SEND]', err)
    return NextResponse.json({ success: false, error: 'Failed to send OTP' }, { status: 500 })
  }
}
