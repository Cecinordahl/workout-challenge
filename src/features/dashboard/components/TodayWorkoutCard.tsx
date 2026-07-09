import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyPlan } from '@/features/challenge/engine/types'
import type { DailyResult } from '@/types/dailyResult'
import type { GoalType } from '@/types/challenge'
import { formatGoalValue } from '@/utils/format'

const DAY_TYPE_LABEL: Record<DailyPlan['type'], string> = {
  hero: 'Hero day',
  recovery: 'Recovery day',
  normal: 'Today',
}

interface TodayWorkoutCardProps {
  plan: DailyPlan
  goalType: GoalType
  result: DailyResult | undefined
  skipsRemaining: number
  onComplete: () => Promise<void>
  onSkip: () => Promise<void>
}

export function TodayWorkoutCard({
  plan,
  goalType,
  result,
  skipsRemaining,
  onComplete,
  onSkip,
}: TodayWorkoutCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleComplete() {
    setIsSubmitting(true)
    try {
      await onComplete()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSkip() {
    setIsSubmitting(true)
    try {
      await onSkip()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {DAY_TYPE_LABEL[plan.type]}
          {plan.type !== 'normal' && (
            <Badge variant={plan.type === 'hero' ? 'default' : 'secondary'}>
              {plan.type === 'hero' ? 'Hero' : 'Recovery'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-4xl font-semibold tracking-tight">
          {formatGoalValue(plan.value, goalType)}
        </p>

        <AnimatePresence mode="wait" initial={false}>
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              <Badge
                variant={
                  result.status === 'completed' ? 'default' : 'secondary'
                }
              >
                {result.status === 'completed' ? 'Completed' : 'Skipped'}
              </Badge>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              className="flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                className="flex-1"
                disabled={isSubmitting}
                onClick={() => void handleComplete()}
              >
                Complete
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={isSubmitting || skipsRemaining <= 0}
                onClick={() => void handleSkip()}
              >
                Skip{' '}
                {skipsRemaining <= 0
                  ? '(none left)'
                  : `(${skipsRemaining} left)`}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
