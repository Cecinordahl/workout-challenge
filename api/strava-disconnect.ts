import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyRequestUser } from './_lib/firebaseAdmin.js'
import { deleteConnection, getConnection } from './_lib/fitnessConnections.js'
import { deauthorize } from './_lib/strava.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const userId = await verifyRequestUser(req.headers.authorization)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const connection = await getConnection(userId, 'strava')
  if (connection) {
    try {
      await deauthorize(connection.accessToken)
    } catch (error) {
      // Not fatal — proceed to forget the connection locally either way.
      console.error('Strava deauthorize call failed', error)
    }
    await deleteConnection(userId, 'strava')
  }

  res.status(200).json({ disconnected: true })
}
