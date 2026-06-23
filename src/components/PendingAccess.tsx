import { Clock3, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function PendingAccess() {
  const { profile, signOut } = useAuth()
  return (
    <main className="status-page">
      <div className="status-card">
        <span className="icon-orb icon-orb--gold"><Clock3 aria-hidden="true" /></span>
        <p className="eyebrow">Access requested</p>
        <h1>Your access request is still pending.</h1>
        <p>Thanks for your patience{profile?.first_name ? `, ${profile.first_name}` : ''}. A family administrator will review your request before any private information becomes available.</p>
        <div className="button-row">
          <Link to="/" className="button button--secondary">Return home</Link>
          <button className="button button--ghost" onClick={() => void signOut()}><LogOut size={18} /> Sign out</button>
        </div>
      </div>
    </main>
  )
}
