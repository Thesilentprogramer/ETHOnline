import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Shell } from '@/components/Shell'
import { cn } from '@/lib/utils'
import { defaultModelLabel, runtimeRoomUrl } from '@/swarm/runtime.ts'
import { loadCapability, loadControls, roleLabel } from '@/swarm/session.ts'

export function Room() {
  const [params, setParams] = useSearchParams()
  const role = params.get('role') === 'worker' ? 'worker' : 'host'
  const [joinCode, setJoinCode] = useState(params.get('code') ?? '')
  const [appliedCode, setAppliedCode] = useState(params.get('code') ?? '')
  const [startedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [iframeStatus, setIframeStatus] = useState('runtime loading')
  const cap = loadCapability()
  const controls = loadControls()

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startedAt])

  const src = useMemo(
    () =>
      runtimeRoomUrl({
        code: role === 'worker' ? appliedCode : undefined,
        join: role === 'worker' && !!appliedCode,
      }),
    [role, appliedCode],
  )

  function applyJoin(e: FormEvent) {
    e.preventDefault()
    const next = joinCode.trim().toUpperCase()
    setAppliedCode(next)
    const q = new URLSearchParams(params)
    q.set('role', 'worker')
    if (next) q.set('code', next)
    setParams(q)
  }

  return (
    <Shell>
      <main className="flex min-h-[calc(100svh-var(--header-h))] flex-col">
        <div className="page grid gap-4 border-b border-[var(--rule)] py-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs tracking-normal text-[var(--fg-soft)]">
            <Metric k="role" v={cap ? roleLabel(cap.role) : 'unprobed'} />
            <Metric k="score" v={cap ? String(cap.score) : '—'} />
            <Metric k="tab" v={role} />
            <Metric k="model" v={defaultModelLabel()} />
            <Metric k="elapsed" v={`${elapsed}s`} />
            <Metric k="join" v={elapsed < 2 ? 'starting' : `${elapsed}s`} />
            <Metric k="ttft / tok/s" v="see runtime below" />
            <Metric k="status" v={iframeStatus} />
          </div>
          <p className="text-xs text-[var(--fg-faint)]">
            Same Wi-Fi: laptop creates the room in the runtime below, then open the join URL on your
            phone (Chrome/Edge). Phone WebGPU is limited — it can still join as a light worker.
          </p>
        </div>

        {role === 'worker' && (
          <form onSubmit={applyJoin} className="page flex gap-3 py-4">
            <Input
              placeholder="ROOM CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="max-w-xs uppercase"
            />
            <Button type="submit" variant="outline">
              Load room
            </Button>
          </form>
        )}

        {!cap && (
          <Card className="gutter my-6">
            No capability report in this tab.{' '}
            <Link
              to={`/onboard?intent=${role}${appliedCode ? `&code=${appliedCode}` : ''}`}
              className="underline"
            >
              Run onboarding
            </Link>{' '}
            first.
          </Card>
        )}

        <iframe
          title="Trusted Swarm runtime"
          className="min-h-[70vh] w-full flex-1 bg-[#0a0608]"
          src={src}
          allow="gpu; webgpu; cross-origin-isolated"
          onLoad={() => setIframeStatus('runtime ready')}
        />

        <footer className="page flex flex-wrap items-center gap-4 py-4 text-xs tracking-normal text-[var(--fg-faint)]">
          <span>
            Caps: {controls.maxMinutes} min · {controls.memoryCapGb} GB · unfocused{' '}
            {controls.workUnfocused ? 'on' : 'off'}
          </span>
          <a href="/runtime/p2p.html" className="underline">
            Open room full-page
          </a>
          <Link
            to={`/onboard${appliedCode ? `?code=${appliedCode}` : ''}`}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            Re-probe
          </Link>
        </footer>
      </main>
    </Shell>
  )
}

function Metric({ k, v }: { k: string; v: string }) {
  return (
    <span>
      <span className="text-[var(--fg-faint)]">{k}</span> {v}
    </span>
  )
}
