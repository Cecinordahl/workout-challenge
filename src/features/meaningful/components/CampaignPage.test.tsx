import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { User as FirebaseUser } from 'firebase/auth'
import { AuthContext } from '@/app/providers/AuthContext'
import type { UserProfile } from '@/types/user'
import type { StoredParticipation } from '@/features/meaningful/services/ParticipationService'
import { CampaignPage } from './CampaignPage'

const mocks = vi.hoisted(() => ({
  join: vi.fn(),
  participation: null as StoredParticipation | null,
}))

// The real Firebase config needs env credentials; nothing here touches it.
vi.mock('@/services/firebase/config', () => ({ auth: {}, db: {} }))

vi.mock('@/features/meaningful/services/ParticipationService', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/meaningful/services/ParticipationService')
  >('@/features/meaningful/services/ParticipationService')
  return {
    ...actual,
    ParticipationService: {
      join: mocks.join,
      evaluate: vi.fn(),
      subscribeToParticipation: (
        _id: string,
        callback: (p: StoredParticipation | null) => void,
      ) => {
        callback(mocks.participation)
        return () => {}
      },
      subscribeToBadges: vi.fn(),
    },
  }
})

const profile = {
  id: 'user-1',
  timezone: 'Europe/Oslo',
  distanceUnit: 'km',
} as UserProfile

function renderPage(slug = 'movember') {
  return render(
    <AuthContext.Provider
      value={{
        user: { uid: 'user-1' } as FirebaseUser,
        profile,
        initializing: false,
      }}
    >
      <MemoryRouter initialEntries={[`/causes/${slug}`]}>
        <Routes>
          <Route path="/causes/:slug" element={<CampaignPage />} />
          <Route path="/causes" element={<p>Overview</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('CampaignPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-05T12:00:00Z'))
    mocks.join.mockReset().mockResolvedValue({ participationId: 'p' })
    mocks.participation = null
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('redirects unknown campaigns to the overview', () => {
    renderPage('nope')
    expect(screen.getByText('Overview')).toBeTruthy()
  })

  it('only enables joining once a goal is chosen, then joins with the selection', () => {
    renderPage()
    const join = screen.getByRole('button', { name: 'Join November 2026' })
    expect(join).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('radio', { name: /Gold · Hard/ }))
    expect(join).toHaveProperty('disabled', false)
    fireEvent.click(join)

    expect(mocks.join).toHaveBeenCalledWith('movember', {
      statisticId: 'nov-60-men-per-hour',
      trackId: 'on-foot',
      goalId: 'nov-hard',
    })
  })

  it('switches to the cycling goals and clears a goal from the other track', () => {
    renderPage()
    fireEvent.click(screen.getByRole('radio', { name: /Gold · Hard/ }))
    fireEvent.click(screen.getByRole('radio', { name: /Cycling/ }))

    expect(screen.getByText('180 km in total')).toBeTruthy()
    expect(screen.queryByText('60 km in total')).toBe(null)
    expect(
      screen.getByRole('button', { name: 'Join November 2026' }),
    ).toHaveProperty('disabled', true)
  })

  it('shows a statistic’s source only when its context is opened', () => {
    renderPage()
    expect(screen.queryByText(/Source: World Health Organization/)).toBe(null)
    fireEvent.click(
      screen.getAllByRole('button', { name: /Context & source/ })[1]!,
    )
    expect(screen.getByText(/Source: World Health Organization/)).toBeTruthy()
  })

  it('shows support resources for this campaign', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /Find a Helpline/ })).toBeTruthy()
  })

  it('shows a locked summary instead of the picker once locked', () => {
    mocks.participation = {
      id: 'user-1_movember_2026',
      userId: 'user-1',
      campaignId: 'movember',
      year: 2026,
      trackId: 'on-foot',
      statisticId: 'nov-60-men-per-hour',
      goalId: 'nov-medium',
      lockedAt: '2026-11-02T08:00:00Z',
      status: 'active',
      progress: {
        progressValue: 12.5,
        target: 30,
        percent: 42,
        completed: false,
        completedOn: null,
        countedActivityCount: 2,
      },
    }
    renderPage()
    expect(screen.getByText("You're in")).toBeTruthy()
    expect(screen.getByText('12.5 / 30 km')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Change my choice' })).toBe(
      null,
    )
    expect(screen.queryByRole('button', { name: /Join/ })).toBe(null)
  })

  it('lets an unlocked participant reopen the picker', () => {
    mocks.participation = {
      id: 'user-1_movember_2026',
      userId: 'user-1',
      campaignId: 'movember',
      year: 2026,
      trackId: 'on-foot',
      statisticId: null,
      goalId: 'nov-easy',
      lockedAt: null,
      status: 'active',
    }
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Change my choice' }))
    expect(screen.getByRole('button', { name: 'Save my choice' })).toBeTruthy()
  })
})
