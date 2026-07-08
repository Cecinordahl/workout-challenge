import { useMemo } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { useDailyResults } from '@/features/challenge/hooks/useDailyResults'
import { ChallengeViewService } from '@/features/challenge/services/ChallengeViewService'
import { ChallengeProgressService } from '@/features/challenge/services/ChallengeProgressService'
import { ChallengeService } from '@/features/challenge/services/ChallengeService'
import { DailyResultService } from '@/features/challenge/services/DailyResultService'
import { PointsService } from '@/features/challenge/services/PointsService'
import { TeamService } from '@/features/teams/services/TeamService'
import type { Challenge } from '@/types/challenge'
import { todayInTimezone } from '@/utils/date'

export interface DashboardOutletContext {
  challenge: Challenge
}

export function useDashboard() {
  const { challenge } = useOutletContext<DashboardOutletContext>()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { results, loading: resultsLoading } = useDailyResults(
    challenge.id,
    user?.uid ?? '',
  )

  const todayIso = profile ? todayInTimezone(profile.timezone) : null

  const view = useMemo(
    () => (todayIso ? ChallengeViewService.getView(challenge, todayIso) : null),
    [challenge, todayIso],
  )

  const progress = useMemo(
    () =>
      todayIso
        ? ChallengeProgressService.computeProgress(challenge, results, todayIso)
        : null,
    [challenge, results, todayIso],
  )

  const dayIndex = view?.dayIndex ?? null
  const skipsRemaining = progress
    ? Math.max(0, challenge.allowedSkips - progress.skipsUsed)
    : 0

  async function completeToday(): Promise<void> {
    if (!user || !todayIso || dayIndex === null || !view?.todayPlan) return
    const points = PointsService.pointsForDay(view.todayPlan.type)
    await DailyResultService.completeDay(
      challenge.id,
      user.uid,
      dayIndex,
      todayIso,
      points,
    )
    void TeamService.syncMyProgressToTeams(user.uid)
  }

  async function skipToday(): Promise<void> {
    if (!user || !todayIso || dayIndex === null) return
    await DailyResultService.skipDay(challenge.id, user.uid, dayIndex, todayIso)
    void TeamService.syncMyProgressToTeams(user.uid)
  }

  async function startNewChallenge(): Promise<void> {
    await ChallengeService.completeChallenge(challenge.id)
    void navigate('/challenge/new', { replace: true })
  }

  return {
    challenge,
    view,
    loading: resultsLoading || !view || !progress,
    todayResult: progress?.todayResult,
    streak: progress?.currentStreak ?? 0,
    totalPoints: progress?.totalPoints ?? 0,
    completedDays: progress?.completedDays ?? 0,
    skipsUsed: progress?.skipsUsed ?? 0,
    skipsRemaining,
    completeToday,
    skipToday,
    startNewChallenge,
  }
}
