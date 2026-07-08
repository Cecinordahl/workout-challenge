/**
 * FNV-1a string hash, used to turn an arbitrary seed string into a 32-bit
 * integer state for the PRNG below.
 */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * A small, fast, deterministic PRNG (mulberry32). Not cryptographically
 * secure — it doesn't need to be. Given the same seed it always produces
 * the same sequence of numbers in [0, 1), which is what lets the challenge
 * engine regenerate an identical plan on demand instead of storing it.
 */
export function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed) || 1

  return function next(): number {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
