import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChallengeCompleteCardProps {
  title: string
  completedDays: number
  durationDays: number
  totalPoints: number
  onStartNewChallenge: () => Promise<void>
}

export function ChallengeCompleteCard({
  title,
  completedDays,
  durationDays,
  totalPoints,
  onStartNewChallenge,
}: ChallengeCompleteCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title} complete!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          You completed {completedDays} of {durationDays} days and earned{' '}
          {totalPoints} points.
        </p>
        <Button className="w-full" onClick={() => void onStartNewChallenge()}>
          Start a new challenge
        </Button>
      </CardContent>
    </Card>
  )
}
