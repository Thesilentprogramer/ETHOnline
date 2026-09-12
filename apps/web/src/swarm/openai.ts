export type ChatRole = 'system' | 'user' | 'assistant'
export type ChatMessage = { role: ChatRole; content: string }

export type ChatCompletionRequest = {
  model: string
  messages: ChatMessage[]
  stream?: boolean
}

export type ChatCompletionChunk = {
  id: string
  object: 'chat.completion.chunk'
  created: number
  model: string
  choices: { index: number; delta: { role?: 'assistant'; content?: string }; finish_reason: 'stop' | null }[]
}

export type ChatCompletion = {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: { index: number; message: ChatMessage; finish_reason: 'stop' }[]
}

export const OPENAI_BRIDGE = 'http://127.0.0.1:11435'
export const CHANNEL = 'trusted-swarm'

export function lastUserText(messages: ChatMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && messages[i].content.trim()) return messages[i].content.trim()
  }
  return ''
}

export function promptToMessages(prompt: string, system?: string): ChatMessage[] {
  const messages: ChatMessage[] = []
  if (system?.trim()) messages.push({ role: 'system', content: system.trim() })
  messages.push({ role: 'user', content: prompt.trim() })
  return messages
}

export function completionId() {
  const a = 'ABCDEFGHJKMNPQRSTVWXYZ23456789'
  const b = crypto.getRandomValues(new Uint8Array(12))
  return 'chatcmpl-' + [...b].map((n) => a[n % a.length]).join('')
}

export function toCompletion(id: string, model: string, content: string): ChatCompletion {
  return {
    id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
  }
}

export function toChunk(id: string, model: string, delta: string, done = false): ChatCompletionChunk {
  return {
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, delta: done ? {} : { content: delta }, finish_reason: done ? 'stop' : null }],
  }
}
