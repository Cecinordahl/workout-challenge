import { describe, expect, it } from 'vitest'
import { getGoalSuggestions } from './goalSuggestions'

describe('getGoalSuggestions', () => {
  it('returns the standard suggestions for a 7-day challenge', () => {
    expect(getGoalSuggestions(7)).toEqual([10, 15, 20, 25, 30])
  })

  it('returns the standard suggestions for a 14-day challenge', () => {
    expect(getGoalSuggestions(14)).toEqual([20, 30, 40, 50, 60])
  })

  it('returns the standard suggestions for a 30-day challenge', () => {
    expect(getGoalSuggestions(30)).toEqual([50, 70, 90, 120, 150])
  })

  it('returns the standard suggestions for a 90-day challenge', () => {
    expect(getGoalSuggestions(90)).toEqual([150, 200, 300, 400, 500])
  })

  it('returns null for a non-standard duration, signalling custom-only', () => {
    expect(getGoalSuggestions(21)).toBeNull()
    expect(getGoalSuggestions(10)).toBeNull()
  })
})
