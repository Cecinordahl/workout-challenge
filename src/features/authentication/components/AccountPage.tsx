import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { AuthService } from '@/features/authentication/services/AuthService'

export function AccountPage() {
  const { user, profile } = useAuth()

  function handleSignOut() {
    AuthService.signOut().catch((error: unknown) => {
      console.error('Failed to sign out', error)
    })
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            Welcome{profile ? `, ${profile.displayName}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="text-muted-foreground space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Email</dt>
              <dd>{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Timezone</dt>
              <dd>{profile?.timezone}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Distance unit</dt>
              <dd>{profile?.distanceUnit}</dd>
            </div>
          </dl>
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
