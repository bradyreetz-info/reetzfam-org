import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Check, Clock3, Loader2, Mail, MessageSquareText, MoreHorizontal, Phone, RefreshCcw, UserRoundCheck, X } from 'lucide-react'
import { accessRequests as mockRequests } from '../../data/mock'
import { useAuth } from '../../lib/auth'
import { listAccessRequests, reviewAccessRequest } from '../../lib/adminApi'
import type { AccessRequest } from '../../types'

export function ApprovalsPage() {
  const { demoMode } = useAuth()
  const [requests, setRequests] = useState<AccessRequest[]>(demoMode ? mockRequests : [])
  const [loading, setLoading] = useState(!demoMode)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [actionId, setActionId] = useState('')

  const load = useCallback(async () => {
    if (demoMode) {
      setRequests(mockRequests)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      setRequests(await listAccessRequests('all'))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load access requests.')
    } finally {
      setLoading(false)
    }
  }, [demoMode])

  useEffect(() => { void load() }, [load])

  const update = async (id: string, status: AccessRequest['status']) => {
    const adminNotes = status === 'more_info'
      ? window.prompt('What information should this requester provide?')?.trim()
      : status === 'denied'
        ? window.prompt('Optional note to include in the denial email:')?.trim()
        : ''

    if ((status === 'more_info' || status === 'denied') && adminNotes === undefined) return

    setActionId(`${id}:${status}`)
    setError('')
    try {
      if (demoMode) {
        setRequests(current => current.map(item => item.id === id ? { ...item, status, admin_notes: adminNotes || null, reviewed_at: new Date().toISOString() } : item))
        setNotice(status === 'approved' ? 'Request approved in preview mode.' : 'Request status updated in preview mode.')
      } else {
        const { request, email_sent } = await reviewAccessRequest(id, status, adminNotes)
        setRequests(current => current.map(item => item.id === id ? request : item))
        setNotice(status === 'approved'
          ? `Request approved. ${email_sent ? 'Welcome email sent.' : 'Email delivery needs attention.'}`
          : `Request marked ${status.replace('_', ' ')}. ${email_sent ? 'Requester email sent.' : 'Email delivery needs attention.'}`)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update access request.')
    } finally {
      setActionId('')
    }
  }

  const pendingCount = requests.filter(item => item.status === 'pending').length

  return (
    <div>
      <header className="page-header">
        <div>
          <p className="eyebrow eyebrow--admin">Administration</p>
          <h1>Access approvals</h1>
          <p>Review identity and family connection before granting access. Approval is always manual.</p>
        </div>
        <div className="page-actions">
          {!demoMode && <button className="button button--secondary" onClick={() => void load()} disabled={loading}><RefreshCcw /> Refresh</button>}
          <span className="count-badge">{pendingCount} pending</span>
        </div>
      </header>

      {notice && <div className="inline-success" role="status"><Check />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X /></button></div>}
      {error && <div className="inline-error" role="alert"><AlertCircle />{error}</div>}
      {loading && <div className="loading-panel"><Loader2 className="spin" /> Loading access requests...</div>}

      {!loading && requests.length === 0 && <div className="empty-panel"><h2>No access requests yet</h2><p>New requests from the public form will appear here for admin review.</p></div>}

      <div className="approval-list">
        {requests.map(request => {
          const initials = `${request.first_name[0] ?? ''}${request.last_name[0] ?? ''}` || '?'
          return (
            <article className={`approval-card ${request.status !== 'pending' ? 'is-reviewed' : ''}`} key={request.id}>
              <div className="approval-person">
                <span className="avatar avatar--large">{initials}</span>
                <div>
                  <div className="approval-title"><h2>{request.first_name} {request.last_name}</h2><span className={`status-badge status-${request.status}`}>{request.status.replace('_', ' ')}</span></div>
                  <p>Requested {new Date(request.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                </div>
                <button className="icon-button" aria-label="More actions"><MoreHorizontal /></button>
              </div>
              <div className="approval-details">
                <div><Mail /><span><small>Email</small><a href={`mailto:${request.email}`}>{request.email}</a></span></div>
                {request.phone && <div><Phone /><span><small>Phone</small><strong>{request.phone}</strong></span></div>}
                <div><UserRoundCheck /><span><small>Relationship</small><strong>{request.relationship}</strong></span></div>
                <div><UserRoundCheck /><span><small>Verifier</small><strong>{request.verifier}</strong></span></div>
                {request.message && <div className="approval-message"><MessageSquareText /><span><small>Message</small><p>{request.message}</p></span></div>}
                {request.admin_notes && <div className="approval-message"><MessageSquareText /><span><small>Admin notes</small><p>{request.admin_notes}</p></span></div>}
              </div>
              {request.status === 'pending' && <div className="approval-actions">
                <button className="button button--approve" disabled={Boolean(actionId)} onClick={() => void update(request.id, 'approved')}>{actionId === `${request.id}:approved` ? <Loader2 className="spin" /> : <Check />} Approve</button>
                <button className="button button--secondary" disabled={Boolean(actionId)} onClick={() => void update(request.id, 'more_info')}>{actionId === `${request.id}:more_info` ? <Loader2 className="spin" /> : <MessageSquareText />} Ask for info</button>
                <button className="button button--danger" disabled={Boolean(actionId)} onClick={() => void update(request.id, 'denied')}>{actionId === `${request.id}:denied` ? <Loader2 className="spin" /> : <X />} Deny</button>
              </div>}
            </article>
          )
        })}
      </div>

      <div className="admin-footnote"><Clock3 /><p><strong>Production path.</strong> Admin actions now call protected Pages Functions. The Functions verify the Supabase session, require an approved admin profile, update Supabase, write audit logs, and send Resend emails when configured.</p></div>
    </div>
  )
}
