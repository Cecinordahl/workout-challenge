import type { GoalType } from '@/types/challenge'

/** Distance rounds to 1 decimal place; time rounds to whole minutes. */
export function roundForGoalType(value: number, goalType: GoalType): number {
  return goalType === 'distance'
    ? Math.round(value * 10) / 10
    : Math.round(value)
}
