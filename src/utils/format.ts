import type { GoalType } from '@/types/challenge'

export function formatGoalValue(value: number, goalType: GoalType): string {
  return goalType === 'distance' ? `${value} km` : `${value} min`
}
