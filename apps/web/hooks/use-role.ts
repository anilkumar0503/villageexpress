'use client'

import { useAuth } from './use-auth'

export function useRole() {
  const { user } = useAuth()

  const hasRole = (roleName: string): boolean => {
    if (!user) return false
    return user.roles.includes(roleName)
  }

  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!user) return false
    return roleNames.some((r: string) => user.roles.includes(r))
  }

  const hasAllRoles = (roleNames: string[]): boolean => {
    if (!user) return false
    return roleNames.every((r: string) => user.roles.includes(r))
  }

  return { hasRole, hasAnyRole, hasAllRoles }
}
