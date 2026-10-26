import { ArrowLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'
import { ManualActivityForm } from '@/features/activities/components/ManualActivityForm'
import { ACTIVITY_TYPE_LABELS } from '@/features/activities/constants'
import { useActivitiesInRange } from '@/features/activities/hooks/useActivitiesInRange'
import { ActivityService } from '@/features/activities/services/ActivityService'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { useCampaignParticipation } from '@/features/meaningful/hooks/useCampaignParticipation'
import { CampaignCatalogService } from '@/features/meaningful/services/CampaignCatalogService'
import { CampaignFormatService } from '@/features/meaningful/services/CampaignFormatService'
import { CampaignPeriodService } from '@/features/meaningful/services/CampaignPeriodService'
import { CampaignProgressService } from '@/features/meaningful/services/CampaignProgressService'
import { ParticipationService } from '@/features/meaningful/services/ParticipationService'
import { todayInTimezone } from '@/utils/date'
import { TierBadge } from './TierBadge'

export function CampaignProgressPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, profile } = useAuth()
  const campaign = slug ? CampaignCatalogService.getCampaignBySlug(slug) : null
  const { period, phase, participation, loading } = useCampaignParticipation(
    user?.uid ?? '',
    profile?.timezone ?? 'UTC',
    campaign,
  )
  const { activities, loading: activitiesLoading } = useActivitiesInRange(
    user?.uid ?? '',
    period?.startDate ?? null,
    period?.endDate ?? null,
  )
  const [syncError, setSyncError] = useState<string | null>(null)

  if (!campaign) return <Navigate to="/causes" replace />
  if (!user || !profile || loading || !period || !phase) {
    return <FullScreenSpinner />
  }
  if (!participation)
    return <Navigate to={`/causes/${campaign.slug}`} replace />

  const goal = CampaignCatalogService.getGoal(campaign, participation.goalId)
  const track = CampaignCatalogService.getTrack(campaign, participation.trackId)
  if (!goal || !track)
    return <Navigate to={`/causes/${campaign.slug}`} replace />

  const todayIso = todayInTimezone(profile.timezone)
  const unit = profile.distanceUnit
  const progress = participation.progress
  const completed = participation.status === 'completed'
  const daysLeft = CampaignPeriodService.daysRemaining(period, todayIso)

  // Labels only — the server's evaluation (participation.progress) stays
  // the source of truth for progress and badges.
  const local = CampaignProgressService.evaluateGoal({
    goal,
    track,
    period,
    activities,
  })
  const counted = new Set(local.countedActivityIds)
  const qualifying = new Set(local.qualifyingActivityIds)
  const newestFirst = [...activities].sort((a, b) =>
    b.startLocal.localeCompare(a.startLocal),
  )

  async function refreshProgress() {
    setSyncError(null)
    try {
      await ParticipationService.evaluate(participation!.id)
    } catch {
      setSyncError(
        "Your activity is saved, but progress didn't update. Try refreshing.",
      )
    }
  }

  async function handleDelete(activityId: string) {
    if (!window.confirm('Delete this activity?')) return
    try {
      await ActivityService.deleteManualActivity(activityId)
    } catch {
      setSyncError("Couldn't delete that activity. Try again.")
      return
    }
    await refreshProgress()
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <Link
        to={`/causes/${campaign.slug}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {campaign.title}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{CampaignFormatService.periodLabel(period)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TierBadge difficulty={goal.difficulty} muted={!completed} />
          <div className="space-y-1">
            <p className="font-semibold">
              {CampaignFormatService.goalTarget(goal, unit)}
            </p>
            <p className="text-muted-foreground text-sm">{track.label}</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {CampaignFormatService.goalProgress(
                  goal,
                  progress?.progressValue ?? 0,
                  unit,
                )}
              </span>
              <span className="text-muted-foreground">
                {progress?.percent ?? 0}%
              </span>
            </div>
            <Progress
              value={progress?.percent ?? 0}
              aria-label="Campaign progress"
            />
          </div>
          <p className="text-muted-foreground text-sm">
            {completed
              ? `${goal.badge.name} earned.`
              : phase === 'upcoming'
                ? `Starts 1 ${CampaignFormatService.periodLabel(period)}.`
                : phase === 'ended'
                  ? 'This month has ended.'
                  : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left.`}
          </p>
          {syncError && (
            <div role="alert" className="space-y-2">
              <p className="text-destructive text-sm">{syncError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refreshProgress()}
              >
                Refresh progress
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {phase !== 'upcoming' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Log an activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-xs">
              Strava activities appear here automatically — only log ones Strava
              doesn't have.
            </p>
            <ManualActivityForm
              userId={user.uid}
              distanceUnit={unit}
              todayIso={todayIso}
              minDate={period.startDate}
              maxDate={period.endDate}
              activityTypes={track.activityTypes}
              existingActivities={activities}
              onLogged={() => void refreshProgress()}
            />
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="activities-heading" className="space-y-3">
        <h2 id="activities-heading" className="font-semibold">
          Activities this month
        </h2>
        {activitiesLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : newestFirst.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing yet. Activities from {track.label.toLowerCase()} count
            toward your goal.
          </p>
        ) : (
          <ul className="space-y-2">
            {newestFirst.map((activity) => (
              <li
                key={activity.id}
                className="ring-foreground/10 flex items-center gap-3 rounded-xl p-3 ring-1"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-sm font-medium">
                    {ACTIVITY_TYPE_LABELS[activity.type]} ·{' '}
                    {CampaignFormatService.distance(activity.distanceKm, unit)}{' '}
                    · {Math.round(activity.durationMin)} min
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {CampaignFormatService.shortDate(activity.localDate)} ·{' '}
                    {activity.source === 'strava' ? 'Strava' : 'Logged by hand'}
                  </p>
                </div>
                {goal.goalType === 'singleActivityDistance' &&
                qualifying.has(activity.id) ? (
                  <Badge>Qualifies</Badge>
                ) : counted.has(activity.id) ? (
                  <Badge variant="secondary">
                    {goal.goalType === 'singleActivityDistance'
                      ? 'Eligible'
                      : 'Counts'}
                  </Badge>
                ) : (
                  <Badge variant="outline">Doesn't count</Badge>
                )}
                {activity.source === 'manual' && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete activity"
                    onClick={() => void handleDelete(activity.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-muted-foreground text-xs">
          Only{' '}
          {track.activityTypes
            .map((t) => ACTIVITY_TYPE_LABELS[t].toLowerCase())
            .join(', ')}{' '}
          {goal.goalType === 'activeDays'
            ? 'activities of 10 minutes or more count.'
            : 'count toward this goal.'}
        </p>
      </section>
    </div>
  )
}
