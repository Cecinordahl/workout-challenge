import { KM_PER_MILE } from '@/features/activities/constants'
import type {
  CampaignGoal,
  CampaignStatistic,
  StatisticValue,
} from '@/features/meaningful/domain/types'
import type { DistanceUnit } from '@/types/user'
import type { CampaignPeriod, CampaignPhase } from './CampaignPeriodService'

// Client-only display helpers — not part of the code shared with api/.

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function trimNumber(value: number, digits = 1): string {
  return Number(value.toFixed(digits)).toLocaleString('en-GB')
}

/** "41.0 million", "727,000", "73" — big numbers in words, so estimates don't look like exact counts. */
function compactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} billion`
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} million`
  }
  return trimNumber(value)
}

function distanceLabel(km: number, unit: DistanceUnit): string {
  const kmText = `${trimNumber(km)} km`
  return unit === 'mi'
    ? `${kmText} (${trimNumber(km / KM_PER_MILE)} mi)`
    : kmText
}

export const CampaignFormatService = {
  monthName(month: number): string {
    return MONTH_NAMES[month - 1] ?? ''
  },

  /** "November 2026" */
  periodLabel(period: CampaignPeriod): string {
    return `${this.monthName(period.month)} ${period.year}`
  },

  phaseLabel(phase: CampaignPhase): string {
    return { upcoming: 'Coming up', active: 'Happening now', ended: 'Ended' }[
      phase
    ]
  },

  /** The headline number, with "about"/range wording that matches how certain it is. */
  statisticValue(value: StatisticValue): string {
    switch (value.kind) {
      case 'exact':
        return compactNumber(value.value)
      case 'estimate':
        return `~${compactNumber(value.value)}`
      case 'range':
        return `~${compactNumber(value.value)}`
    }
  },

  /**
   * The number plus what it counts, so no headline is a bare figure:
   * "~73%", "No. 3", or "~727,000" with "deaths" beside it.
   */
  statisticHeadline(statistic: CampaignStatistic): {
    value: string
    unit: string | null
  } {
    const value = this.statisticValue(statistic.value)
    if (statistic.unit.startsWith('%'))
      return { value: `${value}%`, unit: null }
    if (statistic.unit.startsWith('rank')) {
      return { value: `No. ${value}`, unit: null }
    }
    return { value, unit: statistic.unit }
  },

  /** Secondary line for estimates with an uncertainty range. */
  statisticRange(value: StatisticValue): string | null {
    if (value.kind !== 'range') return null
    return `Range ${compactNumber(value.low)}–${compactNumber(value.high)}`
  },

  /** What the goal asks for, in plain words. */
  goalTarget(goal: CampaignGoal, unit: DistanceUnit): string {
    switch (goal.goalType) {
      case 'totalDistance':
        return `${distanceLabel(goal.target, unit)} in total`
      case 'singleActivityDistance':
        return `${distanceLabel(goal.target, unit)} in a single activity`
      case 'activeDays':
        return `${goal.target} active days`
      case 'totalDuration':
        return `${goal.target} minutes in total`
    }
  },

  /** Progress in the goal's own unit, e.g. "12.5 / 60 km". */
  goalProgress(goal: CampaignGoal, progressValue: number, unit: DistanceUnit) {
    switch (goal.goalType) {
      case 'totalDistance':
      case 'singleActivityDistance':
        return unit === 'mi'
          ? `${trimNumber(progressValue / KM_PER_MILE)} / ${trimNumber(goal.target / KM_PER_MILE)} mi`
          : `${trimNumber(progressValue)} / ${trimNumber(goal.target)} km`
      case 'activeDays':
        return `${progressValue} / ${goal.target} days`
      case 'totalDuration':
        return `${Math.round(progressValue)} / ${goal.target} min`
    }
  },

  /** "4 Nov 2026" */
  shortDate(isoDate: string): string {
    return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
  },

  /** "Checked 26 Oct 2026" */
  verifiedLabel(isoDate: string): string {
    return `Checked ${this.shortDate(isoDate)}`
  },
}
