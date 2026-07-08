import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { router } from '@/app/routes'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
