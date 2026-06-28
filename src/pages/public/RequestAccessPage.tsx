import { FormEvent, useState } from 'react'
import { CheckCircle2, Clock3, LockKeyhole, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { isDemoMode } from '../../lib/supabase'

interface AccessForm {
  first_name: string
  last_name: string
  email: string
  phone: string
  relationship: string
  verifier: string
  message: string
}

const initial: AccessForm = { first_name: '', last_name: '', email: '', phone: '', relationship: '', verifier: '', message: '' }

export function RequestAccessPage() {
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const change = (field: keyof AccessForm, value: string) => setForm(current => ({ ...current, [field]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (isDemoMode) await new Promise(resolve => setTimeout(resolve, 650))
      else {
        const response = await fetch('/api/access-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (!response.ok) throw new Error((await response.json() as { error?: string }).error ?? 'Your request could not be submitted.')
      }
      setSubmitted(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your request could not be submitted.')
    } finally {
      setBusy(false)
    }
  }

  if (submitted) return <section className="narrow-section"><div className="status-card"><span className="icon-orb"><CheckCircle2 /></span><p className="eyebrow">Request received</p><h1>Thanks — your request was submitted and will be reviewed.</h1><p>We’ll send a note to <strong>{form.email}</strong> after a family administrator has reviewed your request. Access is never granted automatically.</p>{isDemoMode && <p className="demo-note">Preview mode: no record or email was created.</p>}<Link className="button" to="/">Return home</Link></div></section>

  return (
    <section className="request-section">
      <div className="container request-grid">
        <div className="request-intro"><p className="eyebrow">Join the family portal</p><h1>Request access</h1><p>Tell us a little about who you are and how you’re connected. A family administrator will personally review your request.</p><ul className="process-list"><li><span><Send /></span><div><strong>Send your request</strong><p>Share enough context for us to recognize you.</p></div></li><li><span><Clock3 /></span><div><strong>A family admin reviews it</strong><p>We may check with the person you name.</p></div></li><li><span><LockKeyhole /></span><div><strong>Access stays private</strong><p>Approval is manual; nothing is opened automatically.</p></div></li></ul></div>
        <div className="form-card">
          <form onSubmit={submit} className="stack-form">
            <div className="field-grid"><label>First name<input required autoComplete="given-name" value={form.first_name} onChange={event => change('first_name', event.target.value)} /></label><label>Last name<input required autoComplete="family-name" value={form.last_name} onChange={event => change('last_name', event.target.value)} /></label></div>
            <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={event => change('email', event.target.value)} /></label>
            <label>Phone <span className="optional">Optional</span><input type="tel" autoComplete="tel" value={form.phone} onChange={event => change('phone', event.target.value)} /></label>
            <label>Relationship to the Reetz family<textarea required rows={3} value={form.relationship} onChange={event => change('relationship', event.target.value)} placeholder="For example: grandchild of…" /></label>
            <label>Who invited you or can verify you?<input required value={form.verifier} onChange={event => change('verifier', event.target.value)} placeholder="Name of a family member" /></label>
            <label>Anything else we should know? <span className="optional">Optional</span><textarea rows={4} value={form.message} onChange={event => change('message', event.target.value)} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button--full" disabled={busy}>{busy ? 'Submitting…' : 'Submit request'} <Send size={17} /></button>
            <p className="form-privacy"><LockKeyhole size={15} /> Your information is used only to review this request.</p>
          </form>
        </div>
      </div>
    </section>
  )
}
