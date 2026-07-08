import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyPlan } from '@/features/challenge/engine/types'
import type { GoalType } from '@/types/challenge'
import { formatGoalValue } from '@/utils/format'

interface TomorrowPreviewCardProps {
  plan: DailyPlan | null
  goalType: GoalType
}

export function TomorrowPreviewCard({
  plan,
  goalType,
}: TomorrowPreviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          Tomorrow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">
          {plan ? formatGoalValue(plan.value, goalType) : 'Challenge complete'}
        </p>
      </CardContent>
    </Card>
  )
}
