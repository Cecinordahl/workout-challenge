import { describe, expect, it } from 'vitest'
import { CampaignValidationService } from '@/features/meaningful/services/CampaignValidationService'
import { CAMPAIGNS } from '.'

// Fixed so content tests don't start failing on their own as dates pass;
// bump it when re-verifying the catalogue.
const CONTENT_REVIEW_DATE = '2026-10-26'

describe('campaign catalogue content', () => {
  const results = CampaignValidationService.validateCatalogue(
    CAMPAIGNS,
    CONTENT_REVIEW_DATE,
  )

  it.each(CAMPAIGNS.map((c) => [c.id]))(
    '%s has no validation errors or warnings',
    (id) => {
      expect(results.get(id)).toEqual({ errors: [], warnings: [] })
    },
  )
})
