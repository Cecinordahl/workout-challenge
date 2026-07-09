import { useEffect, useState } from 'react'
import { NotificationService } from '@/features/notifications/services/NotificationService'
import type { AppNotification } from '@/types/notification'

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return NotificationService.subscribeToNotifications(userId, (next) => {
      setNotifications(next)
      setLoading(false)
    })
  }, [userId])

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, loading }
}
