import type { Difficulty } from './types'

export type BadgeTier = 'bronze' | 'silver' | 'gold'

export interface BadgeTierInfo {
  tier: BadgeTier
  /** Text label so difficulty never relies on colour alone. */
  label: string
}

export const BADGE_TIERS: Record<Difficulty, BadgeTierInfo> = {
  EASY: { tier: 'bronze', label: 'Bronze · Easy' },
  MEDIUM: { tier: 'silver', label: 'Silver · Medium' },
  HARD: { tier: 'gold', label: 'Gold · Hard' },
}

export const DIFFICULTIES: readonly Difficulty[] = ['EASY', 'MEDIUM', 'HARD']
