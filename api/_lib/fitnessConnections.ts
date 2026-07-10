import { FieldValue, type Timestamp } from 'firebase-admin/firestore'
import { db } from './firebaseAdmin.js'
import { refreshAccessToken } from './strava.js'

export type FitnessProvider = 'strava'

export interface FitnessConnectionDoc {
  userId: string
  provider: FitnessProvider
  providerAthleteId: string
  accessToken: string
  refreshToken: string
  expiresAt: number
  connectedAt: Timestamp
}

function docId(userId: string, provider: FitnessProvider): string {
  return `${userId}_${provider}`
}

function collection() {
  return db.collection('fitnessConnections')
}

export async function getConnection(
  userId: string,
  provider: FitnessProvider,
): Promise<FitnessConnectionDoc | null> {
  const snap = await collection().doc(docId(userId, provider)).get()
  return snap.exists ? (snap.data() as FitnessConnectionDoc) : null
}

export async function getConnectionByAthleteId(
  provider: FitnessProvider,
  providerAthleteId: string,
): Promise<{ id: string; data: FitnessConnectionDoc } | null> {
  const snap = await collection()
    .where('provider', '==', provider)
    .where('providerAthleteId', '==', providerAthleteId)
    .limit(1)
    .get()
  const doc = snap.docs[0]
  return doc ? { id: doc.id, data: doc.data() as FitnessConnectionDoc } : null
}

export async function saveConnection(
  userId: string,
  provider: FitnessProvider,
  fields: {
    providerAthleteId: string
    accessToken: string
    refreshToken: string
    expiresAt: number
  },
): Promise<void> {
  await collection()
    .doc(docId(userId, provider))
    .set({
      userId,
      provider,
      ...fields,
      connectedAt: FieldValue.serverTimestamp(),
    })
}

export async function deleteConnection(
  userId: string,
  provider: FitnessProvider,
): Promise<void> {
  await collection().doc(docId(userId, provider)).delete()
}

/** Returns a valid (non-expired) access token, refreshing via Strava first if needed. */
export async function getValidAccessToken(
  connectionId: string,
  connection: FitnessConnectionDoc,
): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (connection.expiresAt > nowSeconds + 60) {
    return connection.accessToken
  }
  const refreshed = await refreshAccessToken(connection.refreshToken)
  await collection().doc(connectionId).update({
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresAt: refreshed.expires_at,
  })
  return refreshed.access_token
}
