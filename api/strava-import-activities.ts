import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyRequestUser } from './_lib/firebaseAdmin.js'
import {
  connectionDocId,
  getConnection,
  getValidAccessToken,
} from './_lib/fitnessConnections.js'
import { upsertStravaActivity } from './_lib/activityLedger.js'
import { listActivities } from './_lib/strava.js'
import { daysBetweenIsoDates } from './_lib/date.js'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
/** Enough for a whole campaign month plus timezone slack. */
const MAX_WINDOW_DAYS = 33
const PER_PAGE = 100
const MAX_PAGES = 5
const DAY_SECONDS = 86_400

/**
 * Imports the caller's Strava activities between two local dates into the
 * ledger — so joining a campaign mid-month still counts activities from
 * before the webhook knew about them. Idempotent: activity IDs are
 * deterministic, so re-importing overwrites rather than duplicates.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const userId = await verifyRequestUser(req.headers.authorization)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { startDate, endDate } = req.body as {
    startDate?: string
    endDate?: string
  }
  if (
    !startDate ||
    !endDate ||
    !ISO_DATE.test(startDate) ||
    !ISO_DATE.test(endDate)
  ) {
    res.status(400).json({ error: 'startDate and endDate must be YYYY-MM-DD' })
    return
  }
  const windowDays = daysBetweenIsoDates(startDate, endDate)
  if (windowDays < 0 || windowDays > MAX_WINDOW_DAYS) {
    res.status(400).json({ error: 'Invalid date range' })
    return
  }

  const connection = await getConnection(userId, 'strava')
  if (!connection) {
    res.status(200).json({ imported: 0, reason: 'not_connected' })
    return
  }
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

  res.status(200).json({ imported })
}
