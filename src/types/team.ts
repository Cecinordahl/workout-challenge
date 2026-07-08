import type { Timestamp } from 'firebase/firestore'

export interface Team {
  id: string
  ownerId: string
  name: string
  createdAt: Timestamp
  /** Denormalized copy of the active invite code for quick display; the
   * `teamInvites` doc with this same ID remains the source of truth used
   * to actually resolve a join. */
  inviteCode: string
}

export type TeamMemberRole = 'owner' | 'member'

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  displayName: string
  role: TeamMemberRole
  joinedAt: Timestamp
  /** Denormalized snapshot of the member's current-challenge progress, kept
   * fresh by that member's own client (see TeamService.syncMyProgressToTeams)
   * — this is how teammates see each other's progress without needing
   * cross-user read access to challenges/dailyResults. */
  currentChallengeTitle: string | null
  currentPoints: number
  currentStreak: number
  progressUpdatedAt: Timestamp | null
}

export interface TeamInvite {
  /** The invite code itself, used as the document ID. */
  id: string
  teamId: string
  createdBy: string
  createdAt: Timestamp
  active: boolean
}
