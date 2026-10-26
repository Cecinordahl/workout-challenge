import type { Activity } from '@/types/activity'
import type {
  Campaign,
  CampaignGoal,
  CampaignStatistic,
} from '@/features/meaningful/domain/types'

export function makeStatistic(
  overrides: Partial<CampaignStatistic> = {},
): CampaignStatistic {
  return {
    id: 'stat-1',
    statement: 'A verified fact.',
    value: { kind: 'estimate', value: 10 },
    unit: 'people',
    period: '2025',
    geography: 'Global',
    population: 'Adults',
    category: 'prevalence',
    sourceOrg: 'WHO',
    sourceUrl: 'https://example.org/source',
    verification: 'verified',
    lastVerified: '2026-10-01',
    context: 'Why it matters.',
    goalMappingNote: 'Educational only.',
    ...overrides,
  }
}

export function makeGoal(overrides: Partial<CampaignGoal> = {}): CampaignGoal {
  return {
    id: 'goal-easy',
    statisticId: null,
    trackId: 'on-foot',
    difficulty: 'EASY',
    goalType: 'totalDistance',
    target: 10,
    symbolicExplanation: 'Symbolic.',
    badge: { name: 'Bronze badge' },
    ...overrides,
  }
}

export function makeDefaultGoals(): CampaignGoal[] {
  return [
    makeGoal({ id: 'goal-easy', difficulty: 'EASY', target: 10 }),
    makeGoal({ id: 'goal-medium', difficulty: 'MEDIUM', target: 30 }),
    makeGoal({ id: 'goal-hard', difficulty: 'HARD', target: 60 }),
  ]
}

/** A valid published campaign with five verified statistics. */
export function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'test-campaign',
    slug: 'test-campaign',
    month: 11,
    title: 'Test',
    cause: 'Testing',
    summary: 'Summary.',
    description: 'Description.',
    icon: 'Heart',
    tracks: [
      { id: 'on-foot', label: 'On foot', activityTypes: ['run', 'walk'] },
    ],
    status: 'published',
    featuredStatisticId: 'stat-1',
    statistics: [1, 2, 3, 4, 5].map((n) => makeStatistic({ id: `stat-${n}` })),
    goals: makeDefaultGoals(),
    learnMore: [{ label: 'Source', url: 'https://example.org' }],
    supportResources: [],
    symbolicNote: 'Symbolic note.',
    ...overrides,
  }
}

let activityCounter = 0

/** A run on 10 November 2026 unless overridden; `localDate` follows `startLocal`. */
export function makeActivity(overrides: Partial<Activity> = {}): Activity {
  activityCounter += 1
  const startLocal = overrides.startLocal ?? '2026-11-10T08:00:00'
  return {
    id: `activity-${activityCounter}`,
    userId: 'user-1',
    source: 'manual',
    type: 'run',
    distanceKm: 5,
    durationMin: 30,
    startLocal,
    localDate: startLocal.slice(0, 10),
    ...overrides,
  }
}
