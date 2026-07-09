/**
 * Deliberately duplicated from src/utils/date.ts on the client — this is a
 * separately deployed runtime (Vercel serverless, not the Vite app) with no
 * shared build/package tooling between the two. Keep these two in sync if
 * either changes.
 */

export function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(
    new Date(),
  )
}

export function currentTimeInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
}

function toUtcMillis(isoDate: string): number {
  const parts = isoDate.split('-').map(Number)
  const year = parts[0]!
  const month = parts[1]!
  const day = parts[2]!
  return Date.UTC(year, month - 1, day)
}

export function daysBetweenIsoDates(
  fromIsoDate: string,
  toIsoDate: string,
): number {
  const MS_PER_DAY = 86_400_000
  return Math.round(
    (toUtcMillis(toIsoDate) - toUtcMillis(fromIsoDate)) / MS_PER_DAY,
  )
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/**
 * True once `nowLocal` has reached or passed `reminderTime`. Vercel's free
 * (Hobby) plan only allows cron jobs to run once a day, so unlike the
 * original Cloud Functions design (which checked every 30 minutes for a
 * matching time bucket), this single daily run can't fire exactly at the
 * user's chosen time — it fires at whatever point in the day the cron
 * happens to run, as long as that's at or after their reminder time. If
 * their reminder time hasn't arrived yet at cron-run-time, they simply
 * don't get that day's reminder (there's no second chance until tomorrow).
 */
export function isAtOrAfterReminderTime(
  nowLocal: string,
  reminderTime: string,
): boolean {
  return toMinutes(nowLocal) >= toMinutes(reminderTime)
}
