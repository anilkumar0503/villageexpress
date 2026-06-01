import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth/jwt'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json({ success: false, error: 'No refresh token' }, { status: 401 })
    }

    const payload = await verifyRefreshToken(refreshToken)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { userRoles: { include: { role: true } } },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'User not found or inactive' }, { status: 401 })
    }

    const accessToken = await signAccessToken({ userId: user.id, displayId: user.displayId })
    const newRefreshToken = await signRefreshToken(user.id)

    const response = NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          displayId: user.displayId,
          name: user.name,
          email: user.email,
          roles: user.userRoles.map((ur: any) => ur.role.name),
        },
      },
    })

    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid or expired refresh token' }, { status: 401 })
  }
}
