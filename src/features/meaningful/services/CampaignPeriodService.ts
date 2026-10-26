export interface CampaignPeriod {
  year: number
  month: number
  /** First local date of the month (YYYY-MM-DD), inclusive. */
  startDate: string
  /** Last local date of the month (YYYY-MM-DD), inclusive. */
  endDate: string
}

export type CampaignPhase = 'upcoming' | 'active' | 'ended'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function yearAndMonthOf(isoDate: string): [number, number] {
  const [year, month] = isoDate.split('-').map(Number) as [number, number]
  return [year, month]
}

/**
 * Campaign months are compared as plain local date strings, never as
 * instants: `todayIso` comes from the user's own timezone and each
 * activity carries its own local date, so a 23:30 run on 30 November
 * counts for November wherever the athlete was.
 */
export const CampaignPeriodService = {
  getPeriod(month: number, year: number): CampaignPeriod {
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
    return {
      year,
      month,
      startDate: `${year}-${pad(month)}-01`,
      endDate: `${year}-${pad(month)}-${pad(lastDay)}`,
    }
  },

  /** This year's occurrence while the month is running, otherwise the next one. */
  getCurrentOrNextPeriod(month: number, todayIso: string): CampaignPeriod {
    const [year, currentMonth] = yearAndMonthOf(todayIso)
    return this.getPeriod(month, currentMonth > month ? year + 1 : year)
  },

  getPhase(period: CampaignPeriod, todayIso: string): CampaignPhase {
    if (todayIso < period.startDate) return 'upcoming'
    if (todayIso > period.endDate) return 'ended'
    return 'active'
  },

  /** Days left including today: the whole month before it starts, 0 once it has ended. */
  daysRemaining(period: CampaignPeriod, todayIso: string): number {
    const lastDay = Number(period.endDate.slice(8, 10))
    switch (this.getPhase(period, todayIso)) {
      case 'upcoming':
        return lastDay
      case 'ended':
        return 0
      case 'active':
        return lastDay - Number(todayIso.slice(8, 10)) + 1
    }
  },

  contains(period: CampaignPeriod, localDate: string): boolean {
    return localDate >= period.startDate && localDate <= period.endDate
  },
}
