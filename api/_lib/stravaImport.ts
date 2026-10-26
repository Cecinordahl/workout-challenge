import { upsertStravaActivity } from './activityLedger.js'
import {
  connectionDocId,
  getConnection,
  getValidAccessToken,
} from './fitnessConnections.js'
import { listActivities } from './strava.js'

const PER_PAGE = 100
const MAX_PAGES = 5
const DAY_SECONDS = 86_400

export type StravaImportResult =
  { imported: number } | { imported: 0; reason: 'not_connected' }

/**
 * Imports a user's Strava activities between two local dates into the
 * ledger. Idempotent: activity IDs are deterministic, so re-importing
 * overwrites rather than duplicates.
 */
export async function importStravaActivities(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<StravaImportResult> {
  const connection = await getConnection(userId, 'strava')
  if (!connection) return { imported: 0, reason: 'not_connected' }
  const accessToken = await getValidAccessToken(
    connectionDocId(userId, 'strava'),
    connection,
  )

  // Pad the UTC window by a day each side: local dates near midnight can
  // fall on either side of a UTC boundary. Out-of-range activities are
  // harmless — campaign progress filters by each activity's own local date.
  const after = Date.parse(`${startDate}T00:00:00Z`) / 1000 - DAY_SECONDS
  const before = Date.parse(`${endDate}T00:00:00Z`) / 1000 + 2 * DAY_SECONDS

  let imported = 0
  for (let page = 1; page <= MAX_PAGES; page++) {
    const activities = await listActivities(
      accessToken,
      after,
      before,
      page,
      PER_PAGE,
    )
    await Promise.all(activities.map((a) => upsertStravaActivity(userId, a)))
    imported += activities.length
    if (activities.length < PER_PAGE) break
  }
  return { imported }
}
