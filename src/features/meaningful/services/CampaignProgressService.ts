import type {
  CampaignGoal,
  CampaignTrack,
} from '@/features/meaningful/domain/types'
import type { Activity } from '@/types/activity'
import {
  CampaignPeriodService,
  type CampaignPeriod,
} from './CampaignPeriodService'

/** An activity shorter than this doesn't make a day "active". */
export const ACTIVE_DAY_MIN_MINUTES = 10

/** Rounds away float drift (e.g. 0.1 + 0.2) so a 60.0 km total isn't read as 59.999…. */
function roundValue(value: number): number {
  return Math.round(value * 1000) / 1000
}

export interface GoalEvaluation {
  /** Progress in the goal's unit: km, days or minutes. */
  progressValue: number
  target: number
  /** 0–100, capped. */
  percent: number
  completed: boolean
  /** Local date the target was reached, or null. */
  completedOn: string | null
  /** Every distinct activity that counts toward this goal. */
  countedActivityIds: string[]
  /** The activities that reached the target — exactly one for single-activity goals. */
  qualifyingActivityIds: string[]
}

export interface EvaluateGoalInput {
  goal: CampaignGoal
  track: CampaignTrack
  period: CampaignPeriod
  activities: Activity[]
}

/**
 * Activities eligible for a goal, deduplicated by ID and in chronological
 * order. Only the chosen track's activity types count, so a run never
 * counts toward a cycling goal.
 */
function eligibleActivities(
  track: CampaignTrack,
  period: CampaignPeriod,
  activities: Activity[],
): Activity[] {
  const allowedTypes = new Set(track.activityTypes)
  const byId = new Map<string, Activity>()
  for (const activity of activities) {
    if (byId.has(activity.id)) continue
    if (!allowedTypes.has(activity.type)) continue
    if (!CampaignPeriodService.contains(period, activity.localDate)) continue
    byId.set(activity.id, activity)
  }
  return [...byId.values()].sort(
    (a, b) =>
      a.startLocal.localeCompare(b.startLocal) || a.id.localeCompare(b.id),
  )
}

/** Accumulates `valueOf` in order and reports where the running total first reaches the target. */
function evaluateCumulative(
  activities: Activity[],
  target: number,
  valueOf: (activity: Activity) => number,
): Pick<
  GoalEvaluation,
  'progressValue' | 'completedOn' | 'qualifyingActivityIds'
> {
  let total = 0
  let completedOn: string | null = null
  const qualifying: string[] = []
  for (const activity of activities) {
    const value = valueOf(activity)
    if (value <= 0) continue
    total = roundValue(total + value)
    if (completedOn === null) {
      qualifying.push(activity.id)
      if (total >= target) completedOn = activity.localDate
    }
  }
  return {
    progressValue: total,
    completedOn,
    qualifyingActivityIds: completedOn === null ? [] : qualifying,
  }
}

export const CampaignProgressService = {
  evaluateGoal({
    goal,
    track,
    period,
    activities,
  }: EvaluateGoalInput): GoalEvaluation {
    const eligible = eligibleActivities(track, period, activities)
    let result: Pick<
      GoalEvaluation,
      'progressValue' | 'completedOn' | 'qualifyingActivityIds'
    >
    let counted: Activity[] = eligible

    switch (goal.goalType) {
      case 'totalDistance':
        counted = eligible.filter((a) => a.distanceKm > 0)
        result = evaluateCumulative(counted, goal.target, (a) => a.distanceKm)
        break

      case 'totalDuration':
        counted = eligible.filter((a) => a.durationMin > 0)
        result = evaluateCumulative(counted, goal.target, (a) => a.durationMin)
        break

      case 'singleActivityDistance': {
        // Judged one activity at a time — several short activities never
        // combine to meet a single-activity target.
        counted = eligible.filter((a) => a.distanceKm > 0)
        const qualifying = counted.find((a) => a.distanceKm >= goal.target)
        result = {
          progressValue: roundValue(
            Math.max(0, ...counted.map((a) => a.distanceKm)),
          ),
          completedOn: qualifying?.localDate ?? null,
          qualifyingActivityIds: qualifying ? [qualifying.id] : [],
        }
        break
      }

      case 'activeDays': {
        counted = eligible.filter(
          (a) => a.durationMin >= ACTIVE_DAY_MIN_MINUTES,
        )
        const firstPerDay = new Map<string, Activity>()
        for (const activity of counted) {
          if (!firstPerDay.has(activity.localDate)) {
            firstPerDay.set(activity.localDate, activity)
          }
        }
        result = evaluateCumulative(
          [...firstPerDay.values()],
          goal.target,
          () => 1,
        )
        break
      }
    }

    return {
      ...result,
      target: goal.target,
      percent: Math.min(
        100,
        Math.round((result.progressValue / goal.target) * 100),
      ),
      completed: result.completedOn !== null,
      countedActivityIds: counted.map((a) => a.id),
    }
  },
}
