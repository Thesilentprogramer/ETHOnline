export const SCORE_WEIGHTS = {
  compute: 0.35,
  network: 0.25,
  memory: 0.2,
  stability: 0.1,
  history: 0.1,
} as const

export type Role = 'heavy-worker' | 'standard-worker' | 'light-worker' | 'observer'

export type ScoreInputs = {
  compute: number
  network: number
  memory: number
  stability: number
  history: number
}

export type CapabilityReport = {
  webgpu: boolean
  webrtc: boolean
  gpu: string
  maxBufGB: number
  memoryHeadroomGb: number
  isPhone: boolean
  browser: string
  score: number
  role: Role
  inputs: ScoreInputs
  calibratedAt: string
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

export function capabilityScore(inputs: ScoreInputs): number {
  const w = SCORE_WEIGHTS
  const raw =
    w.compute * clamp01(inputs.compute) +
    w.network * clamp01(inputs.network) +
    w.memory * clamp01(inputs.memory) +
    w.stability * clamp01(inputs.stability) +
    w.history * clamp01(inputs.history)
  return Math.round(raw * 1000) / 10
}

export function recommendRole(opts: {
  webgpu: boolean
  score: number
  isPhone: boolean
}): Role {
  if (!opts.webgpu) return 'observer'
  if (opts.isPhone) return 'light-worker'
  if (opts.score >= 70) return 'heavy-worker'
  if (opts.score >= 40) return 'standard-worker'
  return 'light-worker'
}

export async function probeDevice(): Promise<CapabilityReport> {
  const ua = navigator.userAgent
  const isPhone = /iPhone|Android/i.test(ua)
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Other'
  const webrtc = typeof RTCPeerConnection === 'function'
  let webgpu = false
  let gpu = 'no WebGPU'
  let maxBufGB = 0

  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter()
      if (adapter) {
        webgpu = true
        const info = adapter.info || {}
        gpu = [info.vendor, info.architecture].filter(Boolean).join(' ') || 'GPU'
        maxBufGB = +(adapter.limits.maxBufferSize / 2 ** 30).toFixed(2)
      }
    } catch {
      webgpu = false
    }
  }

  const deviceMem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const memoryHeadroomGb = deviceMem ?? maxBufGB

  const inputs: ScoreInputs = {
    compute: webgpu ? Math.min(1, maxBufGB / 8) : 0,
    network: webrtc ? (isPhone ? 0.45 : 0.75) : 0.1,
    memory: Math.min(1, memoryHeadroomGb / 8),
    stability: isPhone ? 0.35 : 0.8,
    history: 0,
  }
  const score = capabilityScore(inputs)
  const role = recommendRole({ webgpu, score, isPhone })

  return {
    webgpu,
    webrtc,
    gpu,
    maxBufGB,
    memoryHeadroomGb,
    isPhone,
    browser,
    score,
    role,
    inputs,
    calibratedAt: new Date().toISOString(),
  }
}

export const CAPABILITY_STORAGE_KEY = 'trusted-swarm-capability'
