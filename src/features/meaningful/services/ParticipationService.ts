import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type QuerySnapshot,
} from 'firebase/firestore'
import { auth, db } from '@/services/firebase/config'
import type {
  CampaignParticipation,
  CampaignSelection,
  EarnedBadge,
} from '@/features/meaningful/domain/types'
import type { ParticipationProgress } from './CampaignEvaluationService'

// Client-only (Firebase client SDK) — not part of the code shared with api/.

export type StoredParticipation = CampaignParticipation & {
  progress?: ParticipationProgress
}

export type JoinError =
  | 'locked'
  | 'already_completed'
  | 'unknownTrack'
  | 'unknownStatistic'
  | 'goalNotOffered'

export class JoinCampaignError extends Error {
  readonly code: JoinError | 'unknown'

  constructor(code: JoinError | 'unknown') {
    super(`Could not join campaign: ${code}`)
    this.code = code
  }
}

async function postApi(path: string, body: unknown): Promise<Response> {
  const idToken = await auth.currentUser?.getIdToken()
  return fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken ?? ''}`,
    },
    body: JSON.stringify(body),
  })
}

function mapBadges(snapshot: QuerySnapshot): EarnedBadge[] {
  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() as Omit<EarnedBadge, 'id'>
    return { id: docSnapshot.id, ...data }
  })
}

export const ParticipationService = {
  /** Joins (or, while unlocked, re-selects for) a campaign's current or next month. */
  async join(
    campaignId: string,
    selection: CampaignSelection,
  ): Promise<{ participationId: string }> {
    const res = await postApi('/api/campaign-join', {
      campaignId,
      ...selection,
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      throw new JoinCampaignError((body.error as JoinError) ?? 'unknown')
    }
    return res.json() as Promise<{ participationId: string }>
  },

  /** Asks the server to recompute progress, e.g. after a manual activity changes. */
  async evaluate(participationId: string): Promise<void> {
    const res = await postApi('/api/campaign-evaluate', { participationId })
    if (!res.ok) throw new Error('Failed to update campaign progress.')
  },

  subscribeToParticipation(
    participationId: string,
    callback: (participation: StoredParticipation | null) => void,
  ): () => void {
    return onSnapshot(
      doc(db, 'campaignParticipations', participationId),
      (snapshot) => {
        callback(
          snapshot.exists()
            ? ({
                id: snapshot.id,
                ...snapshot.data(),
              } as StoredParticipation)
            : null,
        )
      },
      // Reading a participation that doesn't exist yet is denied (the rule
      // checks `resource.data.userId`, and there's no resource) — that's
      // simply "not joined". Allowing it would let anyone probe whether
      // another user has joined, since their IDs are predictable.
      () => callback(null),
    )
  },

  subscribeToBadges(
    userId: string,
    callback: (badges: EarnedBadge[]) => void,
  ): () => void {
    const badgesQuery = query(
      collection(db, 'earnedBadges'),
      where('userId', '==', userId),
      orderBy('completedOn', 'desc'),
    )
    return onSnapshot(badgesQuery, (snapshot) => {
      callback(mapBadges(snapshot))
    })
  },
}
