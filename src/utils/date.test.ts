import { describe, expect, it } from 'vitest'
import { addDaysToIsoDate, daysBetweenIsoDates, todayInTimezone } from './date'

describe('addDaysToIsoDate', () => {
  it('adds days within the same month', () => {
    expect(addDaysToIsoDate('2026-03-01', 5)).toBe('2026-03-06')
  })

  it('rolls over into the next month', () => {
    expect(addDaysToIsoDate('2026-01-30', 3)).toBe('2026-02-02')
  })

  it('rolls over into the next year', () => {
    expect(addDaysToIsoDate('2025-12-30', 3)).toBe('2026-01-02')
  })

  it('handles a leap day correctly', () => {
    expect(addDaysToIsoDate('2024-02-28', 1)).toBe('2024-02-29')
  })

  it('supports zero days (identity)', () => {
    expect(addDaysToIsoDate('2026-05-15', 0)).toBe('2026-05-15')
  })
})

describe('daysBetweenIsoDates', () => {
  it('returns 0 for the same date', () => {
    expect(daysBetweenIsoDates('2026-03-01', '2026-03-01')).toBe(0)
  })

  it('returns a positive count for a later date', () => {
    expect(daysBetweenIsoDates('2026-03-01', '2026-03-10')).toBe(9)
  })

  it('returns a negative count for an earlier date', () => {
    expect(daysBetweenIsoDates('2026-03-10', '2026-03-01')).toBe(-9)
  })

  it('handles a span crossing a year boundary', () => {
    expect(daysBetweenIsoDates('2025-12-30', '2026-01-02')).toBe(3)
  })
})

describe('todayInTimezone', () => {
  it('returns a well-formed ISO date string', () => {
    const result = todayInTimezone('Europe/Oslo')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
