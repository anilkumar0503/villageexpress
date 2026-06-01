import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@ve/db'
import { requireAuth } from '@/lib/auth/permissions'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(req)
  if (error) return error

  const userRoles = await prisma.userRole.findMany({
    where: { userId: session!.userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  })

  const permissions = new Set<string>()
  for (const ur of userRoles) {
    for (const rp of ur.role.rolePermissions) {
      const permName = rp.permission.name
      if (rp.scope === 'GLOBAL') {
        permissions.add(permName)
      } else {
        permissions.add(`${permName}:${rp.scope}`)
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      permissions: Array.from(permissions),
      roles: userRoles.map((ur: any) => ur.role.name),
    },
  })
}
