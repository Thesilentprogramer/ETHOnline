/// <reference types="vite/client" />

interface Navigator {
  gpu?: {
    requestAdapter(): Promise<{
      info?: { vendor?: string; architecture?: string; device?: string }
      limits: { maxBufferSize: number }
    } | null>
  }
}

declare module '@runtime/room/models.js' {
  export const NEED_GB: Record<string, number>
  export const MODELS: Record<string, { label: string; kind: string }>
  export const MAX_SEQ: number
  export const MAX_NEW: number
  export const MIN_ROOM: number
}
