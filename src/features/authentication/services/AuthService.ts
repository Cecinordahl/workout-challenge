import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth } from '@/services/firebase/config'

export const AuthService = {
  async signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<User> {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    )
    await updateProfile(credential.user, { displayName })
    return credential.user
  },

  async signIn(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
  },

  async signOut(): Promise<void> {
    await signOut(auth)
  },

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback)
  },
}
