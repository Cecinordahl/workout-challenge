export interface DailySpan {
  min: number
  max: number
}

/**
 * Suggests a daily min/max span from the average daily value. Derived from
 * the spec's own examples (avg 3 km/day -> 1-5 km; avg 6 km/day -> 2-10 km),
 * both of which fit min = avg/3, max = avg * 5/3 exactly.
 */
export function suggestDailySpan(averagePerDay: number): DailySpan {
  return {
    min: averagePerDay / 3,
    max: (averagePerDay * 5) / 3,
  }
}
