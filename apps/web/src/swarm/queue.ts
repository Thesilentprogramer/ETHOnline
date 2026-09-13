import { completionId, type ChatMessage } from './openai.ts'

const ALPH = 'ABCDEFGHJKMNPQRSTVWXYZ23456789'
const ROOM_KEY = 'trusted-swarm-room-code'
const JOBS_KEY = 'trusted-swarm-jobs'

export type JobStatus = 'waiting' | 'running' | 'done' | 'failed'

export type JobReceipt = {
  jobId: string
  model: string
  status: string
  payer: string
  payTo: string
  amountTinybar: number
  payTx: string
  payScan: string
  topicId: string
  hcsTx: string
  hcsScan: string
  credits: { id: string; role: string; gb: number; tinybar: number; ens?: string; account?: string }[]
  payouts?: { id: string; role: string; account: string; tinybar: number; action: string; reason?: string; tx?: string }[]
}

export type SwarmJob = {
  id: string
  model: string
  messages: ChatMessage[]
  status: JobStatus
  reply: string
  error?: string
  source: string
  createdAt: number
  paid?: boolean
  receipt?: JobReceipt
}

export function newRoomCode() {
  const b = crypto.getRandomValues(new Uint8Array(4))
  return [...b].map((n) => ALPH[n % ALPH.length]).join('')
}

export function loadRoomCode() {
  try {
    return (localStorage.getItem(ROOM_KEY) || '').toUpperCase() || null
  } catch {
    return null
  }
}

export function saveRoomCode(code: string) {
  localStorage.setItem(ROOM_KEY, code.toUpperCase())
}

export function ensureRoomCode() {
  const existing = loadRoomCode()
  if (existing) return existing
  const code = newRoomCode()
  saveRoomCode(code)
  return code
}

export function loadJobs(): SwarmJob[] {
  try {
    const raw = localStorage.getItem(JOBS_KEY)
    return raw ? (JSON.parse(raw) as SwarmJob[]) : []
  } catch {
    return []
  }
}

export function saveJobs(jobs: SwarmJob[]) {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs.slice(-40)))
}

export function makeJob(model: string, messages: ChatMessage[], source = 'market'): SwarmJob {
  return {
    id: completionId(),
    model,
    messages,
    status: 'waiting',
    reply: '',
    source,
    createdAt: Date.now(),
  }
}
