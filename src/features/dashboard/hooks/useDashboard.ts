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
import {
  StravaService,
  type StravaSyncResult,
} from '@/features/integrations/services/StravaService'
import type { DailyPlan } from '@/features/challenge/engine/types'
import type { Challenge } from '@/types/challenge'
import { addDaysToIsoDate, todayInTimezone } from '@/utils/date'

export interface DashboardOutletContext {
  challenge: Challenge
}

export interface MissedDayInfo {
  dayIndex: number
  date: string
  plan: DailyPlan
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

  const missedYesterday = useMemo<MissedDayInfo | null>(() => {
    if (dayIndex === null || dayIndex <= 0 || !todayIso) return null
    const yesterdayIndex = dayIndex - 1
    const hasResult = results.some((r) => r.dayIndex === yesterdayIndex)
    if (hasResult) return null
    const plan = ChallengeViewService.getPlanForDay(challenge, yesterdayIndex)
    if (!plan) return null
    return {
      dayIndex: yesterdayIndex,
      date: addDaysToIsoDate(todayIso, -1),
      plan,
    }
  }, [challenge, dayIndex, results, todayIso])

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

  async function confirmYesterdaySkipped(): Promise<void> {
    if (!user || !missedYesterday) return
    await DailyResultService.skipDay(
      challenge.id,
      user.uid,
      missedYesterday.dayIndex,
      missedYesterday.date,
    )
    void TeamService.syncMyProgressToTeams(user.uid)
  }

  async function logYesterdayManually(): Promise<void> {
    if (!user || !missedYesterday) return
    const points = PointsService.pointsForDay(missedYesterday.plan.type)
    await DailyResultService.completeDay(
      challenge.id,
      user.uid,
      missedYesterday.dayIndex,
      missedYesterday.date,
      points,
    )
    void TeamService.syncMyProgressToTeams(user.uid)
  }

  async function syncYesterdayWithStrava(): Promise<StravaSyncResult> {
    if (!missedYesterday) return { synced: false, reason: 'already_logged' }
    const result = await StravaService.syncDay(
      challenge.id,
      missedYesterday.dayIndex,
      missedYesterday.date,
    )
    if (result.synced) void TeamService.syncMyProgressToTeams(user?.uid ?? '')
    return result
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
    missedYesterday,
    confirmYesterdaySkipped,
    logYesterdayManually,
    syncYesterdayWithStrava,
  }
}
