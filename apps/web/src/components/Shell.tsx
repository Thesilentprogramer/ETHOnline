import { type MouseEvent, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

export function Shell({ children, overlay = false }: { children: ReactNode; overlay?: boolean }) {
  const { pathname, search } = useLocation()
  const onLanding = pathname === '/'
  const code = new URLSearchParams(search).get('code')
  const offerTo = code
    ? `/onboard?intent=worker&code=${encodeURIComponent(code.toUpperCase())}`
    : '/onboard?intent=worker'

  function toBoard(e: MouseEvent<HTMLAnchorElement>) {
    if (!onLanding) return
    e.preventDefault()
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="app-shell">
      <header className={overlay ? 'chrome' : 'chrome chrome-app'}>
        <Link to="/" className="mark">
          <span className="mark-star" aria-hidden="true">
            &#10037;
          </span>
          Trusted Swarm
        </Link>
        <nav className="nav">
          <a href="/#how">How</a>
          <NavLink to="/market">Market</NavLink>
          <NavLink to={offerTo}>Offer</NavLink>
          {onLanding ? (
            <a className="pill" href="#board" onClick={toBoard}>
              Post a task
            </a>
          ) : (
            <Link className="pill" to="/market">
              Post a task
            </Link>
          )}
        </nav>
      </header>
      <div className={overlay ? '' : 'pt-[var(--header-h)]'}>{children}</div>
    </div>
  )
}
