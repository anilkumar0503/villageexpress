import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import { checkOtpRateLimit } from '@/lib/rate-limit'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { email, password } = parsed.data

    const rateLimit = checkOtpRateLimit(email)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again in 1 hour.' },
        { status: 429 },
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: { include: { role: true } },
        captainProfile: true,
      },
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 },
      )
    }

    // Check if user is a captain with incomplete onboarding, rejected KYC, or rejected registration
    const isCaptain = user.userRoles.some((ur: any) => ur.role.name === 'CAPTAIN')
    console.log('[LOGIN] isCaptain:', isCaptain)
    console.log('[LOGIN] captainProfile:', user.captainProfile)
    // @ts-ignore - onboardingStatus field exists in DB but TypeScript needs client regeneration
    const needsOnboarding = isCaptain && user.captainProfile?.onboardingStatus !== 'COMPLETED'
    // @ts-ignore - these fields exist in DB but TypeScript needs client regeneration
    const hasRejectedKyc = isCaptain && (
      user.captainProfile?.aadhaarVerificationStatus === 'REJECTED' ||
      user.captainProfile?.licenseVerificationStatus === 'REJECTED'
    )
    const hasRejectedRegistration = isCaptain && user.approvalStatus === 'REJECTED'
    console.log('[LOGIN] needsOnboarding:', needsOnboarding)
    console.log('[LOGIN] hasRejectedKyc:', hasRejectedKyc)
    console.log('[LOGIN] hasRejectedRegistration:', hasRejectedRegistration)
    console.log('[LOGIN] isActive:', user.isActive)
    console.log('[LOGIN] approvalStatus:', user.approvalStatus)

    // Allow login for captains who need onboarding, have rejected KYC, or have rejected registration
    if (!needsOnboarding && !hasRejectedKyc && !hasRejectedRegistration) {
      if (!user.isActive) {
        return NextResponse.json(
          { success: false, error: 'Account is deactivated' },
          { status: 403 },
        )
      }

      if (user.approvalStatus !== 'APPROVED') {
        return NextResponse.json(
          { success: false, error: 'Account is pending approval' },
          { status: 403 },
        )
      }
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 },
      )
    }

    const accessToken = await signAccessToken({ userId: user.id, displayId: user.displayId })
    const refreshToken = await signRefreshToken(user.id)

    const response = NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          displayId: user.displayId,
          name: user.name,
          email: user.email,
          roles: user.userRoles.map((ur) => ur.role.name),
        },
      },
    })

    response.cookies.set('access_token', accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    })

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[AUTH/LOGIN]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
