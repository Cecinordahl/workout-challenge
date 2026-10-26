import { ArrowLeft, ExternalLink, Info, LifeBuoy, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'
import { cn } from '@/lib/utils'
import { ACTIVITY_TYPE_LABELS } from '@/features/activities/constants'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import type { Campaign, SourceLink } from '@/features/meaningful/domain/types'
import { useCampaignParticipation } from '@/features/meaningful/hooks/useCampaignParticipation'
import { useCampaignSelection } from '@/features/meaningful/hooks/useCampaignSelection'
import type {
  CampaignPeriod,
  CampaignPhase,
} from '@/features/meaningful/services/CampaignPeriodService'
import { CampaignCatalogService } from '@/features/meaningful/services/CampaignCatalogService'
import { CampaignFormatService } from '@/features/meaningful/services/CampaignFormatService'
import {
  JoinCampaignError,
  ParticipationService,
  type StoredParticipation,
} from '@/features/meaningful/services/ParticipationService'
import type { DistanceUnit } from '@/types/user'
import { CampaignIcon } from './CampaignIcon'
import { GoalOption } from './GoalOption'
import { StatisticOption } from './StatisticOption'
import { TierBadge } from './TierBadge'

const JOIN_ERROR_MESSAGES: Record<JoinCampaignError['code'], string> = {
  locked: 'Your choice is locked because an activity already counts toward it.',
  already_completed: "You've already earned this month's badge.",
  unknownTrack: 'That option is no longer available. Please choose again.',
  unknownStatistic: 'That fact is no longer available. Please choose another.',
  goalNotOffered: 'That goal is no longer available. Please choose again.',
  unknown: 'Something went wrong joining. Please try again.',
}

function ExternalLinks({ links }: { links: SourceLink[] }) {
  return (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm underline underline-offset-4"
          >
            {link.label}
            <ExternalLink aria-hidden="true" className="size-3" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

function JoinedSummary({
  campaign,
  participation,
  distanceUnit,
  onChange,
}: {
  campaign: Campaign
  participation: StoredParticipation
  distanceUnit: DistanceUnit
  onChange: () => void
}) {
  const goal = CampaignCatalogService.getGoal(campaign, participation.goalId)
  const track = CampaignCatalogService.getTrack(campaign, participation.trackId)
  const statistic = campaign.statistics.find(
    (s) => s.id === participation.statisticId,
  )
  if (!goal || !track) return null

  const progress = participation.progress
  const completed = participation.status === 'completed'

  return (
    <Card>
      <CardHeader>
        <CardTitle>{completed ? 'Badge earned' : "You're in"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TierBadge difficulty={goal.difficulty} muted={!completed} />
        {completed && (
          <p className="font-semibold">
            {goal.badge.name}
            {progress?.completedOn && (
              <span className="text-muted-foreground ml-2 text-sm font-normal">
                Earned {CampaignFormatService.shortDate(progress.completedOn)}
              </span>
            )}
          </p>
        )}
        <div className="space-y-1">
          <p className="font-semibold">
            {CampaignFormatService.goalTarget(goal, distanceUnit)}
          </p>
          <p className="text-muted-foreground text-sm">{track.label}</p>
          {statistic && (
            <p className="text-muted-foreground text-sm">
              For: “{statistic.statement}”
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {CampaignFormatService.goalProgress(
                goal,
                progress?.progressValue ?? 0,
                distanceUnit,
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

        <Link
          to={`/causes/${campaign.slug}/progress`}
          className={cn(buttonVariants(), 'w-full')}
        >
          {completed ? 'View activities' : 'Progress & log activities'}
        </Link>

        {completed ? null : participation.lockedAt ? (
          <p className="text-muted-foreground flex items-start gap-2 text-xs">
            <Lock aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
            Your choice is locked now that activities count toward it.
          </p>
        ) : (
          <Button variant="outline" className="w-full" onClick={onChange}>
            Change my choice
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function CampaignPicker({
  campaign,
  period,
  phase,
  participation,
  distanceUnit,
  onJoined,
}: {
  campaign: Campaign
  period: CampaignPeriod
  phase: CampaignPhase
  participation: StoredParticipation | null
  distanceUnit: DistanceUnit
  onJoined: () => void
}) {
  const picker = useCampaignSelection(campaign, participation)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const statistic = campaign.statistics.find((s) => s.id === picker.statisticId)
  const featuredFirst = [...campaign.statistics].sort(
    (a, b) =>
      Number(b.id === campaign.featuredStatisticId) -
      Number(a.id === campaign.featuredStatisticId),
  )

  async function handleJoin() {
    if (!picker.selection) return
    setError(null)
    setIsSubmitting(true)
    try {
      await ParticipationService.join(campaign.id, picker.selection)
      onJoined()
    } catch (err) {
      setError(
        JOIN_ERROR_MESSAGES[
          err instanceof JoinCampaignError ? err.code : 'unknown'
        ],
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="pick-fact" className="space-y-3">
        <div className="space-y-1">
          <h2 id="pick-fact" className="font-semibold">
            1. Choose the fact that matters to you
          </h2>
          <p className="text-muted-foreground text-sm">
            Open a card to see its source and context.
          </p>
        </div>
        <RadioGroup
          value={picker.statisticId ?? ''}
          onValueChange={(value) => picker.setStatisticId(value as string)}
          aria-labelledby="pick-fact"
          className="gap-3"
        >
          {featuredFirst.map((s) => (
            <StatisticOption
              key={s.id}
              statistic={s}
              selected={s.id === picker.statisticId}
            />
          ))}
        </RadioGroup>
      </section>

      <section aria-labelledby="pick-track" className="space-y-3">
        <h2 id="pick-track" className="font-semibold">
          2. How will you move?
        </h2>
        <RadioGroup
          value={picker.trackId}
          onValueChange={(value) => picker.setTrackId(value as string)}
          aria-labelledby="pick-track"
          className="gap-3"
        >
          {campaign.tracks.map((track) => (
            <div
              key={track.id}
              className={cn(
                'flex items-start gap-3 rounded-xl p-4 ring-1',
                track.id === picker.trackId
                  ? 'ring-primary bg-muted/40 ring-2'
                  : 'ring-foreground/10',
              )}
            >
              <RadioGroupItem
                value={track.id}
                id={`track-${track.id}`}
                className="mt-1"
              />
              <Label htmlFor={`track-${track.id}`} className="block flex-1">
                <span className="block font-medium">{track.label}</span>
                <span className="text-muted-foreground block text-xs font-normal">
                  Counts:{' '}
                  {track.activityTypes
                    .map((t) => ACTIVITY_TYPE_LABELS[t].toLowerCase())
                    .join(', ')}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
        <p className="text-muted-foreground text-xs">
          Only these activity types count — a run never counts toward a cycling
          goal, and cycling goals are longer to match the effort.
        </p>
      </section>

      <section aria-labelledby="pick-goal" className="space-y-3">
        <div className="space-y-1">
          <h2 id="pick-goal" className="font-semibold">
            3. Choose your goal
          </h2>
          {statistic && (
            <p className="text-muted-foreground text-sm">
              {statistic.goalMappingNote}
            </p>
          )}
        </div>
        <RadioGroup
          value={picker.goalId ?? ''}
          onValueChange={(value) => picker.setGoalId(value as string)}
          aria-labelledby="pick-goal"
          className="gap-3"
        >
          {picker.goals.map((goal) => (
            <GoalOption
              key={goal.id}
              goal={goal}
              selected={goal.id === picker.goalId}
              distanceUnit={distanceUnit}
            />
          ))}
        </RadioGroup>
        <p className="text-muted-foreground text-xs">
          Pick one. The badge colour shows the goal's difficulty — not how much
          your effort is worth to the cause.
        </p>
      </section>

      <Card size="sm" className="bg-muted/40">
        <CardContent className="flex gap-3 text-sm">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>{campaign.symbolicNote}</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <p className="text-muted-foreground text-xs">
          {phase === 'active'
            ? 'Activities from earlier this month count too. Your choice locks as soon as an activity counts toward it.'
            : `Starts 1 ${CampaignFormatService.periodLabel(period)}. You can change your choice until your first activity counts.`}
        </p>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <Button
          className="w-full"
          disabled={!picker.selection || isSubmitting}
          onClick={() => void handleJoin()}
        >
          {isSubmitting
            ? 'Saving…'
            : participation
              ? 'Save my choice'
              : `Join ${CampaignFormatService.periodLabel(period)}`}
        </Button>
        {!picker.selection && (
          <p className="text-muted-foreground text-center text-xs">
            Choose a goal to continue.
          </p>
        )}
      </div>
    </div>
  )
}

export function CampaignPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, profile } = useAuth()
  const campaign = slug ? CampaignCatalogService.getCampaignBySlug(slug) : null
  const { period, phase, participation, loading } = useCampaignParticipation(
    user?.uid ?? '',
    profile?.timezone ?? 'UTC',
    campaign,
  )
  const [editing, setEditing] = useState(false)

  if (!campaign) return <Navigate to="/causes" replace />
  if (!user || !profile || loading || !period || !phase) {
    return <FullScreenSpinner />
  }

  const featured = CampaignCatalogService.getFeaturedStatistic(campaign)
  const showPicker =
    !participation ||
    (editing && !participation.lockedAt && participation.status !== 'completed')

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <Link
        to="/causes"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All causes
      </Link>

      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="bg-muted flex size-11 items-center justify-center rounded-full">
            <CampaignIcon name={campaign.icon} className="size-5" />
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {CampaignFormatService.periodLabel(period)}
            </span>
            <Badge variant="secondary">
              {CampaignFormatService.phaseLabel(phase)}
            </Badge>
          </div>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          {campaign.title}
        </h1>
        <p className="text-muted-foreground text-sm">{campaign.cause}</p>
        <p className="text-sm leading-relaxed">{campaign.description}</p>
      </header>

      {campaign.supportResources.length > 0 && (
        <Card size="sm">
          <CardContent className="flex gap-3">
            <LifeBuoy aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Need someone to talk to? Free, confidential support:
              </p>
              <ExternalLinks links={campaign.supportResources} />
            </div>
          </CardContent>
        </Card>
      )}

      {featured && !showPicker && (
        <Card>
          <CardContent className="space-y-1">
            <p>
              <span className="text-2xl font-semibold tracking-tight">
                {CampaignFormatService.statisticHeadline(featured).value}
              </span>
              {featured.unit && (
                <span className="text-muted-foreground ml-1.5 text-sm">
                  {CampaignFormatService.statisticHeadline(featured).unit}
                </span>
              )}
            </p>
            <p className="text-sm">{featured.statement}</p>
            <p className="text-muted-foreground text-xs">
              {featured.sourceOrg} · {featured.period}
            </p>
          </CardContent>
        </Card>
      )}

      {showPicker ? (
        <CampaignPicker
          campaign={campaign}
          period={period}
          phase={phase}
          participation={participation}
          distanceUnit={profile.distanceUnit}
          onJoined={() => setEditing(false)}
        />
      ) : (
        <JoinedSummary
          campaign={campaign}
          participation={participation}
          distanceUnit={profile.distanceUnit}
          onChange={() => setEditing(true)}
        />
      )}

      <section aria-labelledby="learn-more" className="space-y-2">
        <h2 id="learn-more" className="font-semibold">
          Learn more
        </h2>
        <ExternalLinks links={campaign.learnMore} />
      </section>
    </div>
  )
}
