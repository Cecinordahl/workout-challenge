import { createContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import type { UserProfile } from '@/types/user'

export interface AuthContextValue {
  user: FirebaseUser | null
  profile: UserProfile | null
  initializing: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)
