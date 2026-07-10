import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyRequestUser } from './_lib/firebaseAdmin.js'
import { saveConnection } from './_lib/fitnessConnections.js'
import { exchangeAuthorizationCode } from './_lib/strava.js'

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

  const { code } = req.body as { code?: string }
  if (!code) {
    res.status(400).json({ error: 'Missing authorization code' })
    return
  }

  try {
    const token = await exchangeAuthorizationCode(code)
    if (!token.athlete) {
      res.status(502).json({ error: 'Strava did not return athlete info' })
      return
    }
    await saveConnection(userId, 'strava', {
      providerAthleteId: String(token.athlete.id),
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_at,
    })
    res.status(200).json({ connected: true, athleteId: token.athlete.id })
  } catch (error) {
    console.error('Strava token exchange failed', error)
    res.status(502).json({ error: 'Failed to connect to Strava' })
  }
}
