// 1920×1080, 10.04s, 241 frames, all-intra — every frame is a keyframe, which is why a
// scroll scrub can land on an exact frame instantly.

export const VIDEO_URL =
  'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/45567745-d826-44a2-a5ce-7ef670944e60.mp4'

// Gaps between one panel's fadeOutEnd and the next's fadeInStart are deliberate dead zones —
// video only — so two panels are never readable at once.
export const CUES: [number, number, number, number][] = [
  [0.0, 0.0, 0.15, 0.23],
  [0.35, 0.43, 0.57, 0.65],
  [0.77, 0.85, 1.1, 1.2],
]
export const DRIFT = 22

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}

export function smooth(t: number) {
  return t * t * (3 - 2 * t)
}

export function ramp(p: number, a: number, b: number) {
  if (b <= a) return p >= b ? 1 : 0
  return smooth(clamp((p - a) / (b - a), 0, 1))
}

type ScrubEls = {
  clip: HTMLVideoElement
  boot: HTMLElement
  bootBar: HTMLElement
  bootPct: HTMLElement
  meter: HTMLElement
  panels: HTMLElement[]
}

export function startLandingScrub(root: ParentNode): () => void {
  const clip = root.querySelector<HTMLVideoElement>('#clip')
  const boot = root.querySelector<HTMLElement>('#boot')
  const bootBar = root.querySelector<HTMLElement>('#bootBar')
  const bootPct = root.querySelector<HTMLElement>('#bootPct')
  const meter = root.querySelector<HTMLElement>('#meter')
  const panels = [...root.querySelectorAll<HTMLElement>('[data-panel]')]
  if (!clip || !boot || !bootBar || !bootPct || !meter || panels.length === 0) return () => {}
  return runScrub({ clip, boot, bootBar, bootPct, meter, panels })
}

