const STRAVA_API_BASE = 'https://www.strava.com/api/v3'
const STRAVA_OAUTH_BASE = 'https://www.strava.com/oauth'

export interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete?: { id: number }
}

export interface StravaActivity {
  id: number
  type: string
  sport_type: string
  distance: number // meters
  moving_time: number // seconds
  start_date_local: string // ISO, local to the athlete
}

function clientCredentials() {
  const clientId = process.env.VITE_STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('Strava client credentials are not configured.')
  }
  return { clientId, clientSecret }
}

export async function exchangeAuthorizationCode(
  code: string,
): Promise<StravaTokenResponse> {
  const { clientId, clientSecret } = clientCredentials()
  const res = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    throw new Error(`Strava token exchange failed: ${res.status}`)
  }
  return res.json() as Promise<StravaTokenResponse>
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<StravaTokenResponse> {
  const { clientId, clientSecret } = clientCredentials()
  const res = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) {
    throw new Error(`Strava token refresh failed: ${res.status}`)
  }
  return res.json() as Promise<StravaTokenResponse>
}

export async function deauthorize(accessToken: string): Promise<void> {
  await fetch(`${STRAVA_OAUTH_BASE}/deauthorize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/** Activities for one athlete within an epoch-seconds window (used to bound "today"). */
export async function listActivities(
  accessToken: string,
  afterEpochSeconds: number,
  beforeEpochSeconds: number,
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    after: String(afterEpochSeconds),
    before: String(beforeEpochSeconds),
    per_page: '50',
  })
  const res = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  )
  if (!res.ok) {
    throw new Error(`Strava list activities failed: ${res.status}`)
  }
  return res.json() as Promise<StravaActivity[]>
}

const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun', 'Treadmill'])

export function isRunActivity(activity: StravaActivity): boolean {
  return RUN_TYPES.has(activity.sport_type) || RUN_TYPES.has(activity.type)
}
