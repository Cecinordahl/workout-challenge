import type { Activity } from '../../../types/activity.js'
import type {
  Campaign,
  CampaignParticipation,
  EarnedBadge,
} from '../domain/types.js'
import { BadgeAwardService } from './BadgeAwardService.js'
import { CampaignCatalogService } from './CampaignCatalogService.js'
import { CampaignPeriodService } from './CampaignPeriodService.js'
import {
  CampaignProgressService,
  type GoalEvaluation,
} from './CampaignProgressService.js'
import { ParticipationRulesService } from './ParticipationRulesService.js'

export interface ParticipationProgress {
  progressValue: number
  target: number
  percent: number
  completed: boolean
  completedOn: string | null
  countedActivityCount: number
}

export interface EvaluationOutcome {
  participation: CampaignParticipation
  progress: ParticipationProgress
  /** A badge to create now, or null (not complete, or already awarded). */
  newBadge: EarnedBadge | null
}

function toProgress(evaluation: GoalEvaluation): ParticipationProgress {
  return {
    progressValue: evaluation.progressValue,
    target: evaluation.target,
    percent: evaluation.percent,
    completed: evaluation.completed,
    completedOn: evaluation.completedOn,
    countedActivityCount: evaluation.countedActivityIds.length,
  }
}

export const CampaignEvaluationService = {
  /**
   * One full re-evaluation of a participation from the ledger: progress,
   * lock, and whether a badge is now due. Pure, so the server route that
   * persists the outcome only does I/O. Returns null if the participation
   * no longer matches the campaign's configuration.
   */
  evaluate(
    campaign: Campaign,
    participation: CampaignParticipation,
    activities: Activity[],
    hasBadge: boolean,
    nowIso: string,
  ): EvaluationOutcome | null {
    const goal = CampaignCatalogService.getGoal(campaign, participation.goalId)
    const track = CampaignCatalogService.getTrack(
      campaign,
      participation.trackId,
    )
    if (!goal || !track || goal.trackId !== track.id) return null

    const period = CampaignPeriodService.getPeriod(
      campaign.month,
      participation.year,
    )
    const evaluation = CampaignProgressService.evaluateGoal({
      goal,
      track,
      period,
      activities: activities.filter((a) => a.userId === participation.userId),
    })

    const locked = ParticipationRulesService.applyLock(
      participation,
      evaluation,
      nowIso,
    )
    const newBadge = BadgeAwardService.decideAward(
      campaign,
      locked,
      evaluation,
      hasBadge ? new Set([participation.id]) : new Set(),
    )

    return {
      participation:
        newBadge || hasBadge ? { ...locked, status: 'completed' } : locked,
      progress: toProgress(evaluation),
      newBadge,
    }
  },
}
