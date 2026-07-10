import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { StravaConnectionCard } from '@/features/integrations/components/StravaConnectionCard'

export function AccountPage() {
  const { profile } = useAuth()

  if (!profile) return <FullScreenSpinner />

  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-lg font-semibold tracking-tight">Account</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{profile.displayName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{profile.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Timezone</span>
            <span className="font-medium">{profile.timezone}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Distance unit</span>
            <span className="font-medium">{profile.distanceUnit}</span>
          </div>
        </CardContent>
      </Card>

      <StravaConnectionCard />
    </div>
  )
}
