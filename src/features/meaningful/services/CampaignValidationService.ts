import { DIFFICULTIES } from '@/features/meaningful/domain/badgeTiers'
import type {
  Campaign,
  CampaignGoal,
  CampaignStatistic,
} from '@/features/meaningful/domain/types'
import { daysBetweenIsoDates } from '@/utils/date'

export interface ValidationResult {
  errors: string[]
  warnings: string[]
}

export const MIN_VERIFIED_STATISTICS = 5
const STALE_AFTER_DAYS = 365
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

function validateStatistic(
  stat: CampaignStatistic,
  todayIso: string,
  result: ValidationResult,
): void {
  const where = `statistic "${stat.id}"`
  if (isBlank(stat.statement)) result.errors.push(`${where}: empty statement`)
  if (!Number.isFinite(stat.value.value)) {
    result.errors.push(`${where}: value is not a finite number`)
  }
  if (
    stat.value.kind === 'range' &&
    !(stat.value.low <= stat.value.value && stat.value.value <= stat.value.high)
  ) {
    result.errors.push(`${where}: value must lie within its low–high range`)
  }

  // Drafts may be incomplete — they never reach users.
  if (stat.verification !== 'verified') return

  const requiredText: [string, string][] = [
    ['sourceOrg', stat.sourceOrg],
    ['period', stat.period],
    ['geography', stat.geography],
    ['population', stat.population],
    ['unit', stat.unit],
    ['context', stat.context],
    ['goalMappingNote', stat.goalMappingNote],
  ]
  for (const [field, value] of requiredText) {
    if (isBlank(value)) result.errors.push(`${where}: missing ${field}`)
  }
  if (!isHttpsUrl(stat.sourceUrl)) {
    result.errors.push(`${where}: sourceUrl must be a valid https URL`)
  }
  if (stat.lastVerified === null || !isValidIsoDate(stat.lastVerified)) {
    result.errors.push(`${where}: verified without a valid lastVerified date`)
  } else if (daysBetweenIsoDates(todayIso, stat.lastVerified) > 0) {
    result.errors.push(`${where}: lastVerified is in the future`)
  } else if (
    daysBetweenIsoDates(stat.lastVerified, todayIso) > STALE_AFTER_DAYS
  ) {
    result.warnings.push(
      `${where}: last verified over ${STALE_AFTER_DAYS} days ago — re-check the source`,
    )
  }
}

function validateGoal(goal: CampaignGoal, result: ValidationResult): void {
  const where = `goal "${goal.id}"`
  if (!Number.isFinite(goal.target) || goal.target <= 0) {
    result.errors.push(`${where}: target must be a positive number`)
  }
  if (goal.goalType === 'activeDays' && goal.target > 31) {
    result.errors.push(`${where}: activeDays target cannot exceed 31`)
  }
  if (goal.eligibleActivityTypes?.length === 0) {
    result.errors.push(`${where}: eligibleActivityTypes override is empty`)
  }
  if (isBlank(goal.badge.name))
    result.errors.push(`${where}: missing badge name`)
  if (isBlank(goal.symbolicExplanation)) {
    result.errors.push(`${where}: missing symbolicExplanation`)
  }
}

/** Each goal set (the defaults, or one statistic's own) needs exactly one goal per difficulty, ordered by target. */
function validateGoalSet(
  label: string,
  goals: CampaignGoal[],
  result: ValidationResult,
): void {
  for (const difficulty of DIFFICULTIES) {
    const count = goals.filter((g) => g.difficulty === difficulty).length
    if (count !== 1) {
      result.errors.push(
        `${label}: expected exactly one ${difficulty} goal, found ${count}`,
      )
    }
  }

  const ordered = DIFFICULTIES.map((d) => goals.find((g) => g.difficulty === d))
  for (let i = 1; i < ordered.length; i++) {
    const easier = ordered[i - 1]
    const harder = ordered[i]
    if (
      easier &&
      harder &&
      easier.goalType === harder.goalType &&
      easier.target >= harder.target
    ) {
      result.errors.push(
        `${label}: ${harder.difficulty} target must be greater than ${easier.difficulty}`,
      )
    }
  }
}

