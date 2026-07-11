import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FullScreenSpinner } from '@/components/layout/FullScreenSpinner'
import { useAuth } from '@/features/authentication/hooks/useAuth'
import { UserProfileService } from '@/features/authentication/services/UserProfileService'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { NotificationService } from '@/features/notifications/services/NotificationService'
import type { NotificationSettings } from '@/types/user'

export function NotificationsPage() {
  const { user, profile } = useAuth()
  const { notifications, loading } = useNotifications(user?.uid ?? '')
  const [pushStatus, setPushStatus] = useState<
    'idle' | 'enabling' | 'enabled' | 'unavailable'
  >('idle')

  if (!user || !profile || loading) return <FullScreenSpinner />

  async function handleEnablePush() {
    setPushStatus('enabling')
    const enabled = await NotificationService.enablePush(user!.uid)
    setPushStatus(enabled ? 'enabled' : 'unavailable')
  }

  function updateSetting<K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K],
  ) {
    void UserProfileService.updateNotificationSettings(user!.uid, {
      ...profile!.notificationSettings,
      [key]: value,
    })
  }

  async function handleNotificationClick(id: string, read: boolean) {
    if (!read) await NotificationService.markAsRead(id)
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-lg font-semibold tracking-tight">Notifications</h1>

      <Card>
        <CardContent className="space-y-2 pt-6">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nothing here yet.</p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() =>
                  void handleNotificationClick(
                    notification.id,
                    notification.read,
                  )
                }
                className="flex w-full items-start justify-between gap-2 border-b py-2 text-left last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {notification.body}
                  </p>
                </div>
                {!notification.read && <Badge className="shrink-0">New</Badge>}
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            disabled={pushStatus === 'enabling' || pushStatus === 'enabled'}
            onClick={() => void handleEnablePush()}
          >
            {pushStatus === 'enabled'
              ? 'Push notifications enabled'
              : pushStatus === 'enabling'
                ? 'Enabling…'
                : pushStatus === 'unavailable'
                  ? 'Push unavailable on this device'
                  : 'Enable push notifications'}
          </Button>

          <div className="flex items-center justify-between">
            <Label htmlFor="dailyReminder">Daily reminder</Label>
            <Switch
              id="dailyReminder"
              checked={profile.notificationSettings.dailyReminder}
              onCheckedChange={(checked) =>
                updateSetting('dailyReminder', checked)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminderTime">Reminder time</Label>
            <Input
              id="reminderTime"
              type="time"
              value={profile.notificationSettings.reminderTime}
              onChange={(e) => updateSetting('reminderTime', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="tomorrowWorkoutReady">
              Tomorrow's workout ready
            </Label>
            <Switch
              id="tomorrowWorkoutReady"
              checked={profile.notificationSettings.tomorrowWorkoutReady}
              onCheckedChange={(checked) =>
                updateSetting('tomorrowWorkoutReady', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="streakReminder">Streak reminder</Label>
            <Switch
              id="streakReminder"
              checked={profile.notificationSettings.streakReminder}
              onCheckedChange={(checked) =>
                updateSetting('streakReminder', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="missedDayCheck">Check in on unlogged days</Label>
            <Switch
              id="missedDayCheck"
              checked={profile.notificationSettings.missedDayCheck}
              onCheckedChange={(checked) =>
                updateSetting('missedDayCheck', checked)
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
