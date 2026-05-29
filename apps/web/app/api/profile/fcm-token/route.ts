import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

const schema = z.object({ fcmToken: z.string().min(10) })

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 400 })
  }

  const existing = await prisma.userFcmToken.findFirst({
    where: { userId: session!.userId, fcmToken: parsed.data.fcmToken },
  })
  if (!existing) {
    await prisma.userFcmToken.create({
      data: { userId: session!.userId, fcmToken: parsed.data.fcmToken },
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 400 })
  }

  await prisma.userFcmToken.deleteMany({
    where: { userId: session!.userId, fcmToken: parsed.data.fcmToken },
  })

  return NextResponse.json({ success: true })
}
