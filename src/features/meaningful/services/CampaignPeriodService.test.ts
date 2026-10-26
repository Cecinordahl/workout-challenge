import { afterEach, describe, expect, it, vi } from 'vitest'
import { todayInTimezone } from '@/utils/date'
import { CampaignPeriodService } from './CampaignPeriodService'

describe('CampaignPeriodService.getPeriod', () => {
  it('covers the whole calendar month', () => {
    expect(CampaignPeriodService.getPeriod(11, 2026)).toEqual({
      year: 2026,
      month: 11,
      startDate: '2026-11-01',
      endDate: '2026-11-30',
    })
    expect(CampaignPeriodService.getPeriod(12, 2026).endDate).toBe('2026-12-31')
  })

  it('handles February in leap and non-leap years', () => {
    expect(CampaignPeriodService.getPeriod(2, 2028).endDate).toBe('2028-02-29')
    expect(CampaignPeriodService.getPeriod(2, 2027).endDate).toBe('2027-02-28')
  })
})

describe('CampaignPeriodService.getCurrentOrNextPeriod', () => {
  it("returns this year's period while the month is running", () => {
    expect(
      CampaignPeriodService.getCurrentOrNextPeriod(11, '2026-11-15').year,
    ).toBe(2026)
  })

  it('returns this year for a month still ahead', () => {
    expect(
      CampaignPeriodService.getCurrentOrNextPeriod(12, '2026-10-26').year,
    ).toBe(2026)
  })

  it('rolls over to next year once the month has passed', () => {
    expect(
      CampaignPeriodService.getCurrentOrNextPeriod(11, '2026-12-01').year,
    ).toBe(2027)
  })
})

describe('CampaignPeriodService boundaries', () => {
  const november = CampaignPeriodService.getPeriod(11, 2026)

  it('includes the first and last day and excludes the days either side', () => {
    expect(CampaignPeriodService.contains(november, '2026-10-31')).toBe(false)
    expect(CampaignPeriodService.contains(november, '2026-11-01')).toBe(true)
    expect(CampaignPeriodService.contains(november, '2026-11-30')).toBe(true)
    expect(CampaignPeriodService.contains(november, '2026-12-01')).toBe(false)
  })

  it('reports the phase relative to the given local date', () => {
    expect(CampaignPeriodService.getPhase(november, '2026-10-31')).toBe(
      'upcoming',
    )
    expect(CampaignPeriodService.getPhase(november, '2026-11-01')).toBe(
      'active',
    )
    expect(CampaignPeriodService.getPhase(november, '2026-12-01')).toBe('ended')
  })
})

describe('campaign phase across time zones', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts the month by the user’s local date, not UTC', () => {
    // 31 Oct 12:00 UTC is already 1 Nov 01:00 in Auckland (UTC+13).
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-31T12:00:00Z'))
    const november = CampaignPeriodService.getPeriod(11, 2026)

    expect(
      CampaignPeriodService.getPhase(
        november,
        todayInTimezone('Pacific/Auckland'),
      ),
    ).toBe('active')
    expect(
      CampaignPeriodService.getPhase(
        november,
        todayInTimezone('America/Los_Angeles'),
      ),
    ).toBe('upcoming')
  })
})
