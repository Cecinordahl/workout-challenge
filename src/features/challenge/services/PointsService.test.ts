import { describe, expect, it } from 'vitest'
import { PointsService } from './PointsService'

describe('PointsService', () => {
  it('awards double points for a hero day', () => {
    expect(PointsService.pointsForDay('hero')).toBe(
      PointsService.pointsForDay('normal') * 2,
    )
  })

  it('awards the same points for normal and recovery days', () => {
    expect(PointsService.pointsForDay('recovery')).toBe(
      PointsService.pointsForDay('normal'),
    )
  })

  it('always awards a positive number of points', () => {
    expect(PointsService.pointsForDay('normal')).toBeGreaterThan(0)
    expect(PointsService.pointsForDay('recovery')).toBeGreaterThan(0)
    expect(PointsService.pointsForDay('hero')).toBeGreaterThan(0)
  })
})
