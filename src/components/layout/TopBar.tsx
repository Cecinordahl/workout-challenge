import { Moon, Sun, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AuthService } from '@/features/authentication/services/AuthService'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { useTheme } from '@/hooks/useTheme'

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
  const { user } = useAuth()
  const { unreadCount } = useNotifications(user?.uid ?? '')
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-4">
        <span className="font-semibold tracking-tight">WorkoutChallenge</span>
        <nav className="hidden items-center gap-3 sm:flex">
          <NavLink to="/" end className={navLinkClassName}>
            Dashboard
          </NavLink>
          <NavLink to="/history" className={navLinkClassName}>
            History
          </NavLink>
          <NavLink to="/teams" className={navLinkClassName}>
            Teams
          </NavLink>
          <NavLink to="/notifications" className={navLinkClassName}>
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-1 px-1.5">{unreadCount}</Badge>
            )}
          </NavLink>
        </nav>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label={
            theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          }
        >
          {theme === 'dark' ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>
        <NavLink
          to="/account"
          aria-label="Account"
          className={({ isActive }) =>
            cn(
              buttonVariants({
                variant: isActive ? 'secondary' : 'ghost',
                size: 'icon-sm',
              }),
            )
          }
        >
          <User className="size-4" />
        </NavLink>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
