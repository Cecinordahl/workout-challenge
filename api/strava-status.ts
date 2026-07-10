import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyRequestUser } from './_lib/firebaseAdmin.js'
import { getConnection } from './_lib/fitnessConnections.js'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  const userId = await verifyRequestUser(req.headers.authorization)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const connection = await getConnection(userId, 'strava')
  if (!connection) {
    res.status(200).json({ connected: false })
    return
  }

  res.status(200).json({
    connected: true,
    athleteId: connection.providerAthleteId,
  })
}
