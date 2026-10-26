import { useId } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { CampaignGoal } from '@/features/meaningful/domain/types'
import { CampaignFormatService } from '@/features/meaningful/services/CampaignFormatService'
import type { DistanceUnit } from '@/types/user'
import { TierBadge } from './TierBadge'

interface GoalOptionProps {
  goal: CampaignGoal
  selected: boolean
  distanceUnit: DistanceUnit
  disabled?: boolean
}

/** One Easy/Medium/Hard choice, previewing the badge it earns. */
export function GoalOption({
  goal,
  selected,
  distanceUnit,
  disabled,
}: GoalOptionProps) {
  const inputId = useId()
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl p-4 ring-1 transition-colors',
        selected ? 'ring-primary bg-muted/40 ring-2' : 'ring-foreground/10',
      )}
    >
      <RadioGroupItem
        value={goal.id}
        id={inputId}
        disabled={disabled}
        className="mt-1.5"
      />
      <Label
        htmlFor={inputId}
        className="block flex-1 cursor-pointer space-y-2"
      >
        <TierBadge difficulty={goal.difficulty} muted={!selected} />
        <span className="block font-semibold">
          {CampaignFormatService.goalTarget(goal, distanceUnit)}
        </span>
        <span className="text-muted-foreground block text-xs font-normal">
          Badge: {goal.badge.name}
        </span>
        <span className="text-muted-foreground block text-sm leading-snug font-normal">
          {goal.symbolicExplanation}
        </span>
      </Label>
    </div>
  )
}
