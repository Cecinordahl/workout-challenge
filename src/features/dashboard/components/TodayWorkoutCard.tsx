import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyPlan } from '@/features/challenge/engine/types'
import {
  STRAVA_SYNC_FAILURE_MESSAGE,
  type StravaSyncResult,
} from '@/features/integrations/services/StravaService'
import type { DailyResult } from '@/types/dailyResult'
import type { GoalType } from '@/types/challenge'
import { formatGoalValue } from '@/utils/format'

const DAY_TYPE_LABEL: Record<DailyPlan['type'], string> = {
  hero: 'Hero day',
  recovery: 'Recovery day',
  normal: 'Today',
}

type Action = 'complete' | 'skip' | 'strava' | 'undo'

interface TodayWorkoutCardProps {
  plan: DailyPlan
  goalType: GoalType
  result: DailyResult | undefined
  skipsRemaining: number
  onComplete: () => Promise<void>
  onSkip: () => Promise<void>
  onUndo: () => Promise<void>
  onSyncStrava: () => Promise<StravaSyncResult>
}

export function TodayWorkoutCard({
  plan,
  goalType,
  result,
  skipsRemaining,
  onComplete,
  onSkip,
  onUndo,
  onSyncStrava,
}: TodayWorkoutCardProps) {
  const [pendingAction, setPendingAction] = useState<Action | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const isSubmitting = pendingAction !== null

  async function handleComplete() {
    setPendingAction('complete')
    try {
      await onComplete()
    } finally {
      setPendingAction(null)
    }
  }

  async function handleSkip() {
    setPendingAction('skip')
    try {
      await onSkip()
    } finally {
      setPendingAction(null)
    }
  }

  async function handleUndo() {
    setPendingAction('undo')
    try {
      await onUndo()
    } finally {
      setPendingAction(null)
    }
  }

  async function handleSyncStrava() {
    setPendingAction('strava')
    setSyncMessage(null)
    try {
      const result = await onSyncStrava()
      if (!result.synced)
        setSyncMessage(STRAVA_SYNC_FAILURE_MESSAGE[result.reason])
    } catch {
      setSyncMessage('Failed to sync with Strava — try again.')
    } finally {
      setPendingAction(null)
    }
  }

  // Only today's result reaches this card, so undo is naturally limited to
  // the current day — past skips/completions stay locked.
  const canUndo =
    result?.status === 'skipped' ||
    (result?.status === 'completed' && result.source !== 'strava')

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
              className="space-y-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              <Badge
                variant={
                  result.status === 'completed' ? 'default' : 'secondary'
                }
              >
                {result.status === 'completed'
                  ? result.source === 'strava'
                    ? 'Completed via Strava'
                    : 'Completed'
                  : 'Skipped'}
              </Badge>
              {canUndo && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => void handleUndo()}
                  >
                    {pendingAction === 'undo'
                      ? 'Undoing…'
                      : result.status === 'skipped'
                        ? 'Skipped by mistake — undo'
                        : 'Not done yet — undo'}
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex gap-2">
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
              </div>
              <Button
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => void handleSyncStrava()}
              >
                {pendingAction === 'strava'
                  ? 'Checking Strava…'
                  : "Already logged in Strava? Sync it"}
              </Button>
              {syncMessage && (
                <p className="text-muted-foreground text-xs">{syncMessage}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
