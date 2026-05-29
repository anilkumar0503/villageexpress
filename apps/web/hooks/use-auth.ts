'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

type AuthUser = {
  id: string
  displayId: string
  name: string
  email: string | null
  roles: string[]
}

type AuthStore = {
  user: AuthUser | null
  accessToken: string | null
  setAuth: (user: AuthUser, token: string) => void
  clearAuth: () => void
  hasRole: (role: string) => boolean
  isAuthenticated: () => boolean
  syncFromCookies: () => void
  handleAuthError: () => void
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
      hasRole: (role) => get().user?.roles.includes(role) ?? false,
      isAuthenticated: () => !!get().accessToken,
      syncFromCookies: () => {
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(';').shift()
          return null
        }
        const token = getCookie('access_token')
        if (token && !get().accessToken) {
          set({ accessToken: token })
        }
      },
      handleAuthError: () => {
        set({ user: null, accessToken: null })
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      },
    }),
    { name: 've-auth' },
  ),
)

export function useAuthSync() {
  const syncFromCookies = useAuth((state) => state.syncFromCookies)
  useEffect(() => {
    syncFromCookies()
  }, [syncFromCookies])
}

export function useFetchWithAuth() {
  const { accessToken, handleAuthError } = useAuth()

  return async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.status === 401) {
      handleAuthError()
      throw new Error('Unauthorized')
    }

    return response
  }
}
