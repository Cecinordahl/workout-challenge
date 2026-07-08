import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import { ChallengeViewService } from './ChallengeViewService'
import type { Challenge } from '@/types/challenge'

function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: 'challenge-1',
    ownerId: 'user-1',
    title: 'Test Challenge',
    createdAt: Timestamp.now(),
    startDate: '2026-01-01',
    endDate: '2026-01-30',
    durationDays: 30,
    goalType: 'distance',
    targetValue: 90,
    dailyMinimum: 1,
    dailyMaximum: 5,
    allowedSkips: 3,
    algorithmVersion: 'v1',
    randomSeed: 'fixed-seed',
    status: 'active',
    locked: false,
    completed: false,
    cancelled: false,
    ...overrides,
  }
}

describe('ChallengeViewService.getView', () => {
  it('reveals day 0 as today on the start date', () => {
    const challenge = makeChallenge()
    const view = ChallengeViewService.getView(challenge, '2026-01-01')
    expect(view.hasStarted).toBe(true)
    expect(view.hasEnded).toBe(false)
    expect(view.dayIndex).toBe(0)
    expect(view.todayPlan?.dayIndex).toBe(0)
    expect(view.tomorrowPlan?.dayIndex).toBe(1)
  })

  it('reveals the correct day partway through the challenge', () => {
    const challenge = makeChallenge()
    const view = ChallengeViewService.getView(challenge, '2026-01-11')
    expect(view.dayIndex).toBe(10)
    expect(view.todayPlan?.dayIndex).toBe(10)
    expect(view.tomorrowPlan?.dayIndex).toBe(11)
  })

  it('has no tomorrow on the final day', () => {
    const challenge = makeChallenge()
    const view = ChallengeViewService.getView(challenge, '2026-01-30')
    expect(view.dayIndex).toBe(29)
    expect(view.todayPlan).not.toBeNull()
    expect(view.tomorrowPlan).toBeNull()
  })

  it('reports hasEnded once the challenge is over', () => {
    const challenge = makeChallenge()
    const view = ChallengeViewService.getView(challenge, '2026-01-31')
    expect(view.hasEnded).toBe(true)
    expect(view.dayIndex).toBeNull()
    expect(view.todayPlan).toBeNull()
    expect(view.tomorrowPlan).toBeNull()
  })

  it('reports not-yet-started before the start date', () => {
    const challenge = makeChallenge({ startDate: '2026-02-01' })
    const view = ChallengeViewService.getView(challenge, '2026-01-31')
    expect(view.hasStarted).toBe(false)
    expect(view.dayIndex).toBeNull()
    expect(view.todayPlan).toBeNull()
  })

  it('never exposes any day beyond tomorrow', () => {
    const challenge = makeChallenge()
    const view = ChallengeViewService.getView(challenge, '2026-01-11')
    const exposedIndexes = [
      view.todayPlan?.dayIndex,
      view.tomorrowPlan?.dayIndex,
    ]
    expect(exposedIndexes).toEqual([10, 11])
  })
})
