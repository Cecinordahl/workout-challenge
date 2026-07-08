import { useMemo } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { useDailyResults } from '@/features/challenge/hooks/useDailyResults'
import { ChallengeViewService } from '@/features/challenge/services/ChallengeViewService'
import { ChallengeService } from '@/features/challenge/services/ChallengeService'
import { DailyResultService } from '@/features/challenge/services/DailyResultService'
import { PointsService } from '@/features/challenge/services/PointsService'
import { StreakService } from '@/features/challenge/services/StreakService'
import type { Challenge } from '@/types/challenge'
import type { DailyResult, DailyResultStatus } from '@/types/dailyResult'
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

  const resultsByDayIndex = useMemo(() => {
    const map = new Map<number, DailyResult>()
    for (const result of results) map.set(result.dayIndex, result)
    return map
  }, [results])

  const dayIndex = view?.dayIndex ?? null
  const todayResult =
    dayIndex !== null ? resultsByDayIndex.get(dayIndex) : undefined

  const recentStatuses: DailyResultStatus[] = useMemo(() => {
    if (dayIndex === null) return []
    const statuses: DailyResultStatus[] = []
    // Today only counts once it has an outcome — while still unacted-on, it's
    // neither a completion nor a miss, since the day isn't over yet.
    if (todayResult) statuses.push(todayResult.status)
    for (let i = dayIndex - 1; i >= 0; i--) {
      statuses.push(resultsByDayIndex.get(i)?.status ?? 'missed')
    }
    return statuses
  }, [dayIndex, resultsByDayIndex, todayResult])

  const streak = StreakService.calculateCurrentStreak(recentStatuses)
  const totalPoints = results.reduce((sum, r) => sum + r.pointsAwarded, 0)
  const completedDays = results.filter((r) => r.status === 'completed').length
  const skipsUsed = results.filter((r) => r.status === 'skipped').length
  const skipsRemaining = Math.max(0, challenge.allowedSkips - skipsUsed)

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
  }

  async function skipToday(): Promise<void> {
    if (!user || !todayIso || dayIndex === null) return
    await DailyResultService.skipDay(challenge.id, user.uid, dayIndex, todayIso)
  }

  async function startNewChallenge(): Promise<void> {
    await ChallengeService.completeChallenge(challenge.id)
    void navigate('/challenge/new', { replace: true })
  }

  return {
    challenge,
    view,
    loading: resultsLoading || !view,
    todayResult,
    streak,
    totalPoints,
    completedDays,
    skipsUsed,
    skipsRemaining,
    completeToday,
    skipToday,
    startNewChallenge,
  }
}
