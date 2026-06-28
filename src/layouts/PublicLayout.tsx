import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { useAuth } from '../lib/auth'

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isSignedIn = Boolean(profile)
  const closeMenu = () => setOpen(false)
  const exit = async () => {
    await signOut()
    setOpen(false)
    navigate('/')
  }

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
            <NavLink to="/privacy" onClick={closeMenu}>Privacy</NavLink>
            {isSignedIn ? (
              <>
                <NavLink to="/app" onClick={closeMenu}>{profile?.status === 'approved' ? 'Dashboard' : 'Access status'}</NavLink>
                {isAdmin && <NavLink to="/admin" onClick={closeMenu}>Admin</NavLink>}
                <button type="button" className="link-button public-nav-button" onClick={() => void exit()}>Sign out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={closeMenu}>Member login</NavLink>
                <Link to="/request-access" className="button button--small" onClick={closeMenu}>Request access</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main id="main-content"><Outlet /></main>
      <footer className="public-footer">
        <div className="container footer-inner">
          <Brand compact />
          <div className="footer-links">
            <Link to="/privacy">Privacy</Link>
            <Link to={isSignedIn ? '/app' : '/login'}>{isSignedIn ? 'Dashboard' : 'Member login'}</Link>
          </div>
          <p>© {new Date().getFullYear()} ReetzFam.org</p>
        </div>
      </footer>
    </div>
  )
}
