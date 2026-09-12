import { useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'

const links = [
  { label: 'About', to: '/#quote' },
  { label: 'Onboard', to: '/onboard' },
  { label: 'Room', to: '/room' },
  { label: 'Contact', to: '/#contact' },
]

export function Shell({ children, overlay = false }: { children: ReactNode; overlay?: boolean }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-svh bg-[#0a0608] text-white">
      <header
        className={cn(
          'fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-6 py-5 md:px-12',
          overlay ? 'bg-transparent' : 'bg-[#0a0608]/80 backdrop-blur-md',
        )}
      >
        <Link to="/" className="font-script text-2xl text-white md:text-3xl">
          Trusted Swarm
        </Link>

        <nav className="hidden items-center gap-12 md:flex">
          {links.map((l) =>
            l.to.startsWith('/#') ? (
              <a
                key={l.label}
                href={l.to}
                className="text-sm tracking-wide text-white/80 hover:text-white"
              >
                {l.label}
              </a>
            ) : (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'text-sm tracking-wide text-white/80 hover:text-white',
                    isActive && pathname === l.to && 'text-white',
                  )
                }
              >
                {l.label}
              </NavLink>
            ),
          )}
        </nav>

        <Link to="/onboard?intent=host" className={cn(buttonVariants(), 'hidden md:inline-flex')}>
          Create Swarm
        </Link>

        <button
          type="button"
          className="relative h-10 w-10 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className="absolute top-[11px] left-2 block h-px w-6 bg-white"
            style={{
              transition: `transform 400ms ${ease}, opacity 400ms ${ease}`,
              transform: open ? 'translateY(9px) rotate(45deg)' : 'none',
            }}
          />
          <span
            className="absolute top-[19px] left-2 block h-px w-6 bg-white"
            style={{
              transition: `transform 400ms ${ease}, opacity 400ms ${ease}`,
              opacity: open ? 0 : 1,
              transform: open ? 'scaleX(0)' : 'none',
            }}
          />
          <span
            className="absolute top-[27px] left-2 block h-px w-6 bg-white"
            style={{
              transition: `transform 400ms ${ease}, opacity 400ms ${ease}`,
              transform: open ? 'translateY(-9px) rotate(-45deg)' : 'none',
            }}
          />
        </button>
      </header>

      <div
        className={cn(
          'fixed inset-y-0 right-0 z-40 w-[85%] max-w-[340px] border-l border-white/10 bg-[#0a0608]/95 backdrop-blur-xl md:hidden',
          'flex flex-col px-8 pt-24 pb-10',
        )}
        style={{
          transition: `transform 500ms ${ease}`,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {links.map((l, i) => {
          const className = 'py-3 text-lg text-white/80'
          const style = {
            transition: `opacity 500ms ${ease}, transform 500ms ${ease}`,
            transitionDelay: open ? `${150 + i * 75}ms` : '0ms',
            opacity: open ? 1 : 0,
            transform: open ? 'translateX(0)' : 'translateX(16px)',
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
          to="/onboard?intent=host"
          onClick={() => setOpen(false)}
          className={cn(buttonVariants(), 'mt-auto')}
          style={{
            transition: `opacity 500ms ${ease}`,
            transitionDelay: open ? '450ms' : '0ms',
            opacity: open ? 1 : 1,
          }}
        >
          Create Swarm
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

      <div className={overlay ? '' : 'pt-24'}>{children}</div>
    </div>
  )
}
