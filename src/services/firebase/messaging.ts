import {
  getMessaging,
  getToken,
  isSupported,
  type Messaging,
} from 'firebase/messaging'
import { firebaseApp, firebaseConfig } from '@/services/firebase/config'

/**
 * FCM requires a service worker for background push delivery. It can't read
 * Vite's `import.meta.env`, so the (non-secret) web config is passed as
 * query params on registration and read back via `self.location.search`.
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const params = new URLSearchParams(firebaseConfig)
  return navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${params.toString()}`,
  )
}

/** Returns null in environments without FCM support (SSR, unsupported browsers). */
export async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (!(await isSupported())) return null
  return getMessaging(firebaseApp)
}

/**
 * Requests notification permission and, if granted, registers this device
 * for push by minting an FCM token. Returns null if unsupported, denied, or
 * no VAPID key is configured — callers should treat that as "push isn't
 * available right now," not an error.
 */
export async function requestFcmToken(): Promise<string | null> {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) return null

  const messaging = await getMessagingIfSupported()
  if (!messaging) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const serviceWorkerRegistration = await registerServiceWorker()
  return getToken(messaging, { vapidKey, serviceWorkerRegistration })
}
