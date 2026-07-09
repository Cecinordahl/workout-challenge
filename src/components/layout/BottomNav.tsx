import { Bell, History, Home, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'

const navItemClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium',
    isActive ? 'text-foreground' : 'text-muted-foreground',
  )

export function BottomNav() {
  const { user } = useAuth()
  const { unreadCount } = useNotifications(user?.uid ?? '')

  return (
    <nav className="bg-background fixed inset-x-0 bottom-0 flex border-t sm:hidden">
      <NavLink to="/" end className={navItemClassName}>
        <Home className="size-5" />
        Dashboard
      </NavLink>
      <NavLink to="/history" className={navItemClassName}>
        <History className="size-5" />
        History
      </NavLink>
      <NavLink to="/teams" className={navItemClassName}>
        <Users className="size-5" />
        Teams
      </NavLink>
      <NavLink
        to="/notifications"
        className={(props) => cn(navItemClassName(props), 'relative')}
      >
        <Bell className="size-5" />
        Alerts
        {unreadCount > 0 && (
          <Badge className="absolute top-1 right-[calc(50%-18px)] px-1.5">
            {unreadCount}
          </Badge>
        )}
      </NavLink>
    </nav>
  )
}
