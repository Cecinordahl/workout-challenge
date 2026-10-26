import type { Campaign } from '@/features/meaningful/domain/types'
import { hivAwarenessCampaign } from './hivAwareness'
import { movemberCampaign } from './movember'

/** The full catalogue, including drafts. Read it through CampaignCatalogService. */
export const CAMPAIGNS: readonly Campaign[] = [
  movemberCampaign,
  hivAwarenessCampaign,
]
