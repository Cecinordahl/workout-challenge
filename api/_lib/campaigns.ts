import { FieldValue } from 'firebase-admin/firestore'
import { db } from './firebaseAdmin.js'
import type { Activity } from '../../src/types/activity.js'
import type {
  Campaign,
  CampaignParticipation,
} from '../../src/features/meaningful/domain/types.js'
import { CampaignCatalogService } from '../../src/features/meaningful/services/CampaignCatalogService.js'
import {
  CampaignEvaluationService,
  type ParticipationProgress,
} from '../../src/features/meaningful/services/CampaignEvaluationService.js'
import { CampaignPeriodService } from '../../src/features/meaningful/services/CampaignPeriodService.js'

/*
 * Campaign rules are imported from src/features/meaningful rather than
 * duplicated here (unlike ./engine): campaign content changes often, and
 * a second copy of goals and statistics would drift. See that folder's
 * README for the constraints this puts on those files.
 */

export type ParticipationDoc = Omit<CampaignParticipation, 'id'> & {
  progress: ParticipationProgress
}

export function participations() {
  return db.collection('campaignParticipations')
}

export function earnedBadges() {
  return db.collection('earnedBadges')
}

export interface PersistedEvaluation {
  participation: CampaignParticipation
  progress: ParticipationProgress
  badgeAwarded: boolean
}

/**
 * Re-evaluates one participation from the activity ledger and persists the
 * result. Runs in a transaction, and the badge uses the participation's
 * deterministic ID with `create`, so concurrent evaluations (webhook +
 * client) can never award twice.
 */
export async function evaluateAndPersist(
  campaign: Campaign,
  participationId: string,
): Promise<PersistedEvaluation | null> {
  return db.runTransaction(async (tx) => {
    const participationRef = participations().doc(participationId)
    const badgeRef = earnedBadges().doc(participationId)
    const [participationSnap, badgeSnap] = await Promise.all([
      tx.get(participationRef),
      tx.get(badgeRef),
    ])
    if (!participationSnap.exists) return null
    const stored = participationSnap.data() as ParticipationDoc
    const participation: CampaignParticipation = {
      id: participationId,
      userId: stored.userId,
      campaignId: stored.campaignId,
      year: stored.year,
      trackId: stored.trackId,
      statisticId: stored.statisticId,
      goalId: stored.goalId,
      lockedAt: stored.lockedAt,
      status: stored.status,
    }

    const period = CampaignPeriodService.getPeriod(
      campaign.month,
      participation.year,
    )
    const activitiesSnap = await tx.get(
      db
        .collection('activities')
        .where('userId', '==', participation.userId)
        .where('localDate', '>=', period.startDate)
        .where('localDate', '<=', period.endDate),
    )
    const activities = activitiesSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Activity,
    )

    const outcome = CampaignEvaluationService.evaluate(
      campaign,
      participation,
      activities,
      badgeSnap.exists,
      new Date().toISOString(),
    )
    if (!outcome) return null

    const { participation: updated, newBadge } = outcome
    tx.update(participationRef, {
      trackId: updated.trackId,
      statisticId: updated.statisticId,
      goalId: updated.goalId,
      lockedAt: updated.lockedAt,
      status: updated.status,
      progress: outcome.progress,
      evaluatedAt: FieldValue.serverTimestamp(),
    })
    if (newBadge) {
      tx.create(badgeRef, {
        userId: newBadge.userId,
        campaignId: newBadge.campaignId,
        year: newBadge.year,
        trackId: newBadge.trackId,
        statisticId: newBadge.statisticId,
        goalId: newBadge.goalId,
        difficulty: newBadge.difficulty,
        badgeName: newBadge.badgeName,
        completedOn: newBadge.completedOn,
        qualifyingActivityIds: newBadge.qualifyingActivityIds,
        earnedAt: FieldValue.serverTimestamp(),
      })
    }

    return {
      participation: outcome.participation,
      progress: outcome.progress,
      badgeAwarded: outcome.newBadge !== null,
    }
  })
}

/**
 * Re-evaluates every still-active participation whose campaign month
 * contains `localDate` — called when an activity on that date changes.
 */
export async function evaluateParticipationsForActivity(
  userId: string,
  localDate: string,
): Promise<void> {
  const snap = await participations()
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .get()
  for (const doc of snap.docs) {
    const data = doc.data() as ParticipationDoc
    const campaign = CampaignCatalogService.getCampaignById(data.campaignId)
    if (!campaign) continue
    const period = CampaignPeriodService.getPeriod(campaign.month, data.year)
    if (!CampaignPeriodService.contains(period, localDate)) continue
    await evaluateAndPersist(campaign, doc.id)
  }
}
