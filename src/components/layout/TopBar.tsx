import { Button } from '@/components/ui/button'
import { AuthService } from '@/features/authentication/services/AuthService'

function handleSignOut() {
  AuthService.signOut().catch((error: unknown) => {
    console.error('Failed to sign out', error)
  })
}

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b p-4">
      <span className="font-semibold tracking-tight">WorkoutChallenge</span>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </header>
  )
}
