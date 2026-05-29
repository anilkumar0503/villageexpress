import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'

const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/otp/send',
  '/api/auth/otp/verify',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/password-reset',
  '/api/users/register',
  '/api/locations/cascading',
  '/api/locations',
  '/api/vehicle-configurations',
]

const PUBLIC_PAGES = ['/', '/login', '/register', '/register/point-manager', '/register/captain', '/forgot-password', '/reset-password']
const PROTECTED_PAGES = ['/dashboard', '/bookings', '/captain', '/profile', '/approvals', '/users', '/locations', '/reports', '/settings', '/audit-logs']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const isPublicPage = PUBLIC_PAGES.some((p) => pathname === p)
  const isStaticAsset = pathname.startsWith('/_next') || pathname.startsWith('/favicon')

  // Redirect authenticated users away from auth pages
  if (isPublicPage && pathname !== '/') {
    const token = req.cookies.get('access_token')?.value
    if (token) {
      try {
        await verifyAccessToken(token)
        return NextResponse.redirect(new URL('/dashboard', req.url))
      } catch {
        // Token invalid, allow access to auth pages
      }
    }
  }

  // Redirect unauthenticated users away from protected pages
  const isProtectedPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p))
  if (isProtectedPage) {
    const token = req.cookies.get('access_token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    try {
      await verifyAccessToken(token)
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  if (isPublicRoute || isPublicPage || isStaticAsset) {
    return NextResponse.next()
  }

  const authHeader = req.headers.get('authorization')
  const apiToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (!apiToken) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await verifyAccessToken(apiToken)
    return NextResponse.next()
  } catch {
    return NextResponse.json({ success: false, error: 'Token expired or invalid' }, { status: 401 })
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
