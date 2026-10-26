import type { VercelRequest, VercelResponse } from '@vercel/node'
import { FieldValue } from 'firebase-admin/firestore'
import { db, verifyRequestUser } from './_lib/firebaseAdmin.js'
import { todayInTimezone } from './_lib/date.js'
import {
  earnedBadges,
  evaluateAndPersist,
  participations,
  type ParticipationDoc,
} from './_lib/campaigns.js'
import { importStravaActivities } from './_lib/stravaImport.js'
import type { CampaignParticipation } from '../src/features/meaningful/domain/types.js'
import { CampaignCatalogService } from '../src/features/meaningful/services/CampaignCatalogService.js'
import { CampaignPeriodService } from '../src/features/meaningful/services/CampaignPeriodService.js'
import {
  ParticipationRulesService,
  participationId,
} from '../src/features/meaningful/services/ParticipationRulesService.js'

interface JoinBody {
  campaignId?: string
  trackId?: string
  statisticId?: string | null
  goalId?: string
}

/**
 * Joins a campaign, or changes the selection while it's still unlocked.
 * Always targets the campaign's current or next occurrence in the user's
 * own timezone, then backfills Strava activities for the month so far and
 * evaluates progress straight away.
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

  const body = req.body as JoinBody
  if (!body.campaignId || !body.trackId || !body.goalId) {
    res.status(400).json({ error: 'Missing campaignId, trackId or goalId' })
    return
  }
  const campaign = CampaignCatalogService.getCampaignById(body.campaignId)
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' })
    return
  }

  const userSnap = await db.collection('users').doc(userId).get()
  const timezone = (userSnap.get('timezone') as string | undefined) ?? 'UTC'
  const todayIso = todayInTimezone(timezone)
  const period = CampaignPeriodService.getCurrentOrNextPeriod(
    campaign.month,
    todayIso,
  )
  const id = participationId(userId, campaign.id, period.year)

  const selectionInput = {
    trackId: body.trackId,
    statisticId: body.statisticId ?? null,
    goalId: body.goalId,
  }

  // Check-and-write in one transaction, so a webhook evaluation that locks
  // the participation concurrently can't be overwritten by this join.
  const joinError = await db.runTransaction(async (tx) => {
    const participationRef = participations().doc(id)
    const [existingSnap, badgeSnap] = await Promise.all([
      tx.get(participationRef),
      tx.get(earnedBadges().doc(id)),
    ])
    if (badgeSnap.exists) return 'already_completed' as const

    const existing = existingSnap.exists
      ? ({ id, ...existingSnap.data() } as CampaignParticipation)
      : null
    const selection = ParticipationRulesService.validateSelection(
      campaign,
      existing,
      selectionInput,
    )
    if (!selection.ok) return selection.error

    const fields: Omit<ParticipationDoc, 'progress'> = {
      userId,
      campaignId: campaign.id,
      year: period.year,
      ...selection.selection,
      lockedAt: null,
      status: 'active',
    }
    tx.set(
      participationRef,
      {
        ...fields,
        timezone,
        updatedAt: FieldValue.serverTimestamp(),
        ...(existing ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true },
    )
    return null
  })
  if (joinError) {
    const conflict = joinError === 'locked' || joinError === 'already_completed'
    res.status(conflict ? 409 : 400).json({ error: joinError })
    return
  }

  if (CampaignPeriodService.getPhase(period, todayIso) === 'active') {
    try {
      await importStravaActivities(userId, period.startDate, todayIso)
    } catch (error) {
      // Joining must not fail on Strava; the webhook and later
      // re-evaluations still pick activities up.
      console.error('Strava backfill on campaign join failed', error)
    }
  }

  const result = await evaluateAndPersist(campaign, id)
  res.status(200).json({ participationId: id, ...result })
}
