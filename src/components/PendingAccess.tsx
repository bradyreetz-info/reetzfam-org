import { Clock3, LogOut, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function PendingAccess() {
  const { profile, signOut } = useAuth()
  const denied = profile?.status === 'denied'
  const suspended = profile?.status === 'suspended'
  const Icon = denied || suspended ? ShieldAlert : Clock3
  const title = denied
    ? 'Your access request was not approved.'
    : suspended
      ? 'This account is not currently active.'
      : 'Your access request is still pending.'
  const copy = denied
    ? 'A family administrator reviewed this request and did not approve member access. If you believe this was a mistake, contact the family administrator directly.'
    : suspended
      ? 'This account has been paused by a family administrator. Private family information will stay hidden until access is restored.'
      : `Thanks for your patience${profile?.first_name ? `, ${profile.first_name}` : ''}. A family administrator will review your request before any private information becomes available.`

  return (
    <main className="status-page">
      <div className="status-card">
        <span className="icon-orb icon-orb--gold"><Icon aria-hidden="true" /></span>
        <p className="eyebrow">{denied ? 'Access not approved' : suspended ? 'Account inactive' : 'Access requested'}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
        <div className="button-row">
          <Link to="/" className="button button--secondary">Return home</Link>
          <button className="button button--ghost" onClick={() => void signOut()}><LogOut size={18} /> Sign out</button>
        </div>
      </div>
    </main>
  )
}
