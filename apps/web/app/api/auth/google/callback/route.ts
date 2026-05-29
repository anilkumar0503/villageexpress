import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/login?error=google_cancelled', req.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', req.url))
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()
    if (tokenData.error) {
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', req.url))
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const googleUser = await userResponse.json()

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { userRoles: { include: { role: true } } },
    })

    if (!user) {
      // Create new user with Google info
      const newUser = await prisma.user.create({
        data: {
          displayId: `VE-GO-${Date.now().toString(36).toUpperCase()}`,
          name: googleUser.name,
          email: googleUser.email,
          phone: '', // Will need to be filled later
          approvalStatus: 'APPROVED',
          isActive: true,
        },
      })

      // Assign CUSTOMER role by default
      const customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } })
      if (customerRole) {
        await prisma.userRole.create({
          data: {
            userId: newUser.id,
            roleId: customerRole.id,
            isPrimary: true,
          },
        })
      }

      // Re-fetch with roles
      user = await prisma.user.findUnique({
        where: { id: newUser.id },
        include: { userRoles: { include: { role: true } } },
      })
    }

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=user_creation_failed', req.url))
    }

    // Generate JWT tokens
    const accessToken = await signAccessToken({ userId: user.id, displayId: user.displayId })
    const refreshToken = await signRefreshToken(user.id)

    const response = NextResponse.redirect(new URL('/dashboard', req.url))
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
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
    console.error('[GOOGLE_OAUTH]', err)
    return NextResponse.redirect(new URL('/login?error=server_error', req.url))
  }
}
