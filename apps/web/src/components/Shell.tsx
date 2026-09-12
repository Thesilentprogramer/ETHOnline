import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const appLinks = [
  { label: 'Market', to: '/market' },
  { label: 'Onboard', to: '/onboard' },
  { label: 'Room', to: '/room' },
  { label: 'API', to: '/#api' },
]

const marketingLinks = [
  { label: 'How', to: '/#quote' },
  { label: 'API', to: '/#api' },
]

export function Shell({
  children,
  overlay = false,
  tone = 'dark',
}: {
  children: ReactNode
  overlay?: boolean
  tone?: 'dark' | 'light'
}) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const light = tone === 'light'
  const links = light ? marketingLinks : appLinks

  useEffect(() => {
    document.documentElement.dataset.tone = light ? 'light' : 'dark'
    return () => {
      delete document.documentElement.dataset.tone
    }
  }, [light])

  return (
    <div className={cn('min-h-svh', light ? 'bg-[#f6f4ef] text-[#161410]' : 'bg-[#0a0608] text-white')}>
      <header
        className={cn(
          'gutter fixed top-0 right-0 left-0 z-50 flex items-center justify-between py-5',
          overlay && !light
            ? 'bg-transparent'
            : light
              ? 'border-b border-[#161410]/8 bg-[#f6f4ef]/70 backdrop-blur-[20px]'
              : 'bg-[#0a0608]/55 backdrop-blur-[20px]',
        )}
      >
        <Link to="/" className={cn('font-script text-2xl md:text-3xl', light ? 'text-[#161410]' : 'text-white')}>
          Trusted Swarm
        </Link>

        <nav className="hidden items-center gap-12 md:flex">
          {links.map((l) =>
            l.to.startsWith('/#') ? (
              <a
                key={l.label}
                href={l.to}
                className={cn(
                  'text-sm tracking-wide transition-[color] duration-150 ease-[ease]',
                  light ? 'text-[#161410]/70' : 'text-white/80',
                )}
              >
                {l.label}
              </a>
            ) : (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'text-sm tracking-wide transition-[color] duration-150 ease-[ease]',
                    light ? 'text-[#161410]/70' : 'text-white/80',
                    isActive && pathname === l.to && (light ? 'text-[#161410]' : 'text-white'),
                  )
                }
              >
                {l.label}
              </NavLink>
            ),
          )}
        </nav>

        <Link
          to="/market"
          className={cn(buttonVariants({ variant: light ? 'light' : 'default', size: 'sm' }), 'hidden md:inline-flex')}
        >
          Post a task
        </Link>

        <button
          type="button"
          className="press relative h-10 w-10 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={cn('absolute top-[11px] left-2 block h-px w-6', light ? 'bg-[#161410]' : 'bg-white')}
            style={{
              transition: 'transform 160ms var(--ease-out), opacity 160ms var(--ease-out)',
              transform: open ? 'translateY(9px) rotate(45deg)' : 'none',
            }}
          />
          <span
            className={cn('absolute top-[19px] left-2 block h-px w-6', light ? 'bg-[#161410]' : 'bg-white')}
            style={{
              transition: 'transform 160ms var(--ease-out), opacity 160ms var(--ease-out)',
              opacity: open ? 0 : 1,
              transform: open ? 'scaleX(0.96)' : 'none',
            }}
          />
          <span
            className={cn('absolute top-[27px] left-2 block h-px w-6', light ? 'bg-[#161410]' : 'bg-white')}
            style={{
              transition: 'transform 160ms var(--ease-out), opacity 160ms var(--ease-out)',
              transform: open ? 'translateY(-9px) rotate(-45deg)' : 'none',
            }}
          />
        </button>
      </header>

      <div
        data-open={open ? '' : undefined}
        className={cn(
          'drawer-panel fixed inset-y-0 right-0 z-40 flex w-[85%] max-w-[340px] flex-col pt-[var(--header-h)] pb-10 md:hidden',
          'gutter',
          light ? 'border-l border-[#161410]/10 bg-[#f6f4ef]/92 backdrop-blur-[20px]' : 'border-l border-white/10 bg-[#0a0608]/90 backdrop-blur-[20px]',
          !open && 'pointer-events-none',
        )}
        style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {links.map((l, i) => {
          const className = cn('drawer-link py-3 text-lg', light ? 'text-[#161410]/80' : 'text-white/80')
          const style = {
            transitionDelay: open ? `${40 + i * 40}ms` : '0ms',
            opacity: open ? 1 : 0,
            transform: open ? 'translateX(0)' : 'translateX(12px)',
          }
          return l.to.startsWith('/#') ? (
            <a key={l.label} href={l.to} onClick={() => setOpen(false)} className={className} style={style}>
              {l.label}
            </a>
          ) : (
            <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className={className} style={style}>
              {l.label}
            </Link>
          )
        })}
        <Link
          to="/market"
          onClick={() => setOpen(false)}
          className={cn(buttonVariants({ variant: light ? 'light' : 'default' }), 'mt-auto')}
        >
          Post a task
        </Link>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Dismiss menu"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className={overlay ? '' : 'pt-[var(--header-h)]'}>{children}</div>
    </div>
  )
}
