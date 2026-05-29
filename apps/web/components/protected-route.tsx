'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/use-permissions'
import { useRole } from '@/hooks/use-role'
import { useAuth } from '@/hooks/use-auth'

type ProtectedRouteProps = {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  role?: string
  roles?: string[]
  requireAllRoles?: boolean
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  permission,
  permissions = [],
  requireAll = false,
  role,
  roles = [],
  requireAllRoles = false,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter()
  const { accessToken, user } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading: permsLoading } = usePermissions()
  const { hasRole, hasAnyRole, hasAllRoles } = useRole()

  useEffect(() => {
    if (!accessToken || !user) {
      router.push('/login')
      return
    }

    if (permsLoading) return

    let hasAccess = true

    if (permission) {
      hasAccess = hasPermission(permission)
    } else if (permissions.length > 0) {
      hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)
    }

    if (role) {
      hasAccess = hasAccess && hasRole(role)
    } else if (roles.length > 0) {
      hasAccess = hasAccess && (requireAllRoles ? hasAllRoles(roles) : hasAnyRole(roles))
    }

    if (!hasAccess) {
      router.push('/403')
    }
  }, [accessToken, user, permsLoading, permission, permissions, requireAll, role, roles, requireAllRoles, router, hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, hasAllRoles])

  if (!accessToken || !user || permsLoading) {
    return fallback ?? <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return <>{children}</>
}
