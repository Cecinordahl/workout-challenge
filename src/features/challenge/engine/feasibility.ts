export interface FeasibilityParams {
  durationDays: number
  targetValue: number
  dailyMinimum: number
  dailyMaximum: number
}

export interface FeasibilityResult {
  feasible: boolean
  reason?: string
}

/**
 * Validates that a plan summing exactly to `targetValue` can possibly exist
 * within `dailyMinimum`/`dailyMaximum` bounds. This runs at challenge-creation
 * time so the engine itself never has to make an impossible jump — infeasible
 * configurations are rejected before generation is ever attempted.
 */
export function checkFeasibility(params: FeasibilityParams): FeasibilityResult {
  const { durationDays, targetValue, dailyMinimum, dailyMaximum } = params

  if (durationDays <= 0) {
    return { feasible: false, reason: 'Duration must be at least 1 day.' }
  }
  if (dailyMinimum <= 0) {
    return {
      feasible: false,
      reason: 'Daily minimum must be greater than zero.',
    }
  }
  if (dailyMaximum < dailyMinimum) {
    return {
      feasible: false,
      reason:
        'Daily maximum must be greater than or equal to the daily minimum.',
    }
  }
  if (targetValue < durationDays * dailyMinimum) {
    return {
      feasible: false,
      reason:
        'The goal is too small to reach the daily minimum every day. Lower the daily minimum or raise the goal.',
    }
  }
  if (targetValue > durationDays * dailyMaximum) {
    return {
      feasible: false,
      reason:
        'The goal is too large to reach within the daily maximum. Raise the daily maximum, extend the duration, or lower the goal.',
    }
  }

  return { feasible: true }
}
