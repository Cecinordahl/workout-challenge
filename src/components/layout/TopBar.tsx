import { NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AuthService } from '@/features/authentication/services/AuthService'

function handleSignOut() {
  AuthService.signOut().catch((error: unknown) => {
    console.error('Failed to sign out', error)
  })
}

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-sm font-medium',
    isActive ? 'text-foreground' : 'text-muted-foreground',
  )

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-4">
        <span className="font-semibold tracking-tight">WorkoutChallenge</span>
        <nav className="flex items-center gap-3">
          <NavLink to="/" end className={navLinkClassName}>
            Dashboard
          </NavLink>
          <NavLink to="/history" className={navLinkClassName}>
            History
          </NavLink>
        </nav>
      </div>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </header>
  )
}
