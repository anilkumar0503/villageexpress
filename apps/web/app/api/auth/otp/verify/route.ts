import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { verifyOtp } from '@/lib/auth/otp'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import { generateDisplayId } from '@ve/utils'

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Email and 6-digit OTP are required' },
        { status: 400 },
      )
    }

    const { email, code } = parsed.data

    const valid = await verifyOtp(email, code)
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 401 },
      )
    }

    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } })
      const count = await prisma.user.count()
      const displayId = generateDisplayId('CUSTOMER', count + 1)

      user = await prisma.user.create({
        data: {
          displayId,
          name: email.split('@')[0],
          email,
          phone: '',
          approvalStatus: 'APPROVED',
          isActive: true,
          userRoles: customerRole
            ? { create: { roleId: customerRole.id, isPrimary: true } }
            : undefined,
        },
      })
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated' },
        { status: 403 },
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
          isNewUser: !user.phone,
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
    console.error('[AUTH/OTP/VERIFY]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
