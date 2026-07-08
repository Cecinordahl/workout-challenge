import { describe, expect, it } from 'vitest'
import { ChallengeEngineV1 } from './ChallengeEngineV1'
import type { ChallengeParams, DailyPlan } from './types'

const engine = new ChallengeEngineV1()

function makeParams(overrides: Partial<ChallengeParams> = {}): ChallengeParams {
  return {
    durationDays: 30,
    goalType: 'distance',
    targetValue: 90,
    dailyMinimum: 1,
    dailyMaximum: 5,
    randomSeed: 'test-seed',
    ...overrides,
  }
}

function sum(plan: DailyPlan[]): number {
  return (
    Math.round(plan.reduce((total, day) => total + day.value, 0) * 100) / 100
  )
}

function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

describe('ChallengeEngineV1', () => {
  it('is deterministic for the same params and seed', () => {
    const params = makeParams()
    const planA = engine.generatePlan(params)
    const planB = engine.generatePlan(params)
    expect(planA).toEqual(planB)
  })

  it('produces a different plan for a different seed', () => {
    const planA = engine.generatePlan(makeParams({ randomSeed: 'seed-a' }))
    const planB = engine.generatePlan(makeParams({ randomSeed: 'seed-b' }))
    expect(planA).not.toEqual(planB)
  })

  it('returns exactly one entry per day, sequentially indexed', () => {
    const plan = engine.generatePlan(makeParams({ durationDays: 14 }))
    expect(plan).toHaveLength(14)
    plan.forEach((day, i) => expect(day.dayIndex).toBe(i))
  })

  describe.each([
    { durationDays: 7, targetValue: 20, dailyMinimum: 1, dailyMaximum: 5 },
    { durationDays: 14, targetValue: 40, dailyMinimum: 1, dailyMaximum: 8 },
    { durationDays: 30, targetValue: 90, dailyMinimum: 1, dailyMaximum: 5 },
    { durationDays: 30, targetValue: 180, dailyMinimum: 2, dailyMaximum: 10 },
    { durationDays: 90, targetValue: 300, dailyMinimum: 1, dailyMaximum: 8 },
  ])(
    'plan for $durationDays days / target $targetValue',
    ({ durationDays, targetValue, dailyMinimum, dailyMaximum }) => {
      const plan = engine.generatePlan(
        makeParams({ durationDays, targetValue, dailyMinimum, dailyMaximum }),
      )

      it('sums exactly to the target', () => {
        expect(sum(plan)).toBeCloseTo(targetValue, 5)
      })

      it('keeps every day within [dailyMinimum, dailyMaximum]', () => {
        for (const day of plan) {
          expect(day.value).toBeGreaterThanOrEqual(dailyMinimum - 1e-9)
          expect(day.value).toBeLessThanOrEqual(dailyMaximum + 1e-9)
        }
      })

      it('makes day 0 easier than the first week average', () => {
        const firstWeek = plan.slice(0, Math.min(7, durationDays))
        const firstWeekAverage = average(firstWeek.map((d) => d.value))
        expect(plan[0]!.value).toBeLessThanOrEqual(firstWeekAverage)
      })

      it('has a hero day followed immediately by a recovery day in every full week', () => {
        const numFullWeeks = Math.floor(durationDays / 7)
        for (let week = 0; week < numFullWeeks; week++) {
          const weekDays = plan.slice(week * 7, week * 7 + 7)
          const heroDays = weekDays.filter((d) => d.type === 'hero')
          const recoveryDays = weekDays.filter((d) => d.type === 'recovery')
          expect(heroDays).toHaveLength(1)
          expect(recoveryDays).toHaveLength(1)
          expect(recoveryDays[0]!.dayIndex).toBe(heroDays[0]!.dayIndex + 1)
        }
      })
    },
  )

  it('eases the final week relative to a full-length earlier week', () => {
    const plan = engine.generatePlan(
      makeParams({
        durationDays: 28,
        targetValue: 84,
        dailyMinimum: 1,
        dailyMaximum: 6,
      }),
    )
    const week2Average = average(plan.slice(7, 14).map((d) => d.value))
    const lastWeekAverage = average(plan.slice(21, 28).map((d) => d.value))
    expect(lastWeekAverage).toBeLessThan(week2Average)
  })

  it('rounds distance goals to the nearest 0.1', () => {
    const plan = engine.generatePlan(makeParams({ goalType: 'distance' }))
    for (const day of plan) {
      expect(Math.round(day.value * 10)).toBeCloseTo(day.value * 10, 5)
    }
  })

  it('rounds time goals to the nearest whole minute', () => {
    const plan = engine.generatePlan(
      makeParams({
        goalType: 'time',
        targetValue: 600,
        dailyMinimum: 10,
        dailyMaximum: 40,
      }),
    )
    for (const day of plan) {
      expect(Number.isInteger(day.value)).toBe(true)
    }
    expect(sum(plan)).toBe(600)
  })

  it.each([1, 2, 3, 6])(
    'does not crash and stays exact for a very short %i-day challenge',
    (durationDays) => {
      const targetValue = durationDays * 3
      const plan = engine.generatePlan(
        makeParams({
          durationDays,
          targetValue,
          dailyMinimum: 1,
          dailyMaximum: 5,
        }),
      )
      expect(plan).toHaveLength(durationDays)
      expect(sum(plan)).toBeCloseTo(targetValue, 5)
    },
  )

  it('handles a duration that is not a multiple of 7', () => {
    const plan = engine.generatePlan(
      makeParams({
        durationDays: 23,
        targetValue: 69,
        dailyMinimum: 1,
        dailyMaximum: 6,
      }),
    )
    expect(plan).toHaveLength(23)
    expect(sum(plan)).toBeCloseTo(69, 5)
  })
})
