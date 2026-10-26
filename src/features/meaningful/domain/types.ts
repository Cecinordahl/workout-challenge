import type { ActivityType } from '@/types/activity'

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
  /** Overrides the campaign's eligible types for this goal only. */
  eligibleActivityTypes?: ActivityType[]
  symbolicExplanation: string
  badge: { name: string }
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
  eligibleActivityTypes: ActivityType[]
  status: CampaignStatus
  featuredStatisticId: string
  statistics: CampaignStatistic[]
  goals: CampaignGoal[]
  learnMore: SourceLink[]
  supportResources: SourceLink[]
  /** Short note on the symbolic link between movement and the cause. */
  symbolicNote: string
}
