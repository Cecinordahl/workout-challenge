import { describe, expect, it } from 'vitest'
import { getChallengeEngine } from './getChallengeEngine'
import { ChallengeEngineV1 } from './ChallengeEngineV1'

describe('getChallengeEngine', () => {
  it('resolves the v1 engine', () => {
    expect(getChallengeEngine('v1')).toBeInstanceOf(ChallengeEngineV1)
  })

  it('throws for an unknown version', () => {
    expect(() => getChallengeEngine('v99')).toThrow(/unknown/i)
  })
})
