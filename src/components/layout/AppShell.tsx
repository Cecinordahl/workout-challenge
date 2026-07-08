import { Outlet } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'

export function AppShell() {
  return (
    <div className="min-h-svh">
      <TopBar />
      <Outlet />
    </div>
  )
}
