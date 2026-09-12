import { completionId, lastUserText, promptToMessages, toCompletion, toChunk } from './openai.ts'

const m = promptToMessages('hello swarm', 'be brief')
console.assert(m[0].role === 'system' && m[1].role === 'user')
console.assert(lastUserText(m) === 'hello swarm')
const id = completionId()
console.assert(id.startsWith('chatcmpl-'))
console.assert(toChunk(id, 'qwen3-0.6b', '', true).choices[0].finish_reason === 'stop')
const done = toCompletion(id, 'qwen3-0.6b', 'ok')
console.assert(done.object === 'chat.completion' && done.choices[0].message.content === 'ok')
const ch = toChunk(id, 'qwen3-0.6b', 'ok')
console.assert(ch.object === 'chat.completion.chunk' && ch.choices[0].delta.content === 'ok')
console.log('openai contract ok')
