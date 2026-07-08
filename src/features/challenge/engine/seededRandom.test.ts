import { describe, expect, it } from 'vitest'
import { createSeededRandom } from './seededRandom'

describe('createSeededRandom', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createSeededRandom('challenge-42')
    const b = createSeededRandom('challenge-42')
    const sequenceA = Array.from({ length: 20 }, () => a())
    const sequenceB = Array.from({ length: 20 }, () => b())
    expect(sequenceA).toEqual(sequenceB)
  })

  it('produces different sequences for different seeds', () => {
    const a = createSeededRandom('challenge-42')
    const b = createSeededRandom('challenge-43')
    const sequenceA = Array.from({ length: 20 }, () => a())
    const sequenceB = Array.from({ length: 20 }, () => b())
    expect(sequenceA).not.toEqual(sequenceB)
  })

  it('always returns numbers in [0, 1)', () => {
    const random = createSeededRandom('range-check')
    for (let i = 0; i < 1000; i++) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('handles an empty seed without throwing', () => {
    const random = createSeededRandom('')
    expect(() => random()).not.toThrow()
  })
})
