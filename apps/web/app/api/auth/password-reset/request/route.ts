import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

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

    const { email } = parsed.data

    console.log('[PASSWORD-RESET] Processing request for email:', email)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    console.log('[PASSWORD-RESET] User found:', !!user)

    // Always return success to prevent email enumeration
    if (!user) {
      console.log('[PASSWORD-RESET] No user found, returning success')
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }

    // Allow users without passwords (OTP-only users) to set their first password
    if (!user.password) {
      console.log('[PASSWORD-RESET] User has no password, allowing first password setup')
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    console.log('[PASSWORD-RESET] Generated token, deleting old tokens')

    // Delete any existing unused reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id, used: false },
    })

    console.log('[PASSWORD-RESET] Creating new reset token')

    // Create new password reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // In production, send email with reset link
    // For development, log the token to console
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`
    
    await sendPasswordResetEmail(email, user.name, resetLink)
    
    console.log('🔑 Password Reset Link:', resetLink)
    console.log('🔑 Token:', token)

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    })
  } catch (err) {
    console.error('[AUTH/PASSWORD-RESET/REQUEST] Error:', err)
    console.error('[AUTH/PASSWORD-RESET/REQUEST] Error stack:', err instanceof Error ? err.stack : 'No stack')
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
