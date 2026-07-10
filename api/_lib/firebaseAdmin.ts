import {
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

if (getApps().length === 0) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? '{}',
  ) as ServiceAccount
  initializeApp({ credential: cert(serviceAccount) })
}

export const db = getFirestore()
export const auth = getAuth()

/**
 * Verifies the Firebase ID token from an `Authorization: Bearer <token>`
 * header, returning the caller's uid. Used by the Strava routes to identify
 * which user is connecting/disconnecting/etc. — everything here otherwise
 * runs with the Admin SDK's full access, so this is the only thing standing
 * between "any request" and "acting as a specific user."
 */
export async function verifyRequestUser(
  authorizationHeader: string | undefined,
): Promise<string | null> {
  if (!authorizationHeader?.startsWith('Bearer ')) return null
  const idToken = authorizationHeader.slice('Bearer '.length)
  try {
    const decoded = await auth.verifyIdToken(idToken)
    return decoded.uid
  } catch {
    return null
  }
}
