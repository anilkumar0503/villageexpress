import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const user = await prisma.user.findUnique({
    where: { id: session!.userId },
    select: {
      id: true,
      displayId: true,
      name: true,
      email: true,
      userRoles: {
        select: { role: { select: { name: true } } },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: user.id,
        displayId: user.displayId,
        name: user.name,
        email: user.email,
        roles: user.userRoles.map((ur) => ur.role.name),
      },
    },
  })
}
