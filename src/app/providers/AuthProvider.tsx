import { useEffect, useState, type ReactNode } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import { AuthService } from '@/features/authentication/services/AuthService'
import { UserProfileService } from '@/features/authentication/services/UserProfileService'
import type { UserProfile } from '@/types/user'
import { AuthContext } from '@/app/providers/AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    return AuthService.onAuthStateChange((nextUser) => {
      setUser(nextUser)
      setInitializing(false)
    })
  }, [])

  useEffect(() => {
    if (!user) return
    return UserProfileService.subscribeToProfile(user.uid, setProfile)
  }, [user])

  return (
    <AuthContext.Provider
      value={{ user, profile: user ? profile : null, initializing }}
    >
      {children}
    </AuthContext.Provider>
  )
}
