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
        ],
      },
    ],
  },
])
