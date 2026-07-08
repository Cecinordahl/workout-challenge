import { describe, expect, it } from 'vitest'
import { StreakService } from './StreakService'

describe('StreakService.calculateCurrentStreak', () => {
  it('returns 0 for no history', () => {
    expect(StreakService.calculateCurrentStreak([])).toBe(0)
  })

  it('counts an unbroken run of completed days', () => {
    expect(
      StreakService.calculateCurrentStreak([
        'completed',
        'completed',
        'completed',
      ]),
    ).toBe(3)
  })

  it('stops counting at the first missed day', () => {
    expect(
      StreakService.calculateCurrentStreak([
        'completed',
        'completed',
        'missed',
        'completed',
        'completed',
      ]),
    ).toBe(2)
  })

  it('treats skipped days as neutral, not breaking the streak', () => {
    expect(
      StreakService.calculateCurrentStreak([
        'completed',
        'skipped',
        'completed',
        'completed',
      ]),
    ).toBe(3)
  })

  it('returns 0 when the most recent day was missed', () => {
    expect(
      StreakService.calculateCurrentStreak([
        'missed',
        'completed',
        'completed',
      ]),
    ).toBe(0)
  })

  it('returns 0 when only skips precede a miss and nothing else', () => {
    expect(
      StreakService.calculateCurrentStreak(['skipped', 'skipped', 'missed']),
    ).toBe(0)
  })
})
