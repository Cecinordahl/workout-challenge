import type { Campaign } from '../../domain/types.js'
import { hivAwarenessCampaign } from './hivAwareness.js'
import { movemberCampaign } from './movember.js'

/** The full catalogue, including drafts. Read it through CampaignCatalogService. */
export const CAMPAIGNS: readonly Campaign[] = [
  movemberCampaign,
  hivAwarenessCampaign,
]
