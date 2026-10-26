import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { useCampaignParticipation } from '@/features/meaningful/hooks/useCampaignParticipation'
import { CampaignCatalogService } from '@/features/meaningful/services/CampaignCatalogService'
import { todayInTimezone } from '@/utils/date'
import { CampaignIcon } from './CampaignIcon'

/** Dashboard nudge for the cause running this month, if there is one. */
export function CurrentCauseCard() {
  const { user, profile } = useAuth()
  const timezone = profile?.timezone ?? 'UTC'
  const month = Number(todayInTimezone(timezone).slice(5, 7))
  const campaign = CampaignCatalogService.getCampaignForMonth(month)
  const { participation, loading } = useCampaignParticipation(
    user?.uid ?? '',
    timezone,
    campaign,
  )
  if (!campaign || !user || loading) return null

  const href = participation
    ? `/causes/${campaign.slug}/progress`
    : `/causes/${campaign.slug}`

  return (
    <Link to={href} className="block">
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="flex items-center gap-3">
          <CampaignIcon name={campaign.icon} className="size-5 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium">{campaign.title}</p>
            {participation ? (
              <Progress
                value={participation.progress?.percent ?? 0}
                aria-label={`${campaign.title} progress`}
              />
            ) : (
              <p className="text-muted-foreground text-xs">
                This month's cause — pick a fact and a goal.
              </p>
            )}
          </div>
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0"
          />
        </CardContent>
      </Card>
    </Link>
  )
}
