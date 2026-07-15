import { NextRequest, NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/app-url'

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${getAppUrl()}/api/auth/google/callback`
  const scope = 'openid profile email'
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}`
  
  return NextResponse.redirect(authUrl)
}
