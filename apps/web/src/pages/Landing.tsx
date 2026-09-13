import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ModelSelect } from '@/components/ui/select'
import { Shell } from '@/components/Shell'
import { startLandingScrub } from '@/landing/scrub.ts'
import { MODELS } from '@/swarm/runtime.ts'

export function Landing() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    return startLandingScrub(root)
  }, [])

  return (
    <Shell overlay>
      <div ref={rootRef}>
        <div className="boot" id="boot">
          <div className="bar">
            <i id="bootBar" />
          </div>
          <p id="bootPct">LOADING 0%</p>
        </div>

        <div className="stage">
          <video id="clip" muted playsInline preload="auto" disablePictureInPicture />
          <div className="veil" />
          <div className="grain" />
        </div>

        <i className="meter" id="meter" />

        <main className="panels">
          <PostPanel />
          <JoinPanel />
          <DrainPanel />
        </main>

        <footer className="foot">
          Trusted Swarm — post a task, share a room, plug anything that speaks OpenAI.
        </footer>
        <div className="track" />
      </div>
    </Shell>
  )
}

function PostPanel() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('qwen3-0.6b')
  const modelItems = useMemo(
    () => Object.fromEntries(Object.entries(MODELS).map(([id, m]) => [id, m.label])),
    [],
  )

  function go(e: FormEvent) {
    e.preventDefault()
    const q = new URLSearchParams()
    q.set('role', 'host')
    if (prompt.trim()) q.set('prompt', prompt.trim())
    if (model) q.set('model', model)
    navigate(`/market?${q}`)
  }

  return (
    <section className="panel" data-panel id="board">
      <p className="eyebrow">
        Browser GPU <span>&middot;</span> devices you already own
      </p>
      <h1>
        Post a task.
        <br />
        Run it here.
      </h1>
      <p className="sub">
        Queue an OpenAI-shaped chat completion, invite laptops and phones into a room, then drain
        one job at a time.
      </p>
      <form className="board" onSubmit={go}>
        <label htmlFor="landing-prompt">New task</label>
        <textarea
          id="landing-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Summarize this paper…  /  Write a kernel sketch…"
        />
        <div className="board-row">
          <ModelSelect value={model} onValueChange={setModel} items={modelItems} />
          <button type="submit" className="pill pill-lg">
            Post a task
          </button>
        </div>
      </form>
    </section>
  )
}

function JoinPanel() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  function offer(e: FormEvent) {
    e.preventDefault()
    const next = code.trim().toUpperCase()
    if (!next) {
      toast.error('Need a room code')
      return
    }
    navigate(`/onboard?intent=worker&code=${encodeURIComponent(next)}`)
  }

  return (
    <section className="panel" data-panel id="how">
      <p className="eyebrow">
        Same queue <span>&middot;</span> join this room
      </p>
      <h1>
        Form a room.
        <br />
        Join with the code.
      </h1>
      <p className="sub">
        Offer a laptop or phone you already own. You join this host’s queue — you never mint a
        second room.
      </p>
      <form className="board" onSubmit={offer}>
        <label htmlFor="landing-code">Room code</label>
        <input
          id="landing-code"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CA7Z"
        />
        <div className="board-row">
          <button type="submit" className="pill pill-lg">
            Offer this device
          </button>
        </div>
      </form>
    </section>
  )
}

function DrainPanel() {
  return (
    <section className="panel" data-panel id="api">
      <p className="eyebrow">
        Localhost <span>&middot;</span> POST /v1
      </p>
      <h1>
        Drain one job.
        <br />
        Same contract as curl.
      </h1>
      <p className="sub">
        While the host tab is open, a localhost bridge exposes OpenAI /v1/chat/completions. Same
        queue the marketplace uses.
      </p>
      <div className="cta">
        <Link to="/market" className="pill pill-lg">
          Open the market
        </Link>
        <pre className="snippet">{`node runtime/serve.mjs

curl http://127.0.0.1:11435/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model":"qwen3-0.6b","messages":[{"role":"user","content":"hello"}]}'`}</pre>
      </div>
    </section>
  )
}
