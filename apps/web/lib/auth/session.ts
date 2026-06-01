import { cookies } from 'next/headers'
import { prisma } from '@ve/db'
import { verifyAccessToken, type AccessTokenPayload } from './jwt'

export type SessionUser = {
  id: string
  displayId: string
  name: string
  email: string | null
  phone: string
  roles: string[]
  permissions: string[]
}

const permissionCache = new Map<string, { data: string[]; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

export async function getSession(req?: Request): Promise<AccessTokenPayload | null> {
  try {
    let token: string | undefined

    if (req) {
      const authHeader = req.headers.get('authorization')
      token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
    } else {
      const cookieStore = await cookies()
      token = cookieStore.get('access_token')?.value
    }

    if (!token) return null
    return await verifyAccessToken(token)
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
      return null
    }
    return null
  }
}

export async function getSessionUser(userId: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  })

  if (!user || !user.isActive) return null

  const roles = user.userRoles.map((ur: any) => ur.role.name)
  const permissions: string[] = [
    ...new Set(
      user.userRoles.flatMap((ur: any) =>
        ur.role.rolePermissions.map((rp: any) => rp.permission.name),
      ),
    ),
  ]

  return {
    id: user.id,
    displayId: user.displayId,
    name: user.name,
    email: user.email ?? null,
    phone: user.phone,
    roles,
    permissions,
  }
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const cached = permissionCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: { rolePermissions: { include: { permission: true } } },
          },
        },
      },
    },
  })

  const permissions = [
    ...new Set(
      (user?.userRoles ?? []).flatMap((ur: any) =>
        ur.role.rolePermissions.map((rp: any) => rp.permission.name),
      ),
    ),
  ]

  permissionCache.set(userId, { data: permissions, expiresAt: Date.now() + CACHE_TTL_MS })
  return permissions
}

export function clearPermissionCache(userId: string): void {
  permissionCache.delete(userId)
}
