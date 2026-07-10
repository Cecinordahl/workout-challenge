import { createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { PublicOnly } from '@/components/layout/PublicOnly'
import { LoginPage } from '@/features/authentication/components/LoginPage'
import { SignupPage } from '@/features/authentication/components/SignupPage'
import { NewChallengePage } from '@/features/challenge/components/NewChallengePage'
import { RequireActiveChallenge } from '@/features/challenge/components/RequireActiveChallenge'
import { RedirectIfActiveChallenge } from '@/features/challenge/components/RedirectIfActiveChallenge'
import { DashboardPage } from '@/features/dashboard/components/DashboardPage'
import { HistoryPage } from '@/features/history/components/HistoryPage'
import { TeamsPage } from '@/features/teams/components/TeamsPage'
import { TeamDetailPage } from '@/features/teams/components/TeamDetailPage'
import { JoinTeamPage } from '@/features/teams/components/JoinTeamPage'
import { NotificationsPage } from '@/features/notifications/components/NotificationsPage'
import { StravaCallbackPage } from '@/features/integrations/components/StravaCallbackPage'
import { AccountPage } from '@/features/authentication/components/AccountPage'

export const router = createBrowserRouter([
  {
    element: <PublicOnly />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            element: <RedirectIfActiveChallenge />,
            children: [
              { path: '/challenge/new', element: <NewChallengePage /> },
            ],
          },
          {
            element: <RequireActiveChallenge />,
            children: [{ path: '/', element: <DashboardPage /> }],
          },
          { path: '/history', element: <HistoryPage /> },
          { path: '/teams', element: <TeamsPage /> },
          { path: '/teams/:teamId', element: <TeamDetailPage /> },
          { path: '/invite/:code', element: <JoinTeamPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/account', element: <AccountPage /> },
          { path: '/strava/callback', element: <StravaCallbackPage /> },
        ],
      },
    ],
  },
])
