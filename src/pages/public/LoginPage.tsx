import { FormEvent, useState } from 'react'
import { ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

export function LoginPage() {
  const [method, setMethod] = useState<'password' | 'magic' | 'signup'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const { signIn, signUp, sendMagicLink, sendPasswordReset, demoMode } = useAuth()
  const navigate = useNavigate()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setResetSent(false)
    try {
      if (method === 'magic') {
        await sendMagicLink(email)
        setSent(true)
      } else if (method === 'signup') {
        const result = await signUp({ email, password, firstName, lastName })
        if (result.needsEmailConfirmation) setSent(true)
        else navigate('/app')
      } else {
        await signIn(email, password)
        navigate('/app')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not sign you in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async () => {
    if (!email) {
      setError('Enter your email address first, then request a password reset.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await sendPasswordReset(email)
      setResetSent(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not send a reset email.')
    } finally {
      setBusy(false)
    }
  }

  const switchMethod = (next: typeof method) => {
    setMethod(next)
    setSent(false)
    setResetSent(false)
    setError('')
  }

  return (
    <section className="auth-section">
      <div className="auth-aside">
        <div>
          <span className="icon-orb icon-orb--light"><ShieldCheck /></span>
          <p className="eyebrow">Private member space</p>
          <h1>Welcome back to the family.</h1>
          <p>Sign in to see updates, birthdays, events, photos, and the family directory.</p>
        </div>
        <p className="aside-note"><KeyRound size={18} /> Your access is personal. Please don’t share your sign-in details.</p>
      </div>

      <div className="auth-panel">
        <div className="form-card form-card--login">
          <p className="eyebrow">Member login</p>
          <h2>Sign in to ReetzFam.org</h2>
          <p>Use the email address connected to your approved account.</p>

          {demoMode && <div className="demo-banner"><strong>Local preview mode</strong><span>Use any email and password. Include “admin” or “pending” in the email to preview those roles.</span></div>}

          <div className="segmented segmented--three" role="tablist" aria-label="Sign-in method">
            <button type="button" role="tab" aria-selected={method === 'password'} className={method === 'password' ? 'active' : ''} onClick={() => switchMethod('password')}>Password</button>
            <button type="button" role="tab" aria-selected={method === 'magic'} className={method === 'magic' ? 'active' : ''} onClick={() => switchMethod('magic')}>Email link</button>
            <button type="button" role="tab" aria-selected={method === 'signup'} className={method === 'signup' ? 'active' : ''} onClick={() => switchMethod('signup')}>Create account</button>
          </div>

          {sent ? <div className="success-panel" role="status"><CheckCircle2 /><h3>Check your email</h3><p>{method === 'signup' ? 'Confirm your email address, then return here to sign in.' : 'We sent a secure sign-in link'} to <strong>{email}</strong>.</p></div> : (
            <form onSubmit={submit} className="stack-form">
              {method === 'signup' && <div className="field-grid"><label>First name<input required autoComplete="given-name" value={firstName} onChange={event => setFirstName(event.target.value)} /></label><label>Last name<input required autoComplete="family-name" value={lastName} onChange={event => setLastName(event.target.value)} /></label></div>}
              <label>Email address<span className="input-wrap"><Mail aria-hidden="true" /><input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></span></label>
              {method !== 'magic' && <label>Password<span className="input-wrap"><KeyRound aria-hidden="true" /><input required minLength={8} type="password" autoComplete={method === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={method === 'signup' ? 'Create a password' : 'Your password'} /></span></label>}
              {method === 'signup' && <p className="form-hint"><UserPlus size={15} /> Create an account after your request is approved. If approval is still pending, the private portal stays locked.</p>}
              {error && <p className="form-error" role="alert">{error}</p>}
              {resetSent && <p className="inline-success" role="status"><CheckCircle2 />Password reset email sent.</p>}
              <button className="button button--full" disabled={busy}>{busy ? 'Working…' : method === 'signup' ? 'Create account' : method === 'magic' ? 'Email me a sign-in link' : 'Sign in'} <ArrowRight size={18} /></button>
            </form>
          )}

          <div className="form-meta">
            <button className="link-button" type="button" disabled={busy} onClick={() => void resetPassword()}>Forgot your password?</button>
            <p>Not approved yet? <Link to="/request-access">Request access</Link></p>
          </div>
        </div>
      </div>
    </section>
  )
}
