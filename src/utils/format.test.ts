import { describe, expect, it } from 'vitest'
import { formatGoalValue } from './format'

describe('formatGoalValue', () => {
  it('formats a distance goal in km', () => {
    expect(formatGoalValue(3.2, 'distance')).toBe('3.2 km')
  })

  it('formats a time goal in minutes', () => {
    expect(formatGoalValue(25, 'time')).toBe('25 min')
  })
})
