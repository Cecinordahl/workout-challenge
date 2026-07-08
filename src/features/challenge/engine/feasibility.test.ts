import { describe, expect, it } from 'vitest'
import { checkFeasibility } from './feasibility'
import type { ChallengeParams } from './types'

function makeParams(overrides: Partial<ChallengeParams> = {}): ChallengeParams {
  return {
    durationDays: 30,
    goalType: 'distance',
    targetValue: 90,
    dailyMinimum: 1,
    dailyMaximum: 5,
    randomSeed: 'seed',
    ...overrides,
  }
}

describe('checkFeasibility', () => {
  it('accepts a well-formed, reachable goal', () => {
    expect(checkFeasibility(makeParams())).toEqual({ feasible: true })
  })

  it('rejects a goal below the daily-minimum floor', () => {
    const result = checkFeasibility(
      makeParams({ targetValue: 10, dailyMinimum: 1, durationDays: 30 }),
    )
    expect(result.feasible).toBe(false)
    expect(result.reason).toMatch(/too small/i)
  })

  it('rejects a goal above the daily-maximum ceiling', () => {
    const result = checkFeasibility(
      makeParams({ targetValue: 1000, dailyMaximum: 5, durationDays: 30 }),
    )
    expect(result.feasible).toBe(false)
    expect(result.reason).toMatch(/too large/i)
  })

  it('rejects a non-positive duration', () => {
    expect(checkFeasibility(makeParams({ durationDays: 0 })).feasible).toBe(
      false,
    )
  })

  it('rejects a non-positive daily minimum', () => {
    expect(checkFeasibility(makeParams({ dailyMinimum: 0 })).feasible).toBe(
      false,
    )
  })

  it('rejects a maximum below the minimum', () => {
    const result = checkFeasibility(
      makeParams({ dailyMinimum: 5, dailyMaximum: 1 }),
    )
    expect(result.feasible).toBe(false)
  })

  it('accepts the exact boundary where target equals duration * minimum', () => {
    const result = checkFeasibility(
      makeParams({ durationDays: 10, dailyMinimum: 2, targetValue: 20 }),
    )
    expect(result.feasible).toBe(true)
  })

  it('accepts the exact boundary where target equals duration * maximum', () => {
    const result = checkFeasibility(
      makeParams({ durationDays: 10, dailyMaximum: 2, targetValue: 20 }),
    )
    expect(result.feasible).toBe(true)
  })
})
