import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ModelSelect } from '@/components/ui/select'
import { Shell } from '@/components/Shell'
import { CHANNEL, lastUserText, promptToMessages, type ChatMessage } from '@/swarm/openai.ts'
import {
  ensureRoomCode,
  loadJobs,
  makeJob,
  saveJobs,
  saveRoomCode,
  type JobStatus,
  type SwarmJob,
} from '@/swarm/queue.ts'
import { MODELS, runtimeRoomUrl } from '@/swarm/runtime.ts'

const STATUS: Record<JobStatus, string> = {
  waiting: 'border-white/25 text-white/60',
  running: 'border-white/40 text-white',
  done: 'border-white/20 text-white/50',
  failed: 'border-red-400/40 text-red-300',
}

export function Market() {
  const [params, setParams] = useSearchParams()
  const role = params.get('role') === 'worker' ? 'worker' : 'host'
  const [code, setCode] = useState(() => (params.get('code') || '').toUpperCase() || ensureRoomCode())
  const [prompt, setPrompt] = useState(() => params.get('prompt') || '')
  const [model, setModel] = useState('qwen3-0.6b')
  const [jobs, setJobs] = useState<SwarmJob[]>(() => loadJobs())
  const [cluster, setCluster] = useState('waiting for the room')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const postedOnce = useRef(false)
  const seedPrompt = useRef(params.get('prompt') || '')

  const src = useMemo(
    () => runtimeRoomUrl({ code, host: role === 'host', join: role === 'worker' }),
    [code, role],
  )

  const modelItems = useMemo(
    () => Object.fromEntries(Object.entries(MODELS).map(([id, m]) => [id, m.label])),
    [],
  )

  useEffect(() => {
    saveRoomCode(code)
    const next = new URLSearchParams()
    next.set('code', code)
    next.set('role', role)
    setParams(next, { replace: true })
  }, [code, role])

  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      const d = ev.data
      if (!d || d.channel !== CHANNEL) return
      if (d.t === 'queue' && Array.isArray(d.jobs)) {
        setJobs(d.jobs)
        saveJobs(d.jobs)
      }
      if (d.t === 'room' && d.code) setCode(String(d.code).toUpperCase())
      if (d.t === 'cluster') setCluster(String(d.summary || d.cluster || ''))
      if (d.t === 'ready') flushPending(iframeRef.current)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  useEffect(() => {
    const seed = seedPrompt.current
    if (!seed || postedOnce.current || role !== 'host') return
    postedOnce.current = true
    enqueue(promptToMessages(seed), model)
  }, [])

  function sendIframe(msg: object) {
    iframeRef.current?.contentWindow?.postMessage({ channel: CHANNEL, ...msg }, '*')
  }

  function enqueue(messages: ChatMessage[], modelId: string) {
    const job = makeJob(modelId, messages)
    const next = [...loadJobs().filter((j) => j.id !== job.id), job].slice(-40)
    setJobs(next)
    saveJobs(next)
    sendIframe({ t: 'enqueue', job })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const text = prompt.trim()
    if (!text) return
    enqueue(promptToMessages(text), model)
    setPrompt('')
    toast.success('Queued')
  }

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => toast.success('Room code copied'))
  }

  const waiting = jobs.filter((j) => j.status === 'waiting').length

  return (
    <Shell>
      <main className="gutter mx-auto grid min-h-[calc(100svh-var(--header-h))] max-w-6xl gap-8 pb-10 md:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        <section>
          <p className="text-xs tracking-[0.2em] text-white/40 uppercase">Marketplace</p>
          <h1 className="font-instrument mt-2 text-4xl md:text-5xl">Queue a completion</h1>
          <p className="mt-2 max-w-xl text-sm tracking-normal text-white/55">
            Room{' '}
            <button type="button" className="press text-white underline decoration-white/20" onClick={copyCode}>
              {code}
            </button>
            {waiting ? ` · ${waiting} waiting` : ''}. {cluster}
          </p>

          <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What should the swarm do?"
              className="h-28 border-0 bg-transparent px-0 text-base focus:border-transparent"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ModelSelect value={model} onValueChange={setModel} items={modelItems} />
              <Button type="submit" size="sm">
                Post task
              </Button>
              <Link to={`/onboard?intent=worker&code=${code}`} className="text-xs text-white/50 underline">
                Offer this device
              </Link>
            </div>
          </form>

          <ul className="mt-8 space-y-3">
            {jobs.length === 0 && (
              <li className="font-instrument text-xl text-white/40">No tasks yet. Post one above.</li>
            )}
            {jobs.map((job) => (
              <li key={job.id} className="queue-row rounded-2xl border border-white/10 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge className={STATUS[job.status]}>{job.status}</Badge>
                  <span className="text-xs text-white/45">{job.model}</span>
                </div>
                <p className="mt-2 text-sm tracking-normal text-white/90">{lastUserText(job.messages) || '—'}</p>
                {job.reply && <p className="mt-2 text-sm tracking-normal text-white/60">{job.reply}</p>}
                {job.error && <p className="mt-2 text-sm text-red-300">{job.error}</p>}
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex min-h-[50vh] flex-col py-1">
          <p className="mb-3 text-xs tracking-[0.16em] text-white/40 uppercase">Cluster</p>
          <iframe
            ref={iframeRef}
            title="Trusted Swarm runtime"
            className="min-h-[52vh] w-full flex-1 rounded-3xl border border-white/10 bg-[#0a0608]"
            src={src}
            allow="gpu; webgpu; cross-origin-isolated"
          />
        </aside>
      </main>
    </Shell>
  )
}

function flushPending(frame: HTMLIFrameElement | null) {
  const jobs = loadJobs().filter((j) => j.status === 'waiting')
  for (const job of jobs) {
    frame?.contentWindow?.postMessage({ channel: CHANNEL, t: 'enqueue', job }, '*')
  }
}
