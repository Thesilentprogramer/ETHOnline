import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Shell } from '@/components/Shell'

const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4'
const RAINBOW =
  'https://soft-zoom-63098134.figma.site/_assets/v11/8d520a7515d06cbfc403d0125e3d05b1a7ccd29c.png'
const CLOUD =
  'https://soft-zoom-63098134.figma.site/_assets/v11/0d6dfd3f90b930f21726f2ed56a3320d79b7a797.png'

function lerp(current: number, target: number, factor: number) {
  return current + (target - current) * factor
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

export function Landing() {
  return (
    <Shell overlay>
      <Hero />
      <QuoteSection />
      <footer id="contact" className="bg-[#0a0608] px-6 py-16 text-center text-sm text-white/50">
        Trusted Swarm — Phase 1. Payments, ENS, and Ledger land later.
      </footer>
    </Shell>
  )
}

function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [videoOk, setVideoOk] = useState(true)

  function toggleSound() {
    const el = videoRef.current
    if (!el) return
    el.muted = !el.muted
    setMuted(el.muted)
  }

  return (
    <section className="relative h-screen overflow-hidden">
      {videoOk ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoOk(false)}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #010A17 0%, #0A4267 30%, #20658E 60%, #6BADC4 100%)',
          }}
        />
      )}
      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute inset-0 flex flex-col items-center justify-center -mt-[120px] px-6">
        <h1 className="font-instrument text-glow text-center text-[36px] leading-[0.9] tracking-tight text-white md:text-7xl lg:text-[110px]">
          Many devices. One model.
        </h1>
        <p className="mt-5 max-w-xl text-center text-sm text-white/70 md:mt-7 md:text-base">
          Trusted Swarm is a web-based peer-to-peer AI compute network. Devices discover their
          capabilities, receive model work, and — in later phases — earn payment for verified
          inference.
        </p>
        <Link to="/onboard?intent=host" className={cn(buttonVariants(), 'mt-6 md:mt-9')}>
          Begin your swarm
        </Link>
      </div>

      <button
        type="button"
        onClick={toggleSound}
        className="absolute bottom-8 left-8 hidden items-center gap-3 md:flex"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20">
          <span className="block h-px w-4 bg-white/70" />
        </span>
        <span className="text-left text-xs text-white/60">
          Experience
          <br />
          {muted ? 'with sound' : 'sound on'}
        </span>
      </button>
    </section>
  )
}

function QuoteSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const rainbowRef = useRef<HTMLImageElement>(null)
  const leftRef = useRef<HTMLImageElement>(null)
  const rightRef = useRef<HTMLImageElement>(null)
  const state = useRef({
    rainbow: 120,
    leftX: -200,
    rightX: 200,
    cloudY: 0,
    leftOp: 0,
    rightOp: 0,
  })

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const el = sectionRef.current
      if (el) {
        const rect = el.getBoundingClientRect()
        const progress = clamp01((window.innerHeight - rect.top) / (window.innerHeight + rect.height))
        const inView = progress > 0.12 && progress < 0.92
        const s = state.current
        s.rainbow = lerp(s.rainbow, 120 + progress * -280, 0.06)
        s.cloudY = lerp(s.cloudY, progress * -50, 0.04)
        s.leftX = lerp(s.leftX, inView ? 0 : -200, 0.04)
        s.rightX = lerp(s.rightX, inView ? 0 : 200, 0.04)
        s.leftOp = lerp(s.leftOp, inView ? 1 : 0, 0.04)
        s.rightOp = lerp(s.rightOp, inView ? 1 : 0, 0.04)

        if (rainbowRef.current) {
          rainbowRef.current.style.transform = `translate3d(0, ${s.rainbow}px, 0)`
        }
        if (leftRef.current) {
          leftRef.current.style.transform = `translate3d(${s.leftX}px, ${s.cloudY}px, 0)`
          leftRef.current.style.opacity = String(s.leftOp)
        }
        if (rightRef.current) {
          rightRef.current.style.transform = `translate3d(${s.rightX}px, ${s.cloudY}px, 0) scaleX(-1)`
          rightRef.current.style.opacity = String(s.rightOp)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section
      id="quote"
      ref={sectionRef}
      className="relative h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #010A17 0%, #0A4267 30%, #20658E 60%, #6BADC4 100%)',
      }}
    >
      <img
        ref={rainbowRef}
        src={RAINBOW}
        alt=""
        className="pointer-events-none absolute inset-x-0 top-0 z-30 w-full will-change-transform"
        style={{ transform: 'translate3d(0, 120px, 0)' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
      <img
        ref={leftRef}
        src={CLOUD}
        alt=""
        className="pointer-events-none absolute bottom-[10%] left-0 z-10 hidden w-[500px] will-change-transform sm:block md:w-[650px]"
        style={{ marginLeft: '-50%', opacity: 0, transform: 'translate3d(-200px, 0, 0)' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
      <img
        ref={rightRef}
        src={CLOUD}
        alt=""
        className="pointer-events-none absolute right-0 bottom-[15%] z-10 hidden w-[500px] will-change-transform sm:block md:w-[650px]"
        style={{ marginRight: '-75%', opacity: 0, transform: 'translate3d(200px, 0, 0) scaleX(-1)' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />

      <div className="relative z-20 mx-auto flex h-full max-w-4xl items-center px-6 text-center">
        <div>
          <p className="font-instrument text-xl leading-[1.45] text-white sm:text-2xl md:text-4xl md:leading-[1.5] lg:text-[42px]">
            “Trusted Swarm was founded on a belief in compute that honors the machines you already
            own. We pursue measured capability, considered assignment, and verified work. We spend
            time learning what a device can run before deciding what it should receive. No rushing,
            no excess — just a swarm that lets inference feel local.”
          </p>
          <p className="mt-6 text-sm tracking-wide text-white/80 md:mt-8 md:text-base">
            Trusted Swarm — Phase 1
          </p>
        </div>
      </div>
    </section>
  )
}
