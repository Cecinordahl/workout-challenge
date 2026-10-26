import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ACTIVITY_TYPE_LABELS } from '@/features/activities/constants'
import { ActivityService } from '@/features/activities/services/ActivityService'
import {
  ManualActivityService,
  type ManualActivityError,
  type ManualActivityFields,
} from '@/features/activities/services/ManualActivityService'
import type { Activity, ActivityType } from '@/types/activity'
import type { DistanceUnit } from '@/types/user'

const ERROR_MESSAGES: Record<ManualActivityError, string> = {
  unknownType: 'Choose an activity type.',
  invalidDate: 'Enter a valid date.',
  futureDate: "You can't log an activity in the future.",
  invalidTime: 'Enter a valid start time.',
  invalidDistance: 'Enter a distance of 0 or more.',
  invalidDuration: 'Enter a duration between 1 minute and 24 hours.',
  implausibleSpeed:
    "That's faster than this activity type allows — check the distance and duration.",
}

interface ManualActivityFormProps {
  userId: string
  distanceUnit: DistanceUnit
  todayIso: string
  /** Earliest selectable date, e.g. the campaign month's first day. */
  minDate: string
  /** Latest selectable date; capped at today. */
  maxDate: string
  activityTypes: ActivityType[]
  /** Activities to check for likely duplicates (e.g. this month's). */
  existingActivities: Activity[]
  onLogged: () => void
}

export function ManualActivityForm({
  userId,
  distanceUnit,
  todayIso,
  minDate,
  maxDate,
  activityTypes,
  existingActivities,
  onLogged,
}: ManualActivityFormProps) {
  const latest = maxDate < todayIso ? maxDate : todayIso
  const [type, setType] = useState<ActivityType>(activityTypes[0] ?? 'run')
  const [date, setDate] = useState(latest)
  const [startTime, setStartTime] = useState('')
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [pending, setPending] = useState<ManualActivityFields | null>(null)
  const [duplicates, setDuplicates] = useState<Activity[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const formId = useId()

  async function save(fields: ManualActivityFields) {
    setIsSaving(true)
    try {
      await ActivityService.addManualActivity(fields)
      setPending(null)
      setDuplicates([])
      setDistance('')
      setDuration('')
      setStartTime('')
      onLogged()
    } catch {
      setErrors(['Something went wrong saving your activity. Try again.'])
    } finally {
      setIsSaving(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = ManualActivityService.build(
      userId,
      {
        type,
        date,
        startTime: startTime || undefined,
        distance: Number(distance),
        distanceUnit,
        durationMin: Number(duration),
      },
      todayIso,
    )
    if (!result.ok) {
      setErrors(result.errors.map((e) => ERROR_MESSAGES[e]))
      return
    }
    setErrors([])
    const possible = ManualActivityService.findPossibleDuplicates(
      result.fields,
      existingActivities,
    )
    if (possible.length > 0) {
      setPending(result.fields)
      setDuplicates(possible)
      return
    }
    void save(result.fields)
  }

  const field = (name: string) => `${formId}-${name}`

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-2">
          <Label htmlFor={field('type')}>Activity</Label>
          <select
            id={field('type')}
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
            className="border-input dark:bg-input/30 h-8 w-full rounded-lg border bg-transparent px-2 text-base md:text-sm"
          >
            {activityTypes.map((t) => (
              <option key={t} value={t}>
                {ACTIVITY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={field('date')}>Date</Label>
          <Input
            id={field('date')}
            type="date"
            value={date}
            min={minDate}
            max={latest}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={field('time')}>Start time (optional)</Label>
          <Input
            id={field('time')}
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={field('distance')}>Distance ({distanceUnit})</Label>
          <Input
            id={field('distance')}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={field('duration')}>Duration (min)</Label>
          <Input
            id={field('duration')}
            type="number"
            inputMode="numeric"
            min={1}
            step="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="text-destructive space-y-1 text-sm">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {pending ? (
        <div role="alert" className="bg-muted/60 space-y-3 rounded-lg p-3">
          <p className="text-sm">
            This looks like an activity you already have that day (
            {duplicates.length === 1
              ? `${duplicates[0]!.source === 'strava' ? 'from Strava' : 'logged by hand'}`
              : `${duplicates.length} similar activities`}
            ). Logging it again would count it twice.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setPending(null)
                setDuplicates([])
              }}
            >
              Don't log
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={isSaving}
              onClick={() => void save(pending)}
            >
              It's a different one
            </Button>
          </div>
        </div>
      ) : (
        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Log activity'}
        </Button>
      )}
    </form>
  )
}
