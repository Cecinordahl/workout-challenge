import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StravaService } from '@/features/integrations/services/StravaService'

export function StravaConnectionCard() {
  const [status, setStatus] = useState<
    'loading' | 'connected' | 'disconnected'
  >('loading')
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    StravaService.getStatus()
      .then((result) => {
        if (!cancelled)
          setStatus(result.connected ? 'connected' : 'disconnected')
      })
      .catch(() => {
        if (!cancelled) setStatus('disconnected')
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleDisconnect() {
    setIsBusy(true)
    try {
      await StravaService.disconnect()
      setStatus('disconnected')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Connected apps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Strava</span>
            {status === 'connected' && <Badge>Connected</Badge>}
          </div>
          {status === 'loading' ? null : status === 'connected' ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => void handleDisconnect()}
            >
              Disconnect
            </Button>
          ) : (
            <Button size="sm" onClick={() => StravaService.startConnect()}>
              Connect
            </Button>
          )}
        </div>
        {status === 'connected' && (
          <p className="text-muted-foreground mt-2 text-xs">
            Runs synced from Strava automatically complete today's workout when
            they meet your goal.
          </p>
        )}
        <p className="text-muted-foreground mt-2 text-xs">
          Garmin device? Turn on "Auto-sync to Strava" in the Garmin Connect
          app, then connect Strava above — no separate Garmin setup needed.
        </p>
      </CardContent>
    </Card>
  )
}
