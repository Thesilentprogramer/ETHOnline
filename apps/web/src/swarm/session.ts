import {
  CAPABILITY_STORAGE_KEY,
  type CapabilityReport,
  type Role,
} from './capability.ts'

export type SessionControls = {
  maxMinutes: number
  memoryCapGb: number
  workUnfocused: boolean
}

const CONTROLS_KEY = 'trusted-swarm-controls'

export function saveCapability(report: CapabilityReport) {
  sessionStorage.setItem(CAPABILITY_STORAGE_KEY, JSON.stringify(report))
}

export function loadCapability(): CapabilityReport | null {
  try {
    const raw = sessionStorage.getItem(CAPABILITY_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CapabilityReport) : null
  } catch {
    return null
  }
}

export function saveControls(controls: SessionControls) {
  sessionStorage.setItem(CONTROLS_KEY, JSON.stringify(controls))
}

export function loadControls(): SessionControls {
  try {
    const raw = sessionStorage.getItem(CONTROLS_KEY)
    if (raw) return JSON.parse(raw) as SessionControls
  } catch {
    /* ignore */
  }
  return { maxMinutes: 30, memoryCapGb: 4, workUnfocused: false }
}

export function roleLabel(role: Role) {
  return role.replace('-', ' ')
}
