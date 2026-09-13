import { CUES, clamp, ramp, smooth } from './scrub.ts'

console.assert(clamp(2, 0, 1) === 1 && clamp(-1, 0, 1) === 0)
console.assert(smooth(0) === 0 && smooth(1) === 1)
console.assert(Math.abs(smooth(0.5) - 0.5) < 1e-9)
console.assert(ramp(0, 0, 0) === 1)
console.assert(ramp(-0.1, 0, 0) === 0)
console.assert(ramp(0.39, 0.35, 0.43) > 0 && ramp(0.39, 0.35, 0.43) < 1)
console.assert(CUES.length === 3 && CUES[0][2] < CUES[1][0])
console.log('landing scrub helpers ok')
