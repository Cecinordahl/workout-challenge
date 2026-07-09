import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { BottomNav } from '@/components/layout/BottomNav'

export function AppShell() {
  const location = useLocation()

  return (
    <div className="min-h-svh">
      <TopBar />
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="pb-16 sm:pb-0"
      >
        <Outlet />
      </motion.div>
      <BottomNav />
    </div>
  )
}
