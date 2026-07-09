/**
 * Deliberately duplicated from src/utils/date.ts on the client — this is a
 * separately deployed runtime with no shared build/package tooling between
 * the two. Keep these two in sync if either changes.
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

/** True if `time` ("HH:mm") falls in the same `bucketMinutes`-wide window as `reference`. */
export function isSameTimeBucket(
  time: string,
  reference: string,
  bucketMinutes: number,
): boolean {
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
  }
  const bucket = (minutes: number) => Math.floor(minutes / bucketMinutes)
  return bucket(toMinutes(time)) === bucket(toMinutes(reference))
}
