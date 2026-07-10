import { describe, expect, it } from 'vitest'
import { recommendGoal } from './recommendGoal'

describe('recommendGoal', () => {
  it('ramps the beginner distance recommendation using the 10%/week rule, capped at week 10', () => {
    expect(recommendGoal('beginner', 'distance', 7)).toMatchObject({
      targetValue: 10.5,
    })
    expect(recommendGoal('beginner', 'distance', 30)).toMatchObject({
      targetValue: 53.1,
    })
    // Beyond week 10 the weekly rate holds flat, so growth slows relative
    // to a naive continued-compounding projection.
    expect(recommendGoal('beginner', 'distance', 90)).toMatchObject({
      targetValue: 238.1,
    })
    // Non-multiple-of-7 duration still sums day-by-day correctly.
    expect(recommendGoal('beginner', 'distance', 10)).toMatchObject({
      targetValue: 15.5,
    })
  })

  it('uses a flat weekly rate for moderate distance', () => {
    expect(recommendGoal('moderate', 'distance', 7)).toMatchObject({
      targetValue: 35,
    })
    expect(recommendGoal('moderate', 'distance', 30)).toMatchObject({
      targetValue: 150,
    })
  })

  it('uses a flat weekly rate for advanced distance', () => {
    expect(recommendGoal('advanced', 'distance', 7)).toMatchObject({
      targetValue: 45,
    })
    expect(recommendGoal('advanced', 'distance', 30)).toMatchObject({
      targetValue: 192.9,
    })
  })

  it('uses flat CDC-guideline weekly minutes for each level', () => {
    expect(recommendGoal('beginner', 'time', 7)).toMatchObject({
      targetValue: 150,
    })
    expect(recommendGoal('moderate', 'time', 7)).toMatchObject({
      targetValue: 225,
    })
    expect(recommendGoal('advanced', 'time', 7)).toMatchObject({
      targetValue: 300,
    })
  })

  it('derives a daily min/max span that always keeps the goal feasible', () => {
    for (const level of ['beginner', 'moderate', 'advanced'] as const) {
      for (const goalType of ['distance', 'time'] as const) {
        for (const durationDays of [7, 10, 30, 90]) {
          const result = recommendGoal(level, goalType, durationDays)
          expect(result.dailyMinimum).toBeLessThanOrEqual(
            result.targetValue / durationDays,
          )
          expect(result.dailyMaximum).toBeGreaterThanOrEqual(
            result.targetValue / durationDays,
          )
          expect(durationDays * result.dailyMinimum).toBeLessThanOrEqual(
            result.targetValue,
          )
          expect(durationDays * result.dailyMaximum).toBeGreaterThanOrEqual(
            result.targetValue,
          )
        }
      }
    }
  })

  it('cites CDC for every time-based recommendation and the level-specific source for distance', () => {
    expect(recommendGoal('beginner', 'time', 30).source.name).toContain('CDC')
    expect(recommendGoal('beginner', 'distance', 30).source.name).toContain(
      'RRCA',
    )
    expect(recommendGoal('moderate', 'distance', 30).source.name).toContain(
      'Hal Higdon',
    )
    expect(recommendGoal('advanced', 'distance', 30).source.name).toContain(
      'Marathon Handbook',
    )
  })
})
