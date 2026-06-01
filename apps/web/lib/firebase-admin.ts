import admin from 'firebase-admin'

const firebaseConfigured = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
)

function getApp() {
  if (!firebaseConfigured) return null
  if (admin.apps.length > 0) return admin.apps[0]!

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export type NotificationPayload = {
  title: string
  body: string
  data?: Record<string, string>
}

export async function sendPushNotification(
  fcmTokens: string[],
  payload: NotificationPayload,
): Promise<void> {
  const app = getApp()
  if (!app || fcmTokens.length === 0) {
    console.log(`🔔 [PUSH FALLBACK] ${payload.title}: ${payload.body}`)
    return
  }

  const messaging = admin.messaging(app)

  const chunks: string[][] = []
  for (let i = 0; i < fcmTokens.length; i += 500) {
    chunks.push(fcmTokens.slice(i, i + 500))
  }

  for (const chunk of chunks) {
    await messaging.sendEachForMulticast({
      tokens: chunk,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
      android: { priority: 'high' },
      webpush: {
        headers: { Urgency: 'high' },
        notification: { icon: '/icon-192.png', badge: '/badge-72.png' },
      },
    })
  }
}

export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload,
): Promise<void> {
  const { prisma } = await import('@ve/db')
  const tokens = await prisma.userFcmToken.findMany({
    where: { userId },
    select: { fcmToken: true },
  })
  const tokenList = tokens.map((t: any) => t.fcmToken)
  await sendPushNotification(tokenList, payload)
}

export function isFirebaseConfigured() {
  return firebaseConfigured
}
