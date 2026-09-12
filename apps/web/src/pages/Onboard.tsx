import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Checkbox } from '@base-ui/react/checkbox'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Shell } from '@/components/Shell'
import { probeDevice, SCORE_WEIGHTS, type CapabilityReport } from '@/swarm/capability.ts'
import { loadControls, roleLabel, saveCapability, saveControls } from '@/swarm/session.ts'

type Step = 'why' | 'probe' | 'score'

export function Onboard() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const intent = params.get('intent') === 'worker' ? 'worker' : 'host'
  const [step, setStep] = useState<Step>('why')
  const [probeTick, setProbeTick] = useState(0)
  const [report, setReport] = useState<CapabilityReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [maxMinutes, setMaxMinutes] = useState(30)
  const [memoryCapGb, setMemoryCapGb] = useState(4)
  const [workUnfocused, setWorkUnfocused] = useState(false)

  useEffect(() => {
    const saved = loadControls()
    setMaxMinutes(saved.maxMinutes)
    setMemoryCapGb(saved.memoryCapGb)
    setWorkUnfocused(saved.workUnfocused)
  }, [])

  useEffect(() => {
    if (step !== 'probe') return
    let cancelled = false
    setBusy(true)
    setError(null)
    probeDevice()
      .then((r) => {
        if (cancelled) return
        setReport(r)
        setStep('score')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'probe failed'
        setError(msg)
        toast.error(msg)
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [step, probeTick])

  function marketQuery(role = intent) {
    const q = new URLSearchParams({ role })
    const code = params.get('code')
    if (code) q.set('code', code)
    return `/market?${q}`
  }

  function skip() {
    navigate(marketQuery())
  }

  function continueToRoom() {
    if (!report) return
    saveCapability(report)
    saveControls({ maxMinutes, memoryCapGb, workUnfocused })
    navigate(marketQuery())
  }

  const stepN = step === 'why' ? 1 : step === 'probe' ? 2 : 3

  return (
    <Shell>
      <main className="gutter mx-auto max-w-3xl py-10 md:py-14">
        <p className="text-xs tracking-normal text-white/45">Step {stepN} of 3</p>

        {step === 'why' && (
          <>
            <h1 className="font-instrument mt-3 text-4xl md:text-5xl">This machine can hold layers</h1>
            <p className="mt-4 max-w-xl tracking-normal text-white/70">
              We measure WebGPU, memory headroom, and WebRTC so the room can schedule work. Not
              identity — no MAC, serial, or fingerprint.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                onClick={() => {
                  setBusy(true)
                  setStep('probe')
                }}
              >
                Calibrate
              </Button>
              <button type="button" onClick={skip} className="press text-sm text-white/50 underline decoration-white/20">
                Skip to market
              </button>
            </div>
          </>
        )}

        {step === 'probe' && (
          <>
            <h1 className="font-instrument mt-3 text-4xl md:text-5xl">Reading this device</h1>
            <p className="mt-4 tracking-normal text-white/70">Adapter, memory, WebRTC — scheduling signals only.</p>
            {busy && !error && <p className="mt-8 text-white/50">Calibrating adapter…</p>}
            {error && (
              <div className="mt-8">
                <p className="text-red-300">{error}</p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Button onClick={() => setProbeTick((n) => n + 1)}>Retry</Button>
                  <button
                    type="button"
                    onClick={skip}
                    className="press text-sm text-white/50 underline decoration-white/20"
                  >
                    Skip to market
                  </button>
                </div>
              </div>
            )}
            {!error && (
              <button
                type="button"
                onClick={skip}
                className="press mt-10 text-sm text-white/50 underline decoration-white/20"
              >
                Skip to market
              </button>
            )}
          </>
        )}

        {step === 'score' && report && (
          <>
            <h1 className="font-instrument mt-3 text-4xl md:text-5xl">This machine can join the room</h1>
            <p className="mt-3 tracking-normal text-white/70">
              Score {report.score} · {roleLabel(report.role)}. Caps stay on this device.
            </p>
            <div className="mt-8 grid gap-4">
              <Card>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs tracking-wide text-white/50">Score</p>
                    <p className="font-instrument text-5xl">{report.score}</p>
                  </div>
                  <p className="text-sm tracking-widest text-white/80 uppercase">{roleLabel(report.role)}</p>
                </div>
                <Progress className="mt-4" value={report.score} />
                <p className="mt-3 text-xs tracking-normal text-white/50">
                  {SCORE_WEIGHTS.compute * 100}% compute · {SCORE_WEIGHTS.network * 100}% network ·{' '}
                  {SCORE_WEIGHTS.memory * 100}% memory · {SCORE_WEIGHTS.stability * 100}% stability ·{' '}
                  {SCORE_WEIGHTS.history * 100}% history (0 until later phases)
                </p>
              </Card>

              <Card className="grid gap-4 text-sm sm:grid-cols-2">
                <Row k="WebGPU" v={report.webgpu ? report.gpu : 'unavailable → observer'} />
                <Row k="WebRTC" v={report.webrtc ? 'supported' : 'missing'} />
                <Row k="Browser" v={report.browser} />
                <Row k="Buffer cap" v={`${report.maxBufGB} GB`} />
                <Row k="Memory headroom" v={`${report.memoryHeadroomGb} GB`} />
                <Row k="Phone" v={report.isPhone ? 'yes (light-worker max)' : 'no'} />
              </Card>

              <Card>
                <h2 className="font-instrument text-2xl">Session controls</h2>
                <label className="mt-4 block text-sm tracking-normal text-white/70">
                  Max session (minutes)
                  <Input
                    className="mt-1"
                    type="number"
                    min={5}
                    max={180}
                    value={maxMinutes}
                    onChange={(e) => setMaxMinutes(Number(e.target.value) || 5)}
                  />
                </label>
                <label className="mt-4 block text-sm tracking-normal text-white/70">
                  Memory cap (GB)
                  <Input
                    className="mt-1"
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={memoryCapGb}
                    onChange={(e) => setMemoryCapGb(Number(e.target.value) || 0.5)}
                  />
                </label>
                <label className="mt-4 flex items-center gap-3 text-sm tracking-normal">
                  <Checkbox.Root
                    checked={workUnfocused}
                    onCheckedChange={setWorkUnfocused}
                    className="press flex size-5 items-center justify-center rounded-md border border-white/25 data-[checked]:bg-white data-[checked]:text-black"
                  >
                    <Checkbox.Indicator className="text-[11px] leading-none">✓</Checkbox.Indicator>
                  </Checkbox.Root>
                  Allow work while this tab is unfocused
                </label>
              </Card>

              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg" onClick={continueToRoom}>
                  Continue as {intent}
                </Button>
                <button type="button" onClick={skip} className="press text-sm text-white/50 underline decoration-white/20">
                  Skip to market
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </Shell>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.16em] text-white/40 uppercase">{k}</p>
      <p className="tracking-normal">{v}</p>
    </div>
  )
}
