import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyPlan } from '@/features/challenge/engine/types'
import {
  STRAVA_SYNC_FAILURE_MESSAGE,
  type StravaSyncResult,
} from '@/features/integrations/services/StravaService'
import type { GoalType } from '@/types/challenge'
import { formatGoalValue } from '@/utils/format'

interface MissedDayBannerProps {
  date: string
  plan: DailyPlan
  goalType: GoalType
  skipsRemaining: number
  onConfirmSkipped: () => Promise<void>
  onLogManually: () => Promise<void>
  onSyncStrava: () => Promise<StravaSyncResult>
  onDismiss: () => void
}

type Action = 'skip' | 'log' | 'strava'

export function MissedDayBanner({
  date,
  plan,
  goalType,
  skipsRemaining,
  onConfirmSkipped,
  onLogManually,
  onSyncStrava,
  onDismiss,
}: MissedDayBannerProps) {
  const [pendingAction, setPendingAction] = useState<Action | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  async function handleConfirmSkipped() {
    setPendingAction('skip')
    try {
      await onConfirmSkipped()
    } finally {
      setPendingAction(null)
    }
  }

  async function handleLogManually() {
    setPendingAction('log')
    try {
      await onLogManually()
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

  const isSubmitting = pendingAction !== null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">Didn't see a workout logged</CardTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss"
            onClick={onDismiss}
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">
          We didn't see a workout logged for {date} (
          {formatGoalValue(plan.value, goalType)} goal). Did you skip it, or
          do you want to log it?
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isSubmitting || skipsRemaining <= 0}
            onClick={() => void handleConfirmSkipped()}
          >
            {skipsRemaining <= 0 ? 'I skipped it (none left)' : 'I skipped it'}
          </Button>
          <Button
            size="sm"
            disabled={isSubmitting}
            onClick={() => void handleLogManually()}
          >
            Log it
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => void handleSyncStrava()}
          >
            {pendingAction === 'strava' ? 'Syncing…' : 'Sync Strava'}
          </Button>
        </div>

        {syncMessage && (
          <p className="text-muted-foreground text-xs">{syncMessage}</p>
        )}
      </CardContent>
    </Card>
  )
}
