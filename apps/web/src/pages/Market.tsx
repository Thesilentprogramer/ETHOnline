import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  type JobReceipt,
  type JobStatus,
  type SwarmJob,
} from '@/swarm/queue.ts'
import { MODELS, runtimeRoomUrl } from '@/swarm/runtime.ts'
import { loadEns } from '@/swarm/session.ts'

const STATUS: Record<JobStatus, string> = {
  waiting: 'border-[var(--rule)] text-[var(--fg-faint)]',
  running: 'border-[var(--fg)] text-[var(--fg)]',
  done: 'border-[var(--rule)] text-[var(--fg-faint)]',
  failed: 'border-red-700/40 text-red-800',
}

export function Market() {
  const [params, setParams] = useSearchParams()
  const role = params.get('role') === 'worker' ? 'worker' : 'host'
  const [code, setCode] = useState(() => {
    const fromUrl = (params.get('code') || '').toUpperCase()
    if (fromUrl) return fromUrl
    if (params.get('role') === 'worker') return ''
    return ensureRoomCode()
  })
  const [joinDraft, setJoinDraft] = useState('')
  const [prompt, setPrompt] = useState(() => params.get('prompt') || '')
  const [model, setModel] = useState(() => params.get('model') || 'qwen3-0.6b')
  const [jobs, setJobs] = useState<SwarmJob[]>(() => loadJobs())
  const [cluster, setCluster] = useState('waiting for the room')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const postedOnce = useRef(false)
  const seedPrompt = useRef(params.get('prompt') || '')

  const src = useMemo(
    () => (code ? runtimeRoomUrl({ code, host: role === 'host', join: role === 'worker', ens: loadEns() }) : ''),
    [code, role],
  )

  const modelItems = useMemo(
    () => Object.fromEntries(Object.entries(MODELS).map(([id, m]) => [id, m.label])),
    [],
  )

  useEffect(() => {
    if (!code) return
    saveRoomCode(code)
    const next = new URLSearchParams()
    next.set('code', code)
    next.set('role', role)
    setParams(next, { replace: true })
  }, [code, role, setParams])

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
      if (d.t === 'receipt' && d.receipt && d.id) {
        setJobs((prev) => {
          const next = prev.map((j) => (j.id === d.id ? { ...j, receipt: d.receipt, paid: true } : j))
          saveJobs(next)
          return next
        })
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  useEffect(() => {
    const seed = seedPrompt.current
    if (!seed || postedOnce.current || role !== 'host' || !code) return
    postedOnce.current = true
    enqueue(promptToMessages(seed), model)
  }, [code])

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

  function applyJoin(e: FormEvent) {
    e.preventDefault()
    const next = joinDraft.trim().toUpperCase()
    if (!next) {
      toast.error('Need a room code')
      return
    }
    setCode(next)
  }

  const waiting = jobs.filter((j) => j.status === 'waiting').length

  if (role === 'worker' && !code) {
    return (
      <Shell>
        <main className="page mx-auto max-w-xl pt-10 md:pt-16">
          <h1 className="display text-4xl md:text-5xl">Join this room</h1>
          <p className="mt-4 max-w-md text-[var(--fg-soft)]">
            Paste the host’s code. Offering this device never mints a new room.
          </p>
          <form onSubmit={applyJoin} className="paper-box mt-10 p-5">
            <label htmlFor="join-code" className="block text-xs tracking-[0.04em] text-[var(--fg-faint)]">
              Room code
            </label>
            <Input
              id="join-code"
              className="mt-2 border-0 px-0 uppercase"
              value={joinDraft}
              onChange={(e) => setJoinDraft(e.target.value.toUpperCase())}
              placeholder="CA7Z"
              autoComplete="off"
              spellCheck={false}
            />
            <Button type="submit" className="mt-6">
              Continue
            </Button>
          </form>
        </main>
      </Shell>
    )
  }

  return (
    <Shell>
      <main className="page mx-auto grid min-h-[calc(100svh-var(--header-h))] max-w-6xl gap-10 pt-8 pb-12 md:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] md:gap-12 md:pt-10">
        <section>
          <h1 className="display text-4xl md:text-5xl">Queue a completion</h1>
          <p className="mt-4 max-w-xl text-sm tracking-normal text-[var(--fg-soft)]">
            Room{' '}
            <button type="button" className="press text-[var(--fg)] underline decoration-[var(--rule)]" onClick={copyCode}>
              {code}
            </button>
            {waiting ? ` · ${waiting} waiting` : ''}. {cluster}
          </p>

          <form onSubmit={onSubmit} className="paper-box mt-10 p-5">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What should the swarm do?"
              className="h-28 border-0 bg-transparent px-0 text-base focus:border-transparent"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ModelSelect value={model} onValueChange={setModel} items={modelItems} />
              <Button type="submit" size="sm">
                Post task
              </Button>
              <Link to={`/onboard?intent=worker&code=${code}`} className="text-xs text-[var(--fg-faint)] underline">
                Offer this device
              </Link>
            </div>
          </form>

          <ul className="mt-10 space-y-4">
            {jobs.length === 0 && (
              <li className="display text-xl text-[var(--fg-faint)]">No tasks yet. Post one above.</li>
            )}
            {jobs.map((job) => (
              <li key={job.id} className="queue-row paper-box px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS[job.status]}>{job.status}</Badge>
                    {job.receipt || job.paid ? <Badge>paid</Badge> : null}
                  </div>
                  <span className="text-xs text-[var(--fg-faint)]">{job.model}</span>
                </div>
                <p className="mt-2 text-sm tracking-normal">{lastUserText(job.messages) || '—'}</p>
                {job.reply && <p className="mt-2 text-sm tracking-normal text-[var(--fg-soft)]">{job.reply}</p>}
                {job.error && <p className="mt-2 text-sm text-red-800">{job.error}</p>}
                {job.receipt && <ReceiptLine receipt={job.receipt} />}
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex min-h-[50vh] flex-col">
          <p className="mb-4 text-xs tracking-[0.16em] text-[var(--fg-faint)] uppercase">Cluster</p>
          {src ? (
            <iframe
              ref={iframeRef}
              title="Trusted Swarm runtime"
              className="min-h-[52vh] w-full flex-1 rounded-[20px] border border-[var(--rule)] bg-[#0a0608]"
              src={src}
              allow="gpu; webgpu; cross-origin-isolated"
            />
          ) : null}
        </aside>
      </main>
    </Shell>
  )
}

function ReceiptLine({ receipt }: { receipt: JobReceipt }) {
  const href = receipt.hcsScan || receipt.payScan
  const credits = (receipt.credits || [])
    .map((c) => `${c.ens ? c.ens + ' ' : ''}${c.role} ${c.tinybar} tinybar`)
    .join(' · ')
  const pays = (receipt.payouts || [])
    .map((p) => `${p.action}${p.tx ? ' ' + p.tx : p.reason ? ' ' + p.reason : ''}`)
    .join(' · ')
  return (
    <p className="mt-2 text-xs tracking-normal text-[var(--fg-faint)]">
      {credits || 'no credits'}
      {pays ? ` · payout ${pays}` : ''}
      {href ? (
        <>
          {' · '}
          <a href={href} target="_blank" rel="noreferrer" className="underline decoration-[var(--rule)]">
            HashScan
          </a>
        </>
      ) : null}
    </p>
  )
}

function flushPending(frame: HTMLIFrameElement | null) {
  const jobs = loadJobs().filter((j) => j.status === 'waiting')
  for (const job of jobs) {
    frame?.contentWindow?.postMessage({ channel: CHANNEL, t: 'enqueue', job }, '*')
  }
}
