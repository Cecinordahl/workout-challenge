import { createBrowserRouter } from 'react-router-dom'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { PublicOnly } from '@/components/layout/PublicOnly'
import { LoginPage } from '@/features/authentication/components/LoginPage'
import { SignupPage } from '@/features/authentication/components/SignupPage'
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
    children: [{ path: '/', element: <AccountPage /> }],
  },
])
