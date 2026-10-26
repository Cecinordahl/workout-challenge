import type { ActivityType } from '../../../types/activity.js'

export type CampaignStatus = 'draft' | 'published'

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

export type StatisticCategory =
  | 'prevalence'
  | 'healthImpact'
  | 'prevention'
  | 'accessToCare'
  | 'progress'
  | 'context'

export type VerificationStatus = 'draft' | 'verified'

/** Estimates are never presented as exact counts, so the shape says which it is. */
export type StatisticValue =
  | { kind: 'exact'; value: number }
  | { kind: 'estimate'; value: number }
  | { kind: 'range'; value: number; low: number; high: number }

export interface SourceLink {
  label: string
  url: string
}

export interface CampaignStatistic {
  id: string
  statement: string
  value: StatisticValue
  /** Human-readable unit of `value`, e.g. "people", "deaths per hour", "%". */
  unit: string
  /** Year or period the figure describes, e.g. "2025" or "2000–2021". */
  period: string
  geography: string
  population: string
  category: StatisticCategory
  sourceOrg: string
  sourceUrl: string
  verification: VerificationStatus
  /** ISO date (YYYY-MM-DD) the figure was last checked against its source. */
  lastVerified: string | null
  /** Why this figure matters — shown when the card is opened. */
  context: string
  /** How (or whether) this figure inspires the movement goals. */
  goalMappingNote: string
}

export type GoalType =
  'totalDistance' | 'singleActivityDistance' | 'activeDays' | 'totalDuration'

export interface CampaignGoal {
  id: string
  /** Null = the campaign's standard goal, offered for any statistic without its own set. */
  statisticId: string | null
  difficulty: Difficulty
  goalType: GoalType
  /** km for distance goals, days for activeDays, minutes for totalDuration. */
  target: number
  /** The track whose activity types count toward this goal. */
  trackId: string
  symbolicExplanation: string
  badge: { name: string }
}

/**
 * A way of taking part (e.g. on foot, or cycling). Users pick exactly one,
 * and only activities of its types count — so a run never counts toward a
 * cycling goal, and each track carries targets of comparable effort.
 */
export interface CampaignTrack {
  id: string
  label: string
  activityTypes: ActivityType[]
}

export interface Campaign {
  id: string
  slug: string
  /** 1–12. Campaigns recur every year in this calendar month. */
  month: number
  title: string
  cause: string
  summary: string
  description: string
  /** lucide-react icon name used as the campaign illustration. */
  icon: string
  tracks: CampaignTrack[]
  status: CampaignStatus
  featuredStatisticId: string
  statistics: CampaignStatistic[]
  goals: CampaignGoal[]
  learnMore: SourceLink[]
  supportResources: SourceLink[]
  /** Short note on the symbolic link between movement and the cause. */
  symbolicNote: string
}

export type ParticipationStatus = 'active' | 'completed'

export interface CampaignSelection {
  trackId: string
  /** Null when the user picked the campaign's goals without choosing a statistic. */
  statisticId: string | null
  goalId: string
}

export interface CampaignParticipation extends CampaignSelection {
  /** Deterministic: `${userId}_${campaignId}_${year}`. */
  id: string
  userId: string
  campaignId: string
  /** The calendar year of the campaign month this participation covers. */
  year: number
  /** ISO datetime the selection was locked (first counted activity), or null while still editable. */
  lockedAt: string | null
  status: ParticipationStatus
}

export interface EarnedBadge {
  /** Deterministic: `${userId}_${campaignId}_${year}` — one badge per campaign per year. */
  id: string
  userId: string
  campaignId: string
  year: number
  trackId: string
  statisticId: string | null
  goalId: string
  difficulty: Difficulty
  badgeName: string
  /** Local date (YYYY-MM-DD) the target was reached. */
  completedOn: string
  qualifyingActivityIds: string[]
}
