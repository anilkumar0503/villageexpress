import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import bcrypt from 'bcryptjs'
import { sendPasswordChangedEmail } from '@/lib/email'

const schema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { token, password } = parsed.data

    // Find valid reset token
    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!reset) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 },
      )
    }

    if (reset.used) {
      return NextResponse.json(
        { success: false, error: 'This reset link has already been used' },
        { status: 400 },
      )
    }

    if (reset.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Reset token has expired' },
        { status: 400 },
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user password
    await prisma.user.update({
      where: { id: reset.userId },
      data: { password: hashedPassword },
    })

    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { used: true },
    })

    // Send password changed email
    if (reset.user.email) {
      await sendPasswordChangedEmail(reset.user.email, reset.user.name)
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    })
  } catch (err) {
    console.error('[AUTH/PASSWORD-RESET/RESET]', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
