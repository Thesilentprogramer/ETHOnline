import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Shell } from '@/components/Shell'

export function Landing() {
  return (
    <Shell overlay tone="light">
      <Hero />
      <ProductProof />
      <How />
      <ApiBlock />
      <footer id="contact" className="gutter border-t border-[#161410]/8 py-16 text-center text-sm text-[#161410]/45">
        Trusted Swarm — post a task, share a room, plug anything that speaks OpenAI.
      </footer>
    </Shell>
  )
}

function Hero() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')

  function go(e: FormEvent) {
    e.preventDefault()
    const q = new URLSearchParams()
    if (prompt.trim()) q.set('prompt', prompt.trim())
    navigate(`/market?${q}`)
  }

  return (
    <section className="gutter relative mx-auto flex max-w-5xl flex-col items-center pt-[calc(var(--header-h)+0.75rem)] pb-8 text-center">
      <h1 className="font-instrument landing-display max-w-4xl text-[clamp(2.75rem,8vw,5.5rem)]">
        Post a task.
        <span className="mt-1 block italic">Devices you already own run it.</span>
      </h1>
      <p className="mt-5 max-w-[38rem] text-base leading-relaxed text-[#161410]/65 md:text-lg">
        Queue an OpenAI-shaped chat completion, invite laptops and phones into a room, then drain
        one job at a time.
      </p>

      <form
        onSubmit={go}
        className="mt-8 w-full max-w-2xl rounded-[28px] border border-[#161410]/8 bg-white p-5 text-left shadow-[0_24px_60px_rgba(22,20,16,0.1)] md:p-6"
      >
        <label htmlFor="landing-prompt" className="text-xs tracking-[0.16em] text-[#161410]/40 uppercase">
          New task
        </label>
        <Textarea
          id="landing-prompt"
          tone="light"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Summarize this paper…  /  Write a kernel sketch…"
          className="mt-3 h-24 border-0 bg-transparent px-0 text-lg focus:border-transparent"
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" className={cn(buttonVariants({ variant: 'light' }))}>
            Post a task
          </button>
          <Link to="/onboard?intent=worker" className={cn(buttonVariants({ variant: 'lightOutline' }))}>
            Offer this device
          </Link>
        </div>
      </form>
    </section>
  )
}

function ProductProof() {
  return (
    <section className="gutter pb-6 md:pb-8">
      <Reveal>
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-[#eceae4] p-3 md:p-5">
          <MarketStill />
        </div>
        <p className="mx-auto mt-4 max-w-6xl text-center text-xs tracking-normal text-[#161410]/40">
          Synthetic still of the marketplace — not a live run.
        </p>
      </Reveal>
    </section>
  )
}

function MarketStill() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none grid gap-6 rounded-[1.5rem] bg-[#0a0608] p-5 text-left text-white md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] md:p-8"
    >
      <div>
        <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Marketplace</p>
        <p className="font-instrument mt-2 text-3xl md:text-4xl">Queue a completion</p>
        <p className="mt-2 text-sm tracking-normal text-white/55">
          Room <span className="text-white underline decoration-white/20">CA7Z</span> · 1 waiting.
          1 host · 8 GB
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/45">What should the swarm do?</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/70">
              Qwen3 0.6B
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] text-black">Post task</span>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] tracking-wide text-white/60 uppercase">
              waiting
            </span>
            <span className="text-xs text-white/45">qwen3-0.6b</span>
          </div>
          <p className="mt-2 text-sm tracking-normal text-white/90">Summarize this paper…</p>
        </div>
      </div>
      <div>
        <p className="mb-3 text-[10px] tracking-[0.16em] text-white/40 uppercase">Cluster</p>
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 p-4">
            <p className="text-xs text-white/45">host</p>
            <p className="mt-1 text-sm">this machine · 8 GB</p>
          </div>
          <div className="rounded-2xl border border-dashed border-white/15 p-4">
            <p className="text-xs text-white/45">open slot</p>
            <p className="mt-1 text-sm text-white/70">Offer a laptop or phone</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function How() {
  const steps = [
    { n: '01', t: 'Post', d: 'A task is a chat completion: model + messages. It waits if the swarm is not online yet.' },
    { n: '02', t: 'Form a room', d: 'Share the code. Other devices offer GPU. Solo is enough when this machine fits the model.' },
    { n: '03', t: 'Drain', d: 'The host runs one job at a time. The same contract is what curl and LangChain hit locally.' },
  ]
  return (
    <section id="quote" className="gutter scroll-mt-[var(--header-h)] py-28 md:py-36">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-3 md:gap-20">
        {steps.map((s) => (
          <div key={s.n}>
            <p className="font-instrument landing-display text-5xl text-[#161410]/25 md:text-6xl">{s.n}</p>
            <h2 className="mt-6 font-instrument text-3xl md:text-4xl">{s.t}</h2>
            <p className="mt-4 text-sm leading-relaxed tracking-normal text-[#161410]/60">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ApiBlock() {
  return (
    <section id="api" className="gutter scroll-mt-[var(--header-h)] border-t border-[#161410]/8 py-28 md:py-36">
      <div className="mx-auto grid max-w-6xl items-end gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-instrument text-4xl md:text-5xl">One plug. Any project.</h2>
          <p className="mt-5 max-w-md tracking-normal text-[#161410]/65">
            While the host tab is open, a localhost bridge exposes OpenAI{' '}
            <code className="text-sm">/v1/chat/completions</code>. Same queue the marketplace uses.
          </p>
          <Link to="/market" className={cn(buttonVariants({ variant: 'light' }), 'mt-8 inline-flex')}>
            Open the market
          </Link>
        </div>
        <pre className="overflow-x-auto rounded-2xl bg-[#161410] p-6 text-[13px] leading-relaxed tracking-normal text-[#f6f4ef]/90">
          {`node runtime/serve.mjs

curl http://127.0.0.1:11435/v1/chat/completions \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"qwen3-0.6b","messages":[{"role":"user","content":"hello"}]}'`}
        </pre>
      </div>
    </section>
  )
}

function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.visible = ''
          io.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className="reveal">
      {children}
    </div>
  )
}
