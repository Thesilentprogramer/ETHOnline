import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Shell } from '@/components/Shell'
import { probeDevice, SCORE_WEIGHTS, type CapabilityReport } from '@/swarm/capability.ts'
import { loadControls, roleLabel, saveCapability, saveControls } from '@/swarm/session.ts'

export function Onboard() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const intent = params.get('intent') === 'worker' ? 'worker' : 'host'
  const [report, setReport] = useState<CapabilityReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [maxMinutes, setMaxMinutes] = useState(30)
  const [memoryCapGb, setMemoryCapGb] = useState(4)
  const [workUnfocused, setWorkUnfocused] = useState(false)

  useEffect(() => {
    const saved = loadControls()
    setMaxMinutes(saved.maxMinutes)
    setMemoryCapGb(saved.memoryCapGb)
    setWorkUnfocused(saved.workUnfocused)
    probeDevice()
      .then(setReport)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'probe failed'))
      .finally(() => setBusy(false))
  }, [])

  function continueToRoom() {
    if (!report) return
    saveCapability(report)
    saveControls({ maxMinutes, memoryCapGb, workUnfocused })
    const q = new URLSearchParams({ role: intent })
    navigate(`/room?${q}`)
  }

  return (
    <Shell>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs tracking-[0.2em] text-white/50 uppercase">Capability handshake</p>
        <h1 className="font-instrument mt-2 text-4xl tracking-tight md:text-5xl">
          What this device can run
        </h1>
        <p className="mt-3 text-white/70">
          We collect only scheduling signals: WebGPU, memory headroom, WebRTC support. No MAC,
          serial, or fingerprint.
        </p>

        {busy && <p className="mt-8 text-white/50">Calibrating adapter…</p>}
        {error && <p className="mt-8 text-red-300">{error}</p>}

        {report && (
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
              <p className="mt-3 text-xs text-white/50">
                {SCORE_WEIGHTS.compute * 100}% compute · {SCORE_WEIGHTS.network * 100}% network ·{' '}
                {SCORE_WEIGHTS.memory * 100}% memory · {SCORE_WEIGHTS.stability * 100}% stability ·{' '}
                {SCORE_WEIGHTS.history * 100}% history (0 until later phases)
              </p>
            </Card>

            <Card className="grid gap-2 text-sm sm:grid-cols-2">
              <Row k="WebGPU" v={report.webgpu ? report.gpu : 'unavailable → observer'} />
              <Row k="WebRTC" v={report.webrtc ? 'supported' : 'missing'} />
              <Row k="Browser" v={report.browser} />
              <Row k="Buffer cap" v={`${report.maxBufGB} GB`} />
              <Row k="Memory headroom" v={`${report.memoryHeadroomGb} GB`} />
              <Row k="Phone" v={report.isPhone ? 'yes (light-worker max)' : 'no'} />
            </Card>

            <Card>
              <h2 className="font-instrument text-2xl">Session controls</h2>
              <label className="mt-4 block text-sm text-white/70">
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
              <label className="mt-4 block text-sm text-white/70">
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
              <label className="mt-4 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={workUnfocused}
                  onChange={(e) => setWorkUnfocused(e.target.checked)}
                />
                Allow work while this tab is unfocused
              </label>
            </Card>

            <Button size="lg" onClick={continueToRoom}>
              Continue as {intent}
            </Button>
          </div>
        )}
      </main>
    </Shell>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.16em] text-white/40 uppercase">{k}</p>
      <p>{v}</p>
    </div>
  )
}
