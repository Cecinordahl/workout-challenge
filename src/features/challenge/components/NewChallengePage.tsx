import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberStepper } from '@/components/NumberStepper'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { checkFeasibility } from '@/features/challenge/engine/feasibility'
import { getGoalSuggestions } from '@/features/challenge/engine/goalSuggestions'
import { suggestDailySpan } from '@/features/challenge/engine/suggestDailySpan'
import { ChallengeService } from '@/features/challenge/services/ChallengeService'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'
import type { GoalType } from '@/types/challenge'

const DURATION_PRESETS = [7, 14, 30, 90] as const

function roundForGoalType(value: number, goalType: GoalType): number {
  return goalType === 'distance'
    ? Math.round(value * 10) / 10
    : Math.round(value)
}

export function NewChallengePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [goalType, setGoalType] = useState<GoalType>('distance')
  const [durationChoice, setDurationChoice] = useState<
    (typeof DURATION_PRESETS)[number] | 'custom'
  >(30)
  const [customDuration, setCustomDuration] = useState('')
  const [targetChoice, setTargetChoice] = useState<number | 'custom' | null>(
    null,
  )
  const [customTarget, setCustomTarget] = useState('')
  const [dailyMinimum, setDailyMinimum] = useState(0)
  const [dailyMaximum, setDailyMaximum] = useState(0)
  const [spanTouched, setSpanTouched] = useState(false)
  const [allowedSkips, setAllowedSkips] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const durationDays =
    durationChoice === 'custom'
      ? Number.parseInt(customDuration, 10)
      : durationChoice

  const goalSuggestions =
    goalType === 'distance' && durationChoice !== 'custom'
      ? getGoalSuggestions(durationChoice)
      : null

  const targetValue =
    targetChoice === 'custom' || targetChoice === null
      ? Number.parseFloat(customTarget)
      : targetChoice

  const suggestedSpan = useMemo(() => {
    if (!Number.isFinite(durationDays) || durationDays <= 0) return null
    if (!Number.isFinite(targetValue) || targetValue <= 0) return null
    const average = targetValue / durationDays
    const span = suggestDailySpan(average)
    return {
      min: roundForGoalType(span.min, goalType),
      max: roundForGoalType(span.max, goalType),
    }
  }, [durationDays, targetValue, goalType])

  if (suggestedSpan && !spanTouched) {
    if (dailyMinimum !== suggestedSpan.min) setDailyMinimum(suggestedSpan.min)
    if (dailyMaximum !== suggestedSpan.max) setDailyMaximum(suggestedSpan.max)
  }

  if (!user || !profile) return <FullScreenSpinner />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Give your challenge a title.')
      return
    }
    if (!Number.isFinite(durationDays) || durationDays <= 0) {
      setError('Enter a valid duration.')
      return
    }
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      setError('Enter a valid goal.')
      return
    }
    if (!Number.isFinite(dailyMinimum) || !Number.isFinite(dailyMaximum)) {
      setError('Enter a valid daily minimum and maximum.')
      return
    }
    const parsedSkips = Number.parseInt(allowedSkips, 10)
    if (!Number.isInteger(parsedSkips) || parsedSkips < 0) {
      setError('Allowed skips must be zero or a positive whole number.')
      return
    }

    const feasibility = checkFeasibility({
      durationDays,
      targetValue,
      dailyMinimum,
      dailyMaximum,
    })
    if (!feasibility.feasible) {
      setError(feasibility.reason ?? 'This goal is not reachable.')
      return
    }

    setIsSubmitting(true)
    try {
      await ChallengeService.createChallenge(user!.uid, {
        title: title.trim(),
        goalType,
        durationDays,
        targetValue,
        dailyMinimum,
        dailyMaximum,
        allowedSkips: parsedSkips,
        timezone: profile!.timezone,
      })
      void navigate('/', { replace: true })
    } catch {
      setError('Something went wrong creating your challenge. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const unitLabel = goalType === 'distance' ? 'km' : 'minutes'

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-md space-y-2 text-sm">
        <p>
          Pick a total goal and a timeframe, and we'll turn it into a daily plan
          for you — not just an even split. Expect a few lighter{' '}
          <strong>recovery days</strong> and a few bigger{' '}
          <strong>hero days</strong> mixed in with your regular days, so the
          effort builds gradually instead of staying flat.
        </p>
        <p className="text-muted-foreground">
          Example: a 30-day, 90&nbsp;km challenge averages 3&nbsp;km/day, but
          your actual plan might look like ~1.5&nbsp;km recovery days,
          ~3&nbsp;km regular days, and ~5&nbsp;km hero days — always adding up
          to exactly 90&nbsp;km by day 30.
        </p>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your challenge</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                placeholder="Challenge Name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Goal type</Label>
              <RadioGroup
                value={goalType}
                onValueChange={(value) => {
                  setGoalType(value as GoalType)
                  setTargetChoice(null)
                  setCustomTarget('')
                  setSpanTouched(false)
                }}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="distance" id="goalType-distance" />
                  <Label htmlFor="goalType-distance">Distance</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="time" id="goalType-time" />
                  <Label htmlFor="goalType-time">Time</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={durationChoice === preset ? 'default' : 'outline'}
                    onClick={() => {
                      setDurationChoice(preset)
                      setTargetChoice(null)
                      setCustomTarget('')
                      setSpanTouched(false)
                    }}
                  >
                    {preset} days
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={durationChoice === 'custom' ? 'default' : 'outline'}
                  onClick={() => {
                    setDurationChoice('custom')
                    setTargetChoice(null)
                    setCustomTarget('')
                    setSpanTouched(false)
                  }}
                >
                  Custom
                </Button>
              </div>
              {durationChoice === 'custom' && (
                <Input
                  type="number"
                  min={1}
                  placeholder="Number of days"
                  value={customDuration}
                  onChange={(e) => {
                    setCustomDuration(e.target.value)
                    setSpanTouched(false)
                  }}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Goal ({unitLabel})</Label>
              {goalSuggestions && (
                <div className="flex flex-wrap gap-2">
                  {goalSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant={
                        targetChoice === suggestion ? 'default' : 'outline'
                      }
                      onClick={() => {
                        setTargetChoice(suggestion)
                        setSpanTouched(false)
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant={targetChoice === 'custom' ? 'default' : 'outline'}
                    onClick={() => {
                      setTargetChoice('custom')
                      setSpanTouched(false)
                    }}
                  >
                    Custom
                  </Button>
                </div>
              )}
              {(!goalSuggestions || targetChoice === 'custom') && (
                <Input
                  type="number"
                  min={0}
                  step="any"
                  placeholder={`Total ${unitLabel}`}
                  value={customTarget}
                  onChange={(e) => {
                    setCustomTarget(e.target.value)
                    setSpanTouched(false)
                  }}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyMinimum">Daily minimum</Label>
                <NumberStepper
                  id="dailyMinimum"
                  step={1}
                  min={0}
                  max={Number.isFinite(targetValue) ? targetValue : undefined}
                  value={dailyMinimum}
                  onChange={(value) => {
                    setDailyMinimum(value)
                    setSpanTouched(true)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyMaximum">Daily maximum</Label>
                <NumberStepper
                  id="dailyMaximum"
                  step={1}
                  min={0}
                  max={Number.isFinite(targetValue) ? targetValue : undefined}
                  value={dailyMaximum}
                  onChange={(value) => {
                    setDailyMaximum(value)
                    setSpanTouched(true)
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowedSkips">Allowed skips</Label>
              <Input
                id="allowedSkips"
                type="number"
                min={0}
                step={1}
                value={allowedSkips}
                onChange={(e) => setAllowedSkips(e.target.value)}
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create challenge'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
