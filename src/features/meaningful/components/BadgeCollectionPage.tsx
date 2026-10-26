import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { useEarnedBadges } from '@/features/meaningful/hooks/useEarnedBadges'
import { CampaignCatalogService } from '@/features/meaningful/services/CampaignCatalogService'
import { CampaignFormatService } from '@/features/meaningful/services/CampaignFormatService'
import { CampaignPeriodService } from '@/features/meaningful/services/CampaignPeriodService'
import { TierBadge } from './TierBadge'

export function BadgeCollectionPage() {
  const { user, profile } = useAuth()
  const { badges, loading } = useEarnedBadges(user?.uid ?? '')

  if (!user || !profile || loading) return <FullScreenSpinner />

  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <Link
        to="/causes"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        All causes
      </Link>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">My badges</h1>
        <p className="text-muted-foreground text-sm">
          Badge colours show how hard the goal was, not what your effort was
          worth.
        </p>
      </div>

      {badges.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 text-sm">
            <p>No badges yet.</p>
            <Link
              to="/causes"
              className="font-medium underline underline-offset-4"
            >
              Join this month's cause
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {badges.map((badge) => {
            // Badges keep their own name and tier, so they still display
            // if the campaign is later edited or unpublished.
            const campaign = CampaignCatalogService.getCampaignById(
              badge.campaignId,
            )
            const goal = campaign
              ? CampaignCatalogService.getGoal(campaign, badge.goalId)
              : null
            return (
              <li key={badge.id}>
                <Card>
                  <CardContent className="space-y-2">
                    <TierBadge difficulty={badge.difficulty} />
                    <p className="font-semibold">{badge.badgeName}</p>
                    <p className="text-muted-foreground text-sm">
                      {campaign
                        ? `${campaign.title} · ${CampaignFormatService.periodLabel(
                            CampaignPeriodService.getPeriod(
                              campaign.month,
                              badge.year,
                            ),
                          )}`
                        : badge.year}
                    </p>
                    {goal && (
                      <p className="text-muted-foreground text-sm">
                        {CampaignFormatService.goalTarget(
                          goal,
                          profile.distanceUnit,
                        )}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      Earned{' '}
                      {CampaignFormatService.shortDate(badge.completedOn)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
