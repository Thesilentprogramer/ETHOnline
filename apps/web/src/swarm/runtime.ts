import { MODELS, NEED_GB } from '@runtime/room/models.js'

export { MODELS, NEED_GB }

export const DEFAULT_MODEL_ID = 'qwen3.8-27b' as const

export function defaultModelLabel() {
  return MODELS[DEFAULT_MODEL_ID]?.label ?? DEFAULT_MODEL_ID
}

export function runtimeRoomUrl(opts: { code?: string } = {}) {
  const q = new URLSearchParams()
  if (opts.code) q.set('code', opts.code.trim().toUpperCase())
  const s = q.toString()
  return `/runtime/p2p.html${s ? `?${s}` : ''}`
}
