import { FormEvent, useState } from 'react'
import { ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

export function LoginPage() {
  const [method, setMethod] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const { signIn, sendMagicLink, demoMode } = useAuth()
  const navigate = useNavigate()

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      if (method === 'magic') { await sendMagicLink(email); setSent(true) }
      else { await signIn(email, password); navigate('/app') }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'We could not sign you in. Please try again.') }
    finally { setBusy(false) }
  }

  return (
    <section className="auth-section">
      <div className="auth-aside"><div><span className="icon-orb icon-orb--light"><ShieldCheck /></span><p className="eyebrow">Private member space</p><h1>Welcome back to the family.</h1><p>Sign in to see updates, birthdays, events, photos, and the family directory.</p></div><p className="aside-note"><KeyRound size={18} /> Your access is personal. Please don’t share your sign-in details.</p></div>
      <div className="auth-panel">
        <div className="form-card form-card--login">
          <p className="eyebrow">Member login</p><h2>Sign in to ReetzFam.org</h2><p>Use the email address connected to your approved account.</p>
          {demoMode && <div className="demo-banner"><strong>Local preview mode</strong><span>Use any email and password. Include “admin” or “pending” in the email to preview those roles.</span></div>}
          <div className="segmented" role="tablist" aria-label="Sign-in method">
            <button role="tab" aria-selected={method === 'password'} className={method === 'password' ? 'active' : ''} onClick={() => { setMethod('password'); setSent(false) }}>Password</button>
            <button role="tab" aria-selected={method === 'magic'} className={method === 'magic' ? 'active' : ''} onClick={() => { setMethod('magic'); setSent(false) }}>Email link</button>
          </div>
          {sent ? <div className="success-panel" role="status"><CheckCircle2 /><h3>Check your email</h3><p>We sent a secure sign-in link to <strong>{email}</strong>.</p></div> : (
            <form onSubmit={submit} className="stack-form">
              <label>Email address<span className="input-wrap"><Mail aria-hidden="true" /><input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></span></label>
              {method === 'password' && <label>Password<span className="input-wrap"><KeyRound aria-hidden="true" /><input required minLength={8} type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" /></span></label>}
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="button button--full" disabled={busy}>{busy ? 'Signing in…' : method === 'magic' ? 'Email me a sign-in link' : 'Sign in'} <ArrowRight size={18} /></button>
            </form>
          )}
          <div className="form-meta"><button className="link-button" type="button">Forgot your password?</button><p>Not a member yet? <Link to="/request-access">Request access</Link></p></div>
        </div>
      </div>
    </section>
  )
}