function runScrub({ clip, boot, bootBar, bootPct, meter, panels }: ScrubEls): () => void {
  let progress = 0
  let seekTo = 0
  let seekAt = 0
  let duration = 0
  let ready = false
  let started = false
  let attached = false
  let raf = 0
  let blobUrl = ''
  let cancelled = false
  let abort: AbortController | null = null
  let bailTimer = 0
  let stallTimer = 0

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) document.documentElement.dataset.reducedScrub = ''

  function setProgress(f: number) {
    bootBar.style.transform = `scaleX(${f})`
    bootPct.textContent = `LOADING ${Math.round(f * 100)}%`
  }

  function readScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight
    progress = max > 0 ? clamp(window.pageYOffset / max, 0, 1) : 0
    if (duration) seekTo = progress * duration
  }

  function paint() {
    meter.style.transform = `scaleX(${progress})`
    for (let i = 0; i < panels.length; i++) {
      const c = CUES[i] || CUES[CUES.length - 1]
      const enter = ramp(progress, c[0], c[1])
      const leave = ramp(progress, c[2], c[3])
      const o = enter * (1 - leave)
      const y = (1 - enter) * DRIFT - leave * DRIFT
      const el = panels[i]
      el.style.opacity = String(o)
      el.style.transform = `translate3d(0,${y}px,0)`
      el.style.pointerEvents = o > 0.6 ? 'auto' : 'none'
    }
  }

  function showPanelOne() {
    for (let i = 0; i < panels.length; i++) {
      const el = panels[i]
      el.style.opacity = i === 0 ? '1' : '0'
      el.style.transform = 'none'
      el.style.pointerEvents = i === 0 ? 'auto' : 'none'
    }
    meter.style.transform = 'scaleX(0)'
  }

  function start() {
    if (started || cancelled) return
    started = true
    ready = true
    boot.classList.add('done')
    readScroll()
    seekAt = seekTo
  }

  function attach(src: string) {
    if (attached || cancelled) return
    attached = true
    clip.addEventListener('loadedmetadata', onMeta)
    clip.addEventListener('loadeddata', start)
    clip.addEventListener('canplaythrough', start)
    clip.addEventListener('error', start)
    clip.src = src
    clip.load()
    stallTimer = window.setTimeout(start, 12000)
  }

  function onMeta() {
    duration = clip.duration || 0
    clip.pause()
    readScroll()
    seekAt = seekTo
    try {
      clip.currentTime = seekAt
    } catch {
      /* iOS may throw before a play() unlock */
    }
  }

  function frame() {
    if (cancelled) return
    if (!reduced && ready && duration) {
      const gap = seekTo - seekAt
      if (Math.abs(gap) > 0.0008) {
        seekAt += gap * 0.115
        if (clip.readyState >= 2 && !clip.seeking) {
          try {
            clip.currentTime = seekAt
          } catch {
            /* ignore seek races */
          }
        }
      }
    }
    if (!reduced) paint()
    raf = requestAnimationFrame(frame)
  }

  function unlock() {
    const p = clip.play()
    if (p && p.then)
      p.then(() => {
        clip.pause()
      }).catch(() => {})
    else clip.pause()
  }

  async function preload() {
    // Fetch the mp4 as a fully buffered blob first: seeking inside a buffered blob is near
    // instant, while range requests over the network are a slideshow.
    abort = typeof AbortController !== 'undefined' ? new AbortController() : null
    bailTimer = window.setTimeout(() => {
      if (attached || cancelled) return
      abort?.abort()
      setProgress(1)
      attach(VIDEO_URL)
    }, 15000)

    try {
      const res = await fetch(VIDEO_URL, { signal: abort?.signal })
      if (!res.ok || !res.body) throw new Error('video fetch failed')
      const total = Number(res.headers.get('content-length')) || 0
      const reader = res.body.getReader()
      const chunks: BlobPart[] = []
      let got = 0
      for (;;) {
        const r = await reader.read()
        if (r.done) break
        chunks.push(r.value)
        got += r.value.byteLength
        setProgress(total ? got / total : Math.min(got / 11e6, 0.95))
      }
      if (cancelled) return
      window.clearTimeout(bailTimer)
      setProgress(1)
      const blob = new Blob(chunks, { type: 'video/mp4' })
      blobUrl = URL.createObjectURL(blob)
      attach(blobUrl)
    } catch {
      if (cancelled) return
      window.clearTimeout(bailTimer)
      setProgress(1)
      attach(VIDEO_URL)
    }
  }

  const unlockEvents = ['touchstart', 'pointerdown', 'wheel', 'keydown'] as const
  for (const ev of unlockEvents) {
    window.addEventListener(ev, unlock, { once: true, passive: true })
  }
  const HASH: Record<string, number> = { board: 0, how: 0.49, api: 0.9 }
  function seekHash() {
    if (reduced) return
    const p = HASH[location.hash.replace('#', '')]
    if (p == null) return
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, p * Math.max(max, 0))
    readScroll()
  }

  window.addEventListener('scroll', readScroll, { passive: true })
  window.addEventListener('resize', readScroll)
  window.addEventListener('hashchange', seekHash)

  if (reduced) {
    showPanelOne()
    start()
    attach(VIDEO_URL)
  } else {
    readScroll()
    paint()
    preload()
    seekHash()
  }
  raf = requestAnimationFrame(frame)

  return () => {
    cancelled = true
    cancelAnimationFrame(raf)
    window.clearTimeout(bailTimer)
    window.clearTimeout(stallTimer)
    abort?.abort()
    window.removeEventListener('scroll', readScroll)
    window.removeEventListener('resize', readScroll)
    window.removeEventListener('hashchange', seekHash)
    for (const ev of unlockEvents) window.removeEventListener(ev, unlock)
    clip.removeEventListener('loadedmetadata', onMeta)
    clip.removeEventListener('loadeddata', start)
    clip.removeEventListener('canplaythrough', start)
    clip.removeEventListener('error', start)
    clip.removeAttribute('src')
    clip.load()
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    delete document.documentElement.dataset.reducedScrub
  }
}
