importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// Config is injected at runtime via postMessage from the app
let messaging

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    firebase.initializeApp(event.data.config)
    messaging = firebase.messaging()

    messaging.onBackgroundMessage((payload) => {
      const { title, body } = payload.notification ?? {}
      if (!title) return
      self.registration.showNotification(title, {
        body: body ?? '',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: payload.data,
      })
    })
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(clients.openWindow(url))
})
