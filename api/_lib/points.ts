/**
 * Deliberately duplicated from
 * src/features/challenge/services/PointsService.ts on the client — keep in
 * sync if either changes.
 */
import type { DayType } from './engine/types.js'

const POINTS_BY_DAY_TYPE: Record<DayType, number> = {
  normal: 10,
  recovery: 10,
  hero: 20,
}

export function pointsForDay(dayType: DayType): number {
  return POINTS_BY_DAY_TYPE[dayType]
}
