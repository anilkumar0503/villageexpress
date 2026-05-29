import { NextResponse } from 'next/server'
import { getSession, getUserPermissions } from './session'

export function unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
  return NextResponse.json({ success: false, error: message, code }, { status: 401 })
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ success: false, error: message }, { status: 403 })
}

export async function requireAuth(req: Request) {
  try {
    const session = await getSession(req)
    if (!session) return { error: unauthorized('Session expired', 'TOKEN_EXPIRED'), session: null }
    return { error: null, session }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
      return { error: unauthorized('Token expired', 'TOKEN_EXPIRED'), session: null }
    }
    return { error: unauthorized(), session: null }
  }
}

export async function requirePermission(req: Request, permission: string) {
  const { error, session } = await requireAuth(req)
  if (error || !session) return { error: error ?? unauthorized(), session: null }

  const permissions = await getUserPermissions(session.userId)
  if (!permissions.includes(permission)) {
    return { error: forbidden(`Missing permission: ${permission}`), session: null }
  }

  return { error: null, session }
}

export async function requireAnyRole(req: Request, roles: string[]) {
  const { error, session } = await requireAuth(req)
  if (error || !session) return { error: error ?? unauthorized(), session: null }

  const permissions = await getUserPermissions(session.userId)

  const rolePermMap: Record<string, string> = {
    SUPER_ADMIN: 'role:manage',
    ADMIN: 'user:approve',
    POINT_MANAGER: 'booking:assign_captain',
    CAPTAIN: 'booking:update_status',
    CUSTOMER: 'booking:create',
  }

  const hasRole = roles.some((role) => {
    const sentinel = rolePermMap[role]
    return sentinel ? permissions.includes(sentinel) : false
  })

  if (!hasRole) return { error: forbidden('Insufficient role'), session: null }
  return { error: null, session }
}
