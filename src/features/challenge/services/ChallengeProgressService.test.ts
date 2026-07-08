import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import { ChallengeProgressService } from './ChallengeProgressService'
import type { Challenge } from '@/types/challenge'
import type { DailyResult } from '@/types/dailyResult'

function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: 'challenge-1',
    ownerId: 'user-1',
    title: 'Test Challenge',
    createdAt: Timestamp.now(),
    startDate: '2026-01-01',
    endDate: '2026-01-10',
    durationDays: 10,
    goalType: 'distance',
    targetValue: 30,
    dailyMinimum: 1,
    dailyMaximum: 5,
    allowedSkips: 2,
    algorithmVersion: 'v1',
    randomSeed: 'progress-fixture',
    status: 'active',
    locked: false,
    completed: false,
    cancelled: false,
    ...overrides,
  }
}

function makeResult(overrides: Partial<DailyResult> = {}): DailyResult {
  return {
    id: 'result-1',
    challengeId: 'challenge-1',
    userId: 'user-1',
    dayIndex: 0,
    date: '2026-01-01',
    status: 'completed',
    pointsAwarded: 10,
    completedAt: Timestamp.now(),
    ...overrides,
  }
}

describe('ChallengeProgressService.computeProgress', () => {
  it('increments the streak the moment today is completed', () => {
    const challenge = makeChallenge()
    const results = [makeResult({ dayIndex: 0, status: 'completed' })]
    const progress = ChallengeProgressService.computeProgress(
      challenge,
      results,
      '2026-01-01',
    )
    expect(progress.currentStreak).toBe(1)
    expect(progress.totalPoints).toBe(10)
    expect(progress.completedDays).toBe(1)
  })

  it('does not count an unacted-on today as a miss', () => {
    const challenge = makeChallenge()
    const progress = ChallengeProgressService.computeProgress(
      challenge,
      [],
      '2026-01-01',
    )
    expect(progress.currentStreak).toBe(0)
    expect(progress.totalPoints).toBe(0)
  })

  it('breaks the streak on a genuinely missed earlier day', () => {
    const challenge = makeChallenge()
    const results = [
      makeResult({ id: 'r0', dayIndex: 0, status: 'completed' }),
      // day 1 missing entirely -> missed
      makeResult({ id: 'r2', dayIndex: 2, status: 'completed' }),
    ]
    const progress = ChallengeProgressService.computeProgress(
      challenge,
      results,
      '2026-01-03',
    )
    expect(progress.currentStreak).toBe(1) // only today (day 2) counts
    expect(progress.completedDays).toBe(2)
  })

  it('returns zeroed progress before the challenge starts', () => {
    const challenge = makeChallenge({ startDate: '2026-02-01' })
    const progress = ChallengeProgressService.computeProgress(
      challenge,
      [],
      '2026-01-01',
    )
    expect(progress.dayIndex).toBeNull()
    expect(progress.currentStreak).toBe(0)
  })
})
