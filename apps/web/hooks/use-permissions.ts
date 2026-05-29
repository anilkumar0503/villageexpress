'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './use-auth'

type PermissionCheck = (permission: string) => boolean
type PermissionsCheck = (permissions: string[]) => boolean

export function usePermissions() {
  const { accessToken, user } = useAuth()
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken || !user) {
      setPermissions(new Set())
      setLoading(false)
      return
    }

    fetch('/api/auth/permissions', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPermissions(new Set(d.data.permissions))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [accessToken, user])

  const hasPermission: PermissionCheck = (permission) => {
    if (loading) return false
    return permissions.has(permission)
  }

  const hasAnyPermission: PermissionsCheck = (perms) => {
    if (loading) return false
    return perms.some((p) => permissions.has(p))
  }

  const hasAllPermissions: PermissionsCheck = (perms) => {
    if (loading) return false
    return perms.every((p) => permissions.has(p))
  }

  return { hasPermission, hasAnyPermission, hasAllPermissions, loading }
}
