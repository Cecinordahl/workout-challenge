import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyRequestUser } from './_lib/firebaseAdmin.js'
import { importStravaActivities } from './_lib/stravaImport.js'
import { daysBetweenIsoDates } from './_lib/date.js'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
/** Enough for a whole campaign month plus timezone slack. */
const MAX_WINDOW_DAYS = 33

/**
 * Imports the caller's Strava activities between two local dates into the
 * ledger — so joining a campaign mid-month still counts activities from
 * before the webhook knew about them.
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

  res.status(200).json(await importStravaActivities(userId, startDate, endDate))
}
