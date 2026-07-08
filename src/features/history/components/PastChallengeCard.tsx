import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { ChallengeStats } from '@/features/history/services/HistoryStatsService'
import { formatGoalValue } from '@/utils/format'

interface PastChallengeCardProps {
  stats: ChallengeStats
}

export function PastChallengeCard({ stats }: PastChallengeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{stats.title}</span>
          <Badge variant="secondary">{stats.completionPercent}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={stats.completionPercent} />
        <dl className="text-muted-foreground grid grid-cols-2 gap-y-1 text-sm">
          <dt>Distance / time</dt>
          <dd className="text-foreground text-right">
            {formatGoalValue(stats.completedValue, stats.goalType)} /{' '}
            {formatGoalValue(stats.targetValue, stats.goalType)}
          </dd>
          <dt>Days completed</dt>
          <dd className="text-foreground text-right">
            {stats.completedDays} / {stats.durationDays}
          </dd>
          <dt>Longest streak</dt>
          <dd className="text-foreground text-right">
            {stats.longestStreak} days
          </dd>
          <dt>Points earned</dt>
          <dd className="text-foreground text-right">{stats.totalPoints}</dd>
        </dl>
      </CardContent>
    </Card>
  )
}
