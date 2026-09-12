import { capabilityScore, recommendRole, SCORE_WEIGHTS } from './capability.ts'

const weightSum =
  SCORE_WEIGHTS.compute +
  SCORE_WEIGHTS.network +
  SCORE_WEIGHTS.memory +
  SCORE_WEIGHTS.stability +
  SCORE_WEIGHTS.history

console.assert(Math.abs(weightSum - 1) < 1e-9, 'weights must sum to 1')
console.assert(capabilityScore({ compute: 1, network: 1, memory: 1, stability: 1, history: 1 }) === 100)
console.assert(capabilityScore({ compute: 0, network: 0, memory: 0, stability: 0, history: 0 }) === 0)
console.assert(recommendRole({ webgpu: false, score: 99, isPhone: false }) === 'observer')
console.assert(recommendRole({ webgpu: true, score: 80, isPhone: false }) === 'heavy-worker')
console.assert(recommendRole({ webgpu: true, score: 50, isPhone: false }) === 'standard-worker')
console.assert(recommendRole({ webgpu: true, score: 80, isPhone: true }) === 'light-worker')
console.log('capability self-check ok')
