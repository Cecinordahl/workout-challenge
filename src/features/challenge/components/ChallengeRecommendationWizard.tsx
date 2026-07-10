import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DURATION_PRESETS } from '@/features/challenge/constants'
import {
  recommendGoal,
  type RunnerLevel,
} from '@/features/challenge/engine/recommendGoal'
import type { GoalType } from '@/types/challenge'

const LEVELS: { value: RunnerLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'advanced', label: 'Advanced' },
]

interface ChallengeRecommendationWizardProps {
  onApply: (recommendation: {
    goalType: GoalType
    durationDays: number
    targetValue: number
    dailyMinimum: number
    dailyMaximum: number
  }) => void
}

export function ChallengeRecommendationWizard({
  onApply,
}: ChallengeRecommendationWizardProps) {
  const [level, setLevel] = useState<RunnerLevel | null>(null)
  const [goalType, setGoalType] = useState<GoalType>('distance')
  const [durationChoice, setDurationChoice] = useState<
    (typeof DURATION_PRESETS)[number] | 'custom'
  >(30)
  const [customDuration, setCustomDuration] = useState('')

  const durationDays =
    durationChoice === 'custom'
      ? Number.parseInt(customDuration, 10)
      : durationChoice

  const recommendation = useMemo(() => {
    if (!level) return null
    if (!Number.isFinite(durationDays) || durationDays <= 0) return null
    return recommendGoal(level, goalType, durationDays)
  }, [level, goalType, durationDays])

  const unitLabel = goalType === 'distance' ? 'km' : 'minutes'
  const levelLabel = LEVELS.find((l) => l.value === level)?.label.toLowerCase()

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Help me choose</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Runner level</Label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={level === option.value ? 'default' : 'outline'}
                onClick={() => setLevel(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Goal type</Label>
          <RadioGroup
            value={goalType}
            onValueChange={(value) => setGoalType(value as GoalType)}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="distance" id="wizard-goalType-distance" />
              <Label htmlFor="wizard-goalType-distance">Distance</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="time" id="wizard-goalType-time" />
              <Label htmlFor="wizard-goalType-time">Time</Label>
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
                onClick={() => setDurationChoice(preset)}
              >
                {preset} days
              </Button>
            ))}
            <Button
              type="button"
              variant={durationChoice === 'custom' ? 'default' : 'outline'}
              onClick={() => setDurationChoice('custom')}
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
              onChange={(e) => setCustomDuration(e.target.value)}
            />
          )}
        </div>

        {recommendation && (
          <div className="bg-muted space-y-3 rounded-lg p-4 text-sm">
            <p>
              Based on{' '}
              <a
                href={recommendation.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {recommendation.source.name}
              </a>
              , we think a <strong>{recommendation.targetValue}</strong>{' '}
              {unitLabel} goal over <strong>{durationDays}</strong> days is a
              good fit for a {levelLabel} runner.
            </p>
            <Button
              type="button"
              className="w-full"
              onClick={() =>
                onApply({
                  goalType,
                  durationDays,
                  targetValue: recommendation.targetValue,
                  dailyMinimum: recommendation.dailyMinimum,
                  dailyMaximum: recommendation.dailyMaximum,
                })
              }
            >
              Use this challenge
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
