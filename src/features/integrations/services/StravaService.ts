import { auth } from '@/services/firebase/config'

export interface StravaStatus {
  connected: boolean
  athleteId?: string
}

const STRAVA_OAUTH_AUTHORIZE_URL = 'https://www.strava.com/oauth/authorize'

async function authorizedFetch(path: string, init?: RequestInit) {
  const idToken = await auth.currentUser?.getIdToken()
  return fetch(path, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${idToken ?? ''}`,
    },
  })
}

export const StravaService = {
  /** Redirects the browser to Strava's authorization page. */
  startConnect(): void {
    const redirectUri = `${window.location.origin}/strava/callback`
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_STRAVA_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'activity:read_all',
    })
    window.location.href = `${STRAVA_OAUTH_AUTHORIZE_URL}?${params.toString()}`
  },

  async exchangeCode(code: string): Promise<StravaStatus> {
    const res = await authorizedFetch('/api/strava-exchange-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (!res.ok) throw new Error('Failed to connect Strava account.')
    return res.json() as Promise<StravaStatus>
  },

  async getStatus(): Promise<StravaStatus> {
    const res = await authorizedFetch('/api/strava-status')
    if (!res.ok) throw new Error('Failed to load Strava connection status.')
    return res.json() as Promise<StravaStatus>
  },

  async disconnect(): Promise<void> {
    const res = await authorizedFetch('/api/strava-disconnect', {
      method: 'POST',
    })
    if (!res.ok) throw new Error('Failed to disconnect Strava account.')
  },
}
