/**
 * Suggested total-distance goals (km) for the standard challenge durations.
 * Only these exact durations have defined presets; any other duration is
 * custom-goal-only.
 */
const DISTANCE_GOAL_SUGGESTIONS: Record<number, number[]> = {
  7: [10, 15, 20, 25, 30],
  14: [20, 30, 40, 50, 60],
  30: [50, 70, 90, 120, 150],
  90: [150, 200, 300, 400, 500],
}

export function getGoalSuggestions(durationDays: number): number[] | null {
  return DISTANCE_GOAL_SUGGESTIONS[durationDays] ?? null
}
