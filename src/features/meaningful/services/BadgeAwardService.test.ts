import { describe, expect, it } from 'vitest'
import { BADGE_TIERS } from '@/features/meaningful/domain/badgeTiers'
import type { CampaignParticipation } from '@/features/meaningful/domain/types'
import {
  makeActivity,
  makeCampaign,
} from '@/features/meaningful/testing/fixtures'
import { BadgeAwardService } from './BadgeAwardService'
import { CampaignPeriodService } from './CampaignPeriodService'
import { CampaignProgressService } from './CampaignProgressService'
import { participationId } from './ParticipationRulesService'

const campaign = makeCampaign()
const november = CampaignPeriodService.getPeriod(11, 2026)
const track = campaign.tracks[0]!

function participation(goalId: string): CampaignParticipation {
  return {
    id: participationId('user-1', campaign.id, 2026),
    userId: 'user-1',
    campaignId: campaign.id,
    year: 2026,
    trackId: 'on-foot',
    statisticId: 'stat-1',
    goalId,
    lockedAt: '2026-11-02T08:00:00Z',
    status: 'active',
  }
}

function evaluateFor(goalId: string, distances: number[]) {
  const goal = campaign.goals.find((g) => g.id === goalId)!
  return CampaignProgressService.evaluateGoal({
    goal,
    track,
    period: november,
    activities: distances.map((distanceKm, i) =>
      makeActivity({
        startLocal: `2026-11-${String(i + 1).padStart(2, '0')}T07:00:00`,
        distanceKm,
      }),
    ),
  })
}

describe('BadgeAwardService.decideAward', () => {
  it.each([
    ['goal-easy', 'EASY', 'bronze'],
    ['goal-medium', 'MEDIUM', 'silver'],
    ['goal-hard', 'HARD', 'gold'],
  ] as const)(
    'awards the %s badge at its own difficulty',
    (goalId, difficulty, tier) => {
      const badge = BadgeAwardService.decideAward(
        campaign,
        participation(goalId),
        evaluateFor(goalId, [30, 30]),
        new Set(),
      )
      expect(badge?.difficulty).toBe(difficulty)
      expect(BADGE_TIERS[badge!.difficulty].tier).toBe(tier)
    },
  )

  it('never upgrades the tier for going beyond an easier goal', () => {
    // 100 km is past the Gold target, but the user locked in Easy.
    const badge = BadgeAwardService.decideAward(
      campaign,
      participation('goal-easy'),
      evaluateFor('goal-easy', [50, 50]),
      new Set(),
    )
    expect(badge?.difficulty).toBe('EASY')
  })

  it('awards nothing until the goal is complete', () => {
    expect(
      BadgeAwardService.decideAward(
        campaign,
        participation('goal-hard'),
        evaluateFor('goal-hard', [20, 20]),
        new Set(),
      ),
    ).toBe(null)
  })

  it('records when and with which activities it was earned', () => {
    const badge = BadgeAwardService.decideAward(
      campaign,
      participation('goal-easy'),
      evaluateFor('goal-easy', [4, 4, 4]),
      new Set(),
    )
    expect(badge).toMatchObject({
      id: 'user-1_test-campaign_2026',
      year: 2026,
      goalId: 'goal-easy',
      badgeName: 'Bronze badge',
      completedOn: '2026-11-03',
    })
    expect(badge?.qualifyingActivityIds).toHaveLength(3)
  })

  it('does not award a second badge for the same campaign and year', () => {
    const p = participation('goal-easy')
    expect(
      BadgeAwardService.decideAward(
        campaign,
        p,
        evaluateFor('goal-easy', [20]),
        new Set([p.id]),
      ),
    ).toBe(null)
  })

  it('gives each year its own badge ID', () => {
    expect(participationId('user-1', 'movember', 2026)).not.toBe(
      participationId('user-1', 'movember', 2027),
    )
  })

  it('refuses a goal that does not belong to the participation’s track', () => {
    const p = { ...participation('goal-easy'), trackId: 'cycling' }
    expect(
      BadgeAwardService.decideAward(
        campaign,
        p,
        evaluateFor('goal-easy', [20]),
        new Set(),
      ),
    ).toBe(null)
  })
})
