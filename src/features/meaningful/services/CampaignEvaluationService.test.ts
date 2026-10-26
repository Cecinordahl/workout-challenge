import { describe, expect, it } from 'vitest'
import type { CampaignParticipation } from '@/features/meaningful/domain/types'
import {
  makeActivity,
  makeCampaign,
} from '@/features/meaningful/testing/fixtures'
import { CampaignEvaluationService } from './CampaignEvaluationService'
import { participationId } from './ParticipationRulesService'

const NOW = '2026-11-20T10:00:00.000Z'
const campaign = makeCampaign()

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
    goalId: 'goal-easy',
    lockedAt: null,
    status: 'active',
    ...overrides,
  }
}

function evaluate(
  p: CampaignParticipation,
  distances: number[],
  hasBadge = false,
) {
  return CampaignEvaluationService.evaluate(
    campaign,
    p,
    distances.map((distanceKm, i) =>
      makeActivity({
        startLocal: `2026-11-${String(i + 1).padStart(2, '0')}T07:00:00`,
        distanceKm,
      }),
    ),
    hasBadge,
    NOW,
  )
}

describe('CampaignEvaluationService.evaluate', () => {
  it('leaves a participation without counted activity unlocked', () => {
    const outcome = evaluate(participation(), [])
    expect(outcome?.participation.lockedAt).toBe(null)
    expect(outcome?.progress).toEqual({
      progressValue: 0,
      target: 10,
      percent: 0,
      completed: false,
      completedOn: null,
      countedActivityCount: 0,
    })
    expect(outcome?.newBadge).toBe(null)
  })

  it('locks on the first counted activity without awarding early', () => {
    const outcome = evaluate(participation(), [4])
    expect(outcome?.participation.lockedAt).toBe(NOW)
    expect(outcome?.participation.status).toBe('active')
    expect(outcome?.newBadge).toBe(null)
  })

  it('awards the badge and completes the participation on reaching the goal', () => {
    const outcome = evaluate(participation(), [6, 6])
    expect(outcome?.newBadge).toMatchObject({
      id: 'user-1_test-campaign_2026',
      difficulty: 'EASY',
      completedOn: '2026-11-02',
    })
    expect(outcome?.participation.status).toBe('completed')
  })

  it('never awards a second badge on re-evaluation', () => {
    const outcome = evaluate(
      participation({ lockedAt: NOW, status: 'completed' }),
      [6, 6, 6],
      true,
    )
    expect(outcome?.newBadge).toBe(null)
    expect(outcome?.participation.status).toBe('completed')
  })

  it("ignores other users' activities", () => {
    const outcome = CampaignEvaluationService.evaluate(
      campaign,
      participation(),
      [makeActivity({ userId: 'someone-else', distanceKm: 50 })],
      false,
      NOW,
    )
    expect(outcome?.progress.progressValue).toBe(0)
  })

  it('returns null for a goal that no longer exists', () => {
    expect(evaluate(participation({ goalId: 'removed' }), [10])).toBe(null)
  })
})
