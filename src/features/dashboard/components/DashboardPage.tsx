import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FadeIn } from '@/components/layout/FadeIn'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'
import { ChallengeCompleteCard } from '@/features/dashboard/components/ChallengeCompleteCard'
import { TodayWorkoutCard } from '@/features/dashboard/components/TodayWorkoutCard'
import { TomorrowPreviewCard } from '@/features/dashboard/components/TomorrowPreviewCard'

export function DashboardPage() {
  const {
    challenge,
    view,
    loading,
    todayResult,
    streak,
    totalPoints,
    completedDays,
    skipsRemaining,
    completeToday,
    skipToday,
    startNewChallenge,
  } = useDashboard()

  if (loading || !view) return <FullScreenSpinner />

  if (view.hasEnded) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6">
        <ChallengeCompleteCard
          title={challenge.title}
          completedDays={completedDays}
          durationDays={challenge.durationDays}
          totalPoints={totalPoints}
          onStartNewChallenge={startNewChallenge}
        />
      </div>
    )
  }

  const dayNumber = (view.dayIndex ?? 0) + 1
  const progressPercent = Math.round((dayNumber / challenge.durationDays) * 100)

  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <FadeIn>
        <Card>
          <CardHeader>
            <CardTitle>{challenge.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Day {dayNumber} of {challenge.durationDays}
              </span>
              <div className="flex gap-2">
                <Badge variant="secondary">{streak} day streak</Badge>
                <Badge variant="secondary">{totalPoints} pts</Badge>
              </div>
            </div>
            <Progress value={progressPercent} />
          </CardContent>
        </Card>
      </FadeIn>

      {view.todayPlan && (
        <FadeIn delay={0.05}>
          <TodayWorkoutCard
            plan={view.todayPlan}
            goalType={challenge.goalType}
            result={todayResult}
            skipsRemaining={skipsRemaining}
            onComplete={completeToday}
            onSkip={skipToday}
          />
        </FadeIn>
      )}

      <FadeIn delay={0.1}>
        <TomorrowPreviewCard
          plan={view.tomorrowPlan}
          goalType={challenge.goalType}
        />
      </FadeIn>
    </div>
  )
}
