import { describe, expect, it } from 'vitest'
import { suggestDailySpan } from './suggestDailySpan'

describe('suggestDailySpan', () => {
  it('matches the spec example: 90km / 30 days (avg 3km/day) -> 1-5km', () => {
    expect(suggestDailySpan(90 / 30)).toEqual({ min: 1, max: 5 })
  })

  it('matches the spec example: 180km / 30 days (avg 6km/day) -> 2-10km', () => {
    expect(suggestDailySpan(180 / 30)).toEqual({ min: 2, max: 10 })
  })
})
