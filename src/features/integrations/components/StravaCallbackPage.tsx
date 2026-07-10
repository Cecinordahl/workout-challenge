import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'
import { StravaService } from '@/features/integrations/services/StravaService'

export function StravaCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const code = searchParams.get('code')
  const deniedByUser = searchParams.get('error') === 'access_denied'
  const [error, setError] = useState<string | null>(
    deniedByUser || code ? null : 'Missing authorization code from Strava.',
  )
  const hasStarted = useRef(false)

  useEffect(() => {
    if (hasStarted.current || deniedByUser || !code) return
    hasStarted.current = true

    StravaService.exchangeCode(code)
      .then(() => navigate('/notifications', { replace: true }))
      .catch(() => setError("Couldn't connect your Strava account. Try again."))
  }, [code, deniedByUser, navigate])

  useEffect(() => {
    if (deniedByUser) void navigate('/notifications', { replace: true })
  }, [deniedByUser, navigate])

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Connection failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <FullScreenSpinner />
}
