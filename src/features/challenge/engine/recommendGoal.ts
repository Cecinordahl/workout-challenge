import type { GoalType } from '@/types/challenge'
import { roundForGoalType } from './roundForGoalType'
import { suggestDailySpan } from './suggestDailySpan'

export type RunnerLevel = 'beginner' | 'moderate' | 'advanced'

export interface RecommendationSource {
  name: string
  url: string
}

export interface Recommendation {
  targetValue: number
  dailyMinimum: number
  dailyMaximum: number
  source: RecommendationSource
}

const RRCA_SOURCE: RecommendationSource = {
  name: 'RRCA — 10-Week Training Plan for New Runners',
  url: 'https://www.rrca.org/education/for-runners/10-week-training-plan/',
}
const HAL_HIGDON_SOURCE: RecommendationSource = {
  name: 'Hal Higdon — Intermediate Base Training Program',
  url: 'https://www.halhigdon.com/training-programs/base-training/intermediate-base-training/',
}
const MARATHON_HANDBOOK_SOURCE: RecommendationSource = {
  name: 'Marathon Handbook — Advanced 5K Training Plan',
  url: 'https://marathonhandbook.com/advanced-5k-training-plan/',
}
const CDC_SOURCE: RecommendationSource = {
  name: 'CDC — Physical Activity Guidelines for Adults',
  url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',
}

function sourceFor(
  level: RunnerLevel,
  goalType: GoalType,
): RecommendationSource {
  if (goalType === 'time') return CDC_SOURCE
  if (level === 'beginner') return RRCA_SOURCE
  if (level === 'moderate') return HAL_HIGDON_SOURCE
  return MARATHON_HANDBOOK_SOURCE
}

const FLAT_WEEKLY_RATE_KM: Record<Exclude<RunnerLevel, 'beginner'>, number> = {
  moderate: 35,
  advanced: 45,
}
const FLAT_WEEKLY_RATE_MINUTES: Record<RunnerLevel, number> = {
  beginner: 150,
  moderate: 225,
  advanced: 300,
}

/**
 * RRCA's own beginner plan states a starting point of "5 to 8 miles per
 * week" (~10.5 km) and a "no more than 10% increase per week" progression
 * rule. Compounding that rule from the stated start point reproduces RRCA's
 * own stated week-10 range almost exactly (10.5 * 1.1^9 ≈ 24.75 km vs their
 * stated 16-32 km), so it's used verbatim rather than an invented curve. The
 * ramp holds flat past week 10 since that's the plan's full length.
 */
const BEGINNER_DISTANCE_START_WEEKLY_KM = 10.5
const BEGINNER_DISTANCE_WEEKLY_GROWTH = 1.1
const BEGINNER_DISTANCE_RAMP_WEEKS = 10

function beginnerDistanceWeeklyRate(week: number): number {
  const cappedWeek = Math.min(week, BEGINNER_DISTANCE_RAMP_WEEKS)
  return (
    BEGINNER_DISTANCE_START_WEEKLY_KM *
    BEGINNER_DISTANCE_WEEKLY_GROWTH ** (cappedWeek - 1)
  )
}

function beginnerDistanceTotal(durationDays: number): number {
  let total = 0
  for (let day = 1; day <= durationDays; day++) {
    const week = Math.ceil(day / 7)
    total += beginnerDistanceWeeklyRate(week) / 7
  }
  return total
}

function rawWeeklyTotal(
  level: RunnerLevel,
  goalType: GoalType,
  durationDays: number,
): number {
  if (goalType === 'time') {
    return (FLAT_WEEKLY_RATE_MINUTES[level] * durationDays) / 7
  }
  if (level === 'beginner') {
    return beginnerDistanceTotal(durationDays)
  }
  return (FLAT_WEEKLY_RATE_KM[level] * durationDays) / 7
}

export function recommendGoal(
  level: RunnerLevel,
  goalType: GoalType,
  durationDays: number,
): Recommendation {
  const targetValue = roundForGoalType(
    rawWeeklyTotal(level, goalType, durationDays),
    goalType,
  )
  const span = suggestDailySpan(targetValue / durationDays)

  return {
    targetValue,
    dailyMinimum: roundForGoalType(span.min, goalType),
    dailyMaximum: roundForGoalType(span.max, goalType),
    source: sourceFor(level, goalType),
  }
}
