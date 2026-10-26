import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import type { Campaign } from '@/features/meaningful/domain/types'
import { useCampaignParticipation } from '@/features/meaningful/hooks/useCampaignParticipation'
import { CampaignCatalogService } from '@/features/meaningful/services/CampaignCatalogService'
import { CampaignFormatService } from '@/features/meaningful/services/CampaignFormatService'
import { CampaignIcon } from './CampaignIcon'

function CampaignCard({
  campaign,
  userId,
  timezone,
}: {
  campaign: Campaign
  userId: string
  timezone: string
}) {
  const { period, phase, participation } = useCampaignParticipation(
    userId,
    timezone,
    campaign,
  )
  if (!period || !phase) return null

  return (
    <Link to={`/causes/${campaign.slug}`} className="block">
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="flex items-center gap-4">
          <span className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-full">
            <CampaignIcon name={campaign.icon} className="size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">
                {CampaignFormatService.periodLabel(period)}
              </span>
              {phase === 'active' && (
                <Badge variant="secondary">
                  {CampaignFormatService.phaseLabel(phase)}
                </Badge>
              )}
              {participation && (
                <Badge variant="outline">
                  {participation.status === 'completed'
                    ? 'Badge earned'
                    : 'Joined'}
                </Badge>
              )}
            </div>
            <p className="font-medium">{campaign.title}</p>
            <p className="text-muted-foreground text-sm">{campaign.summary}</p>
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

export function MeaningfulPage() {
  const { user, profile } = useAuth()
  if (!user || !profile) return <FullScreenSpinner />

  const campaigns = CampaignCatalogService.getPublishedCampaigns()

  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">
          Meaningful Mode
        </h1>
        <p className="text-muted-foreground text-sm">
          Each month focuses on a real-world cause. Learn the facts, pick one
          that matters to you, and set a movement goal in its honour.
        </p>
      </div>

      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          userId={user.uid}
          timezone={profile.timezone}
        />
      ))}

      <p className="text-muted-foreground text-xs">
        More months are on the way as their facts are checked.
      </p>
    </div>
  )
}
