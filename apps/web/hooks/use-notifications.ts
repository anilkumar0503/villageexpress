'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from './use-auth'

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

const isConfigured = !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.messagingSenderId && VAPID_KEY)

export function useNotifications() {
  const { accessToken, user } = useAuth()
  const registered = useRef(false)

  useEffect(() => {
    if (!accessToken || !user || !isConfigured || registered.current) return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    async function register() {
      try {
        const { initializeApp, getApps } = await import('firebase/app')
        const { getMessaging, getToken, onMessage } = await import('firebase/messaging')

        const app = getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_CONFIG)
        const messaging = getMessaging(app)

        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

        swReg.active?.postMessage({ type: 'FIREBASE_CONFIG', config: FIREBASE_CONFIG })

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })

        await fetch('/api/profile/fcm-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ fcmToken: token }),
        })

        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification ?? {}
          if (title && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: body ?? '', icon: '/icon-192.png' })
          }
        })

        registered.current = true
      } catch (err) {
        console.warn('[FCM] Registration failed:', err)
      }
    }

    register()
  }, [accessToken, user])
}
