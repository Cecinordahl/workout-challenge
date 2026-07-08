/** Today's date (YYYY-MM-DD) as seen in the given IANA timezone. */
export function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(
    new Date(),
  )
}

/** Adds (or subtracts) whole days to an ISO date string, returning ISO date. */
export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number) as [
    number,
    number,
    number,
  ]
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function toUtcMillis(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number) as [
    number,
    number,
    number,
  ]
  return Date.UTC(year, month - 1, day)
}

/** Whole number of days from `fromIsoDate` to `toIsoDate` (negative if `toIsoDate` is earlier). */
export function daysBetweenIsoDates(
  fromIsoDate: string,
  toIsoDate: string,
): number {
  const MS_PER_DAY = 86_400_000
  return Math.round(
    (toUtcMillis(toIsoDate) - toUtcMillis(fromIsoDate)) / MS_PER_DAY,
  )
}
