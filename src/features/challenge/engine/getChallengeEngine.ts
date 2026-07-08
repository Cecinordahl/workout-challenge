import { ChallengeEngineV1 } from './ChallengeEngineV1'
import type { IChallengeEngine } from './types'

const engines: Record<string, IChallengeEngine> = {
  v1: new ChallengeEngineV1(),
}

/**
 * Selects an engine implementation by version. A challenge always stores the
 * `algorithmVersion` it was created with, so future engine changes can never
 * retroactively alter a challenge already in progress.
 */
export function getChallengeEngine(version: string): IChallengeEngine {
  const engine = engines[version]
  if (!engine) {
    throw new Error(`Unknown challenge engine version: ${version}`)
  }
  return engine
}