export const CampaignValidationService = {
  /**
   * Checks one campaign's configuration. Errors block publishing; warnings
   * flag content that is publishable but needs editorial attention.
   */
  validateCampaign(campaign: Campaign, todayIso: string): ValidationResult {
    const result: ValidationResult = { errors: [], warnings: [] }
    const isPublished = campaign.status === 'published'

    if (
      !Number.isInteger(campaign.month) ||
      campaign.month < 1 ||
      campaign.month > 12
    ) {
      result.errors.push('month must be an integer from 1 to 12')
    }
    if (!SLUG_PATTERN.test(campaign.slug)) {
      result.errors.push(`slug "${campaign.slug}" must be lowercase kebab-case`)
    }
    if (campaign.eligibleActivityTypes.length === 0) {
      result.errors.push('eligibleActivityTypes must not be empty')
    }
    for (const link of [...campaign.learnMore, ...campaign.supportResources]) {
      if (!isHttpsUrl(link.url)) {
        result.errors.push(`link "${link.label}" must be a valid https URL`)
      }
    }

    const statsById = new Map<string, CampaignStatistic>()
    for (const stat of campaign.statistics) {
      if (statsById.has(stat.id)) {
        result.errors.push(`duplicate statistic id "${stat.id}"`)
      }
      statsById.set(stat.id, stat)
      validateStatistic(stat, todayIso, result)
    }

    const featured = statsById.get(campaign.featuredStatisticId)
    if (!featured) {
      result.errors.push(
        `featuredStatisticId "${campaign.featuredStatisticId}" does not exist`,
      )
    } else if (isPublished && featured.verification !== 'verified') {
      result.errors.push('featured statistic must be verified')
    }

    const verifiedCount = campaign.statistics.filter(
      (s) => s.verification === 'verified',
    ).length
    if (isPublished && verifiedCount < MIN_VERIFIED_STATISTICS) {
      result.warnings.push(
        `only ${verifiedCount} verified statistics (aim for ${MIN_VERIFIED_STATISTICS}+)`,
      )
    }

    const goalIds = new Set<string>()
    const goalsByStatistic = new Map<string | null, CampaignGoal[]>()
    for (const goal of campaign.goals) {
      if (goalIds.has(goal.id))
        result.errors.push(`duplicate goal id "${goal.id}"`)
      goalIds.add(goal.id)
      validateGoal(goal, result)

      if (goal.statisticId !== null) {
        const stat = statsById.get(goal.statisticId)
        if (!stat) {
          result.errors.push(
            `goal "${goal.id}": unknown statisticId "${goal.statisticId}"`,
          )
        } else if (isPublished && stat.verification !== 'verified') {
          result.errors.push(
            `goal "${goal.id}": linked statistic "${stat.id}" is not verified`,
          )
        }
      }
      const set = goalsByStatistic.get(goal.statisticId) ?? []
      set.push(goal)
      goalsByStatistic.set(goal.statisticId, set)
    }

    const defaults = goalsByStatistic.get(null) ?? []
    validateGoalSet('default goals', defaults, result)

    for (const [statisticId, goals] of goalsByStatistic) {
      if (statisticId === null) continue
      validateGoalSet(`goals for "${statisticId}"`, goals, result)

      // A statistic-specific set must not offer an easier route to the same badge tier.
      for (const goal of goals) {
        const fallback = defaults.find((d) => d.difficulty === goal.difficulty)
        if (
          fallback &&
          fallback.goalType === goal.goalType &&
          goal.target < fallback.target
        ) {
          result.warnings.push(
            `goal "${goal.id}" is easier than the default ${goal.difficulty} goal`,
          )
        }
      }
    }

    return result
  },

  /** Validates every campaign plus the rules that span the catalogue. */
  validateCatalogue(
    campaigns: readonly Campaign[],
    todayIso: string,
  ): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>()
    const seenIds = new Set<string>()
    const seenSlugs = new Set<string>()
    const publishedMonths = new Set<number>()

    for (const campaign of campaigns) {
      const result = this.validateCampaign(campaign, todayIso)
      if (seenIds.has(campaign.id)) {
        result.errors.push(`duplicate campaign id "${campaign.id}"`)
      }
      if (seenSlugs.has(campaign.slug)) {
        result.errors.push(`duplicate campaign slug "${campaign.slug}"`)
      }
      if (campaign.status === 'published') {
        if (publishedMonths.has(campaign.month)) {
          result.errors.push(
            `another published campaign already uses month ${campaign.month}`,
          )
        }
        publishedMonths.add(campaign.month)
      }
      seenIds.add(campaign.id)
      seenSlugs.add(campaign.slug)
      results.set(campaign.id, result)
    }
    return results
  },
}
