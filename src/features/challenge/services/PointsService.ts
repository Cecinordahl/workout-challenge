import type { DayType } from '@/features/challenge/engine/types'

/**
 * Points awarded for completing a day, by day type. Hero days are worth
 * double, reflecting the extra effort. These are simple, tunable v1
 * defaults — there's no product-specified point economy yet.
 */
const POINTS_BY_DAY_TYPE: Record<DayType, number> = {
  normal: 10,
  recovery: 10,
  hero: 20,
}

export const PointsService = {
  pointsForDay(dayType: DayType): number {
    return POINTS_BY_DAY_TYPE[dayType]
  },
}
