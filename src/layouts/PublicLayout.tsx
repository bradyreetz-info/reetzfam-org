import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Brand } from '../components/Brand'

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="public-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="public-header">
        <div className="container header-inner">
          <Brand />
          <button className="menu-button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
          <nav className={`public-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
            <NavLink to="/privacy" onClick={() => setOpen(false)}>Privacy</NavLink>
            <NavLink to="/login" onClick={() => setOpen(false)}>Member login</NavLink>
            <Link to="/request-access" className="button button--small" onClick={() => setOpen(false)}>Request access</Link>
          </nav>
        </div>
      </header>
      <main id="main-content"><Outlet /></main>
      <footer className="public-footer">
        <div className="container footer-inner">
          <Brand compact />
          <div className="footer-links"><Link to="/privacy">Privacy</Link><Link to="/login">Member login</Link></div>
          <p>© {new Date().getFullYear()} ReetzFam.org</p>
        </div>
      </footer>
    </div>
  )
}
