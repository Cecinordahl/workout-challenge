import { describe, expect, it } from 'vitest'
import type {
  CampaignParticipation,
  CampaignSelection,
} from '@/features/meaningful/domain/types'
import {
  makeCampaign,
  makeDefaultGoals,
  makeGoal,
} from '@/features/meaningful/testing/fixtures'
import type { GoalEvaluation } from './CampaignProgressService'
import {
  ParticipationRulesService,
  participationId,
} from './ParticipationRulesService'

const campaign = makeCampaign({
  tracks: [
    { id: 'on-foot', label: 'On foot', activityTypes: ['run', 'walk'] },
    { id: 'cycling', label: 'Cycling', activityTypes: ['ride'] },
  ],
  goals: [
    ...makeDefaultGoals(),
    makeGoal({
      id: 'c-easy',
      trackId: 'cycling',
      difficulty: 'EASY',
      target: 30,
    }),
    makeGoal({
      id: 'c-medium',
      trackId: 'cycling',
      difficulty: 'MEDIUM',
      target: 90,
    }),
    makeGoal({
      id: 'c-hard',
      trackId: 'cycling',
      difficulty: 'HARD',
      target: 180,
    }),
    makeGoal({
      id: 's2-easy',
      statisticId: 'stat-2',
      difficulty: 'EASY',
      target: 10,
    }),
    makeGoal({
      id: 's2-medium',
      statisticId: 'stat-2',
      difficulty: 'MEDIUM',
      target: 30,
    }),
    makeGoal({
      id: 's2-hard',
      statisticId: 'stat-2',
      difficulty: 'HARD',
      target: 154,
    }),
  ],
})

function participation(
  overrides: Partial<CampaignParticipation> = {},
): CampaignParticipation {
  return {
    id: participationId('user-1', campaign.id, 2026),
    userId: 'user-1',
    campaignId: campaign.id,
    year: 2026,
    trackId: 'on-foot',
    statisticId: 'stat-1',
    goalId: 'goal-medium',
    lockedAt: null,
    status: 'active',
    ...overrides,
  }
}

function evaluation(countedActivityIds: string[]): GoalEvaluation {
  return {
    progressValue: countedActivityIds.length,
    target: 30,
    percent: 0,
    completed: false,
    completedOn: null,
    countedActivityIds,
    qualifyingActivityIds: [],
  }
}

function select(
  selection: Partial<CampaignSelection>,
  existing: CampaignParticipation | null = null,
) {
  return ParticipationRulesService.validateSelection(campaign, existing, {
    trackId: 'on-foot',
    statisticId: 'stat-1',
    goalId: 'goal-easy',
    ...selection,
  })
}

describe('ParticipationRulesService.validateSelection', () => {
  it('accepts a statistic and one of the goals it offers', () => {
    expect(select({ goalId: 'goal-hard' })).toEqual({
      ok: true,
      selection: {
        trackId: 'on-foot',
        statisticId: 'stat-1',
        goalId: 'goal-hard',
      },
    })
  })

  it("accepts a statistic's own goals and rejects the defaults it replaces", () => {
    expect(select({ statisticId: 'stat-2', goalId: 's2-hard' }).ok).toBe(true)
    expect(select({ statisticId: 'stat-2', goalId: 'goal-hard' })).toEqual({
      ok: false,
      error: 'goalNotOffered',
    })
  })

  it('accepts no statistic, using the default goals', () => {
    expect(select({ statisticId: null, goalId: 'goal-easy' }).ok).toBe(true)
  })

  it('rejects a goal from a different track', () => {
    expect(select({ trackId: 'on-foot', goalId: 'c-hard' })).toEqual({
      ok: false,
      error: 'goalNotOffered',
    })
    expect(select({ trackId: 'cycling', goalId: 'goal-hard' })).toEqual({
      ok: false,
      error: 'goalNotOffered',
    })
    expect(select({ trackId: 'cycling', goalId: 'c-hard' }).ok).toBe(true)
  })

  it('rejects unknown tracks and statistics', () => {
    expect(select({ trackId: 'swim' })).toEqual({
      ok: false,
      error: 'unknownTrack',
    })
    expect(select({ statisticId: 'nope' })).toEqual({
      ok: false,
      error: 'unknownStatistic',
    })
  })

  it('allows changing the selection before progress begins', () => {
    expect(select({ goalId: 'goal-easy' }, participation()).ok).toBe(true)
  })

  it('rejects any change once the participation is locked', () => {
    const locked = participation({ lockedAt: '2026-11-02T08:00:00Z' })
    expect(select({ goalId: 'goal-easy' }, locked)).toEqual({
      ok: false,
      error: 'locked',
    })
  })
})

describe('ParticipationRulesService.applyLock', () => {
  const now = '2026-11-02T08:00:00Z'

  it('stays unlocked while no activity counts', () => {
    const p = participation()
    expect(ParticipationRulesService.applyLock(p, evaluation([]), now)).toBe(p)
  })

  it('locks on the first counted activity', () => {
    expect(
      ParticipationRulesService.applyLock(
        participation(),
        evaluation(['a1']),
        now,
      ).lockedAt,
    ).toBe(now)
  })

  it('keeps the original lock time', () => {
    const p = participation({ lockedAt: '2026-11-01T09:00:00Z' })
    expect(
      ParticipationRulesService.applyLock(p, evaluation(['a1']), now),
    ).toBe(p)
  })
})
