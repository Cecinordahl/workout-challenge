import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Activity } from '@/types/activity'
import { ManualActivityForm } from './ManualActivityForm'

const mocks = vi.hoisted(() => ({ add: vi.fn() }))

vi.mock('@/services/firebase/config', () => ({ auth: {}, db: {} }))
vi.mock('@/features/activities/services/ActivityService', () => ({
  ActivityService: { addManualActivity: mocks.add },
}))

const stravaRun: Activity = {
  id: 'strava_1',
  userId: 'user-1',
  source: 'strava',
  type: 'run',
  distanceKm: 5.02,
  durationMin: 29,
  startLocal: '2026-11-10T07:00:00',
  localDate: '2026-11-10',
}

function renderForm(onLogged = vi.fn(), existing: Activity[] = []) {
  render(
    <ManualActivityForm
      userId="user-1"
      distanceUnit="km"
      todayIso="2026-11-12"
      minDate="2026-11-01"
      maxDate="2026-11-30"
      activityTypes={['run', 'walk']}
      existingActivities={existing}
      onLogged={onLogged}
    />,
  )
  return onLogged
}

function fill(values: { date?: string; distance: string; duration: string }) {
  if (values.date) {
    fireEvent.change(screen.getByLabelText('Date'), {
      target: { value: values.date },
    })
  }
  fireEvent.change(screen.getByLabelText('Distance (km)'), {
    target: { value: values.distance },
  })
  fireEvent.change(screen.getByLabelText('Duration (min)'), {
    target: { value: values.duration },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Log activity' }))
}

describe('ManualActivityForm', () => {
  beforeEach(() => {
    mocks.add.mockReset().mockResolvedValue('new-id')
  })
  afterEach(cleanup)

  it('saves a valid activity and reports back', async () => {
    const onLogged = renderForm()
    fill({ distance: '5', duration: '30' })
    await vi.waitFor(() => expect(onLogged).toHaveBeenCalled())
    expect(mocks.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'run',
        distanceKm: 5,
        durationMin: 30,
        localDate: '2026-11-12',
        source: 'manual',
      }),
    )
  })

  it('shows validation errors instead of saving', () => {
    renderForm()
    fill({ distance: '50', duration: '60' })
    expect(screen.getByRole('alert').textContent).toMatch(/faster than/)
    expect(mocks.add).not.toHaveBeenCalled()
  })

  it('warns about a likely duplicate and only saves when confirmed', async () => {
    const onLogged = renderForm(vi.fn(), [stravaRun])
    fill({ date: '2026-11-10', distance: '5', duration: '30' })

    expect(screen.getByText(/from Strava/)).toBeTruthy()
    expect(mocks.add).not.toHaveBeenCalled()

    fireEvent.click(
      screen.getByRole('button', { name: "It's a different one" }),
    )
    await vi.waitFor(() => expect(onLogged).toHaveBeenCalled())
    expect(mocks.add).toHaveBeenCalledTimes(1)
  })

  it('lets the user back out of a duplicate', () => {
    renderForm(vi.fn(), [stravaRun])
    fill({ date: '2026-11-10', distance: '5', duration: '30' })
    fireEvent.click(screen.getByRole('button', { name: "Don't log" }))
    expect(mocks.add).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Log activity' })).toBeTruthy()
  })
})
