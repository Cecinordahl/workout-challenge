import { Medal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BADGE_TIERS } from '@/features/meaningful/domain/badgeTiers'
import type { Difficulty } from '@/features/meaningful/domain/types'

const TIER_CLASSES = {
  bronze: 'bg-tier-bronze',
  silver: 'bg-tier-silver',
  gold: 'bg-tier-gold',
} as const

interface TierBadgeProps {
  difficulty: Difficulty
  /** Dims the medal for previews of badges not yet earned. */
  muted?: boolean
  className?: string
}

/** Medal plus a text label — difficulty is never conveyed by colour alone. */
export function TierBadge({ difficulty, muted, className }: TierBadgeProps) {
  const { tier, label } = BADGE_TIERS[difficulty]
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'text-tier-foreground flex size-7 shrink-0 items-center justify-center rounded-full',
          TIER_CLASSES[tier],
          muted && 'opacity-60',
        )}
      >
        <Medal className="size-4" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </span>
  )
}
