import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { useHistory } from '@/features/history/hooks/useHistory'
import { PastChallengeCard } from '@/features/history/components/PastChallengeCard'

export function HistoryPage() {
  const { user } = useAuth()
  const { stats, loading } = useHistory(user?.uid ?? '')

  if (!user || loading) return <FullScreenSpinner />

  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-lg font-semibold tracking-tight">History</h1>
      {stats.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Finished challenges will show up here.
        </p>
      ) : (
        stats.map((challengeStats) => (
          <PastChallengeCard
            key={challengeStats.challengeId}
            stats={challengeStats}
          />
        ))
      )}
    </div>
  )
}
