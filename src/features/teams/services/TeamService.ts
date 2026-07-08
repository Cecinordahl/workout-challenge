import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/services/firebase/config'
import { UserProfileService } from '@/features/authentication/services/UserProfileService'
import { ChallengeService } from '@/features/challenge/services/ChallengeService'
import { ChallengeProgressService } from '@/features/challenge/services/ChallengeProgressService'
import { DailyResultService } from '@/features/challenge/services/DailyResultService'
import type { Team, TeamMember } from '@/types/team'
import { todayInTimezone } from '@/utils/date'

const INVITE_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateInviteCode(length = 8): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code +=
      INVITE_CODE_ALPHABET[
        Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)
      ]
  }
  return code
}

function teamMemberDocId(teamId: string, userId: string): string {
  return `${teamId}_${userId}`
}

function mapDoc<T>(snapshot: QueryDocumentSnapshot<DocumentData>): T {
  return { id: snapshot.id, ...snapshot.data() } as T
}

export const TeamService = {
  async createTeam(
    ownerId: string,
    ownerDisplayName: string,
    name: string,
  ): Promise<{ teamId: string; inviteCode: string }> {
    const teamRef = doc(collection(db, 'teams'))
    const memberRef = doc(
      db,
      'teamMembers',
      teamMemberDocId(teamRef.id, ownerId),
    )
    const inviteCode = generateInviteCode()
    const inviteRef = doc(db, 'teamInvites', inviteCode)

    const batch = writeBatch(db)
    batch.set(teamRef, {
      ownerId,
      name,
      createdAt: serverTimestamp(),
      inviteCode,
    })
    batch.set(memberRef, {
      teamId: teamRef.id,
      userId: ownerId,
      displayName: ownerDisplayName,
      role: 'owner',
      joinedAt: serverTimestamp(),
      currentChallengeTitle: null,
      currentPoints: 0,
      currentStreak: 0,
      progressUpdatedAt: null,
    })
    batch.set(inviteRef, {
      teamId: teamRef.id,
      createdBy: ownerId,
      createdAt: serverTimestamp(),
      active: true,
    })
    await batch.commit()

    return { teamId: teamRef.id, inviteCode }
  },

  async getTeamByInviteCode(code: string): Promise<Team | null> {
    const inviteSnap = await getDoc(doc(db, 'teamInvites', code))
    if (!inviteSnap.exists() || inviteSnap.data().active !== true) return null

    const teamId = inviteSnap.data().teamId as string
    const teamSnap = await getDoc(doc(db, 'teams', teamId))
    if (!teamSnap.exists()) return null
    return { id: teamSnap.id, ...teamSnap.data() } as Team
  },

  async joinTeam(
    code: string,
    userId: string,
    displayName: string,
  ): Promise<string> {
    const inviteSnap = await getDoc(doc(db, 'teamInvites', code))
    if (!inviteSnap.exists() || inviteSnap.data().active !== true) {
      throw new Error('This invite link is no longer valid.')
    }
    const teamId = inviteSnap.data().teamId as string
    const memberRef = doc(db, 'teamMembers', teamMemberDocId(teamId, userId))
    const existing = await getDoc(memberRef)
    if (!existing.exists()) {
      await setDoc(memberRef, {
        teamId,
        userId,
        displayName,
        role: 'member',
        joinedAt: serverTimestamp(),
        currentChallengeTitle: null,
        currentPoints: 0,
        currentStreak: 0,
        progressUpdatedAt: null,
      })
    }
    return teamId
  },

  async getMyTeams(userId: string): Promise<Team[]> {
    const membershipSnap = await getDocs(
      query(collection(db, 'teamMembers'), where('userId', '==', userId)),
    )
    const teamIds = membershipSnap.docs.map(
      (docSnapshot) => docSnapshot.data().teamId as string,
    )
    const teams = await Promise.all(
      teamIds.map(async (teamId) => {
        const teamSnap = await getDoc(doc(db, 'teams', teamId))
        return teamSnap.exists()
          ? ({ id: teamSnap.id, ...teamSnap.data() } as Team)
          : null
      }),
    )
    return teams.filter((team): team is Team => team !== null)
  },

  async getTeam(teamId: string): Promise<Team | null> {
    const teamSnap = await getDoc(doc(db, 'teams', teamId))
    return teamSnap.exists()
      ? ({ id: teamSnap.id, ...teamSnap.data() } as Team)
      : null
  },

  subscribeToTeamMembers(
    teamId: string,
    callback: (members: TeamMember[]) => void,
  ): () => void {
    const membersQuery = query(
      collection(db, 'teamMembers'),
      where('teamId', '==', teamId),
    )
    return onSnapshot(membersQuery, (snapshot) => {
      callback(
        snapshot.docs.map((docSnapshot) => mapDoc<TeamMember>(docSnapshot)),
      )
    })
  },

  /**
   * Refreshes the caller's own denormalized progress snapshot across every
   * team they belong to. Teammates only ever read this snapshot on
   * `teamMembers` — not the caller's private challenge/dailyResults docs
   * directly — so this is what keeps the leaderboard accurate. It re-fetches
   * the caller's active challenge fresh rather than trusting any in-memory
   * state, so it stays correct regardless of when it's called from.
   */
  async syncMyProgressToTeams(userId: string): Promise<void> {
    const membershipSnap = await getDocs(
      query(collection(db, 'teamMembers'), where('userId', '==', userId)),
    )
    if (membershipSnap.empty) return

    const profile = await UserProfileService.getProfile(userId)
    const challenge = await ChallengeService.getActiveChallenge(userId)

    let progressUpdate: {
      currentChallengeTitle: string | null
      currentPoints: number
      currentStreak: number
    }

    if (!challenge) {
      progressUpdate = {
        currentChallengeTitle: null,
        currentPoints: 0,
        currentStreak: 0,
      }
    } else {
      const results = await DailyResultService.getResults(challenge.id, userId)
      const todayIso = todayInTimezone(profile?.timezone ?? 'UTC')
      const progress = ChallengeProgressService.computeProgress(
        challenge,
        results,
        todayIso,
      )
      progressUpdate = {
        currentChallengeTitle: challenge.title,
        currentPoints: progress.totalPoints,
        currentStreak: progress.currentStreak,
      }
    }

    await Promise.all(
      membershipSnap.docs.map((memberDoc) =>
        updateDoc(memberDoc.ref, {
          ...progressUpdate,
          ...(profile ? { displayName: profile.displayName } : {}),
          progressUpdatedAt: serverTimestamp(),
        }),
      ),
    )
  },
}
