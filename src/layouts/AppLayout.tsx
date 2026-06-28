import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, BookOpen, CalendarDays, ChevronDown, FileText, Images, LayoutDashboard, ListChecks, LogOut, Menu, Megaphone, Settings, ShieldCheck, Users, X } from 'lucide-react'
import { Brand } from '../components/Brand'
import { useAuth } from '../lib/auth'

const navItems = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/directory', label: 'Family directory', icon: Users },
  { to: '/app/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/app/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/app/onboarding', label: 'Finish profile', icon: ListChecks },
  { to: '/app/photos', label: 'Photos', icon: Images },
  { to: '/app/documents', label: 'Documents', icon: FileText },
  { to: '/app/family-tree-placeholder', label: 'Family history', icon: BookOpen },
]

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const exit = async () => { await signOut(); navigate('/') }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#app-content">Skip to content</a>
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-top"><Brand /><button className="sidebar-close" aria-label="Close navigation" onClick={() => setOpen(false)}><X /></button></div>
        <nav className="sidebar-nav" aria-label="Member navigation">
          <p className="nav-label">Family portal</p>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}><Icon aria-hidden="true" />{label}</NavLink>
          ))}
          {isAdmin && <><p className="nav-label nav-label--admin">Administration</p><NavLink to="/admin" onClick={() => setOpen(false)}><ShieldCheck />Admin dashboard</NavLink><NavLink to="/admin/settings" onClick={() => setOpen(false)}><Settings />Settings</NavLink></>}
        </nav>
        <div className="sidebar-footer"><ShieldCheck size={17} /><span>Private member space</span></div>
      </aside>
      {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <div className="app-main">
        <header className="app-header">
          <button className="app-menu" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu /></button>
          <p className="mobile-brand">ReetzFam.org</p>
          <div className="app-header-actions">
            <button className="icon-button" aria-label="Notifications"><Bell /></button>
            <NavLink to="/app/profile" className="profile-chip"><span className="avatar avatar--small">{profile?.first_name?.[0]}{profile?.last_name?.[0]}</span><span><strong>{profile?.display_name}</strong><small>{profile?.role?.replace('_', ' ')}</small></span><ChevronDown size={16} /></NavLink>
            <button className="icon-button desktop-only" aria-label="Sign out" onClick={() => void exit()}><LogOut /></button>
          </div>
        </header>
        <main id="app-content" className="app-content"><Outlet /></main>
      </div>
    </div>
  )
}
