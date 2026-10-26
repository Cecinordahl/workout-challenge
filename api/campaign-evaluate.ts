import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyRequestUser } from './_lib/firebaseAdmin.js'
import { evaluateAndPersist, participations } from './_lib/campaigns.js'
import { CampaignCatalogService } from '../src/features/meaningful/services/CampaignCatalogService.js'

/**
 * Re-evaluates one of the caller's participations — used after the client
 * adds or deletes a manual activity. Strava activities trigger this from
 * the webhook instead.
 */
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

  const { participationId } = req.body as { participationId?: string }
  if (!participationId) {
    res.status(400).json({ error: 'Missing participationId' })
    return
  }

  const snap = await participations().doc(participationId).get()
  if (!snap.exists || snap.get('userId') !== userId) {
    res.status(404).json({ error: 'Participation not found' })
    return
  }
  const campaign = CampaignCatalogService.getCampaignById(
    snap.get('campaignId') as string,
  )
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' })
    return
  }

  res.status(200).json(await evaluateAndPersist(campaign, participationId))
}
