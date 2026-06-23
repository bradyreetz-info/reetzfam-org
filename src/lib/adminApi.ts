import type { AccessRequest } from '../types'
import { supabase } from './supabase'

async function getAccessToken() {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const token = data.session?.access_token
  if (!token) throw new Error('Please sign in again before performing admin actions.')
  return token
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'The admin request failed.')
  }
  return payload as T
}

export async function listAccessRequests(status: AccessRequest['status'] | 'all' = 'pending') {
  const token = await getAccessToken()
  const response = await fetch(`/api/admin/access-requests?status=${encodeURIComponent(status)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = await parseResponse<{ requests: AccessRequest[] }>(response)
  return payload.requests
}

export async function reviewAccessRequest(id: string, status: AccessRequest['status'], adminNotes?: string) {
  const token = await getAccessToken()
  const response = await fetch(`/api/admin/access-requests/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, admin_notes: adminNotes }),
  })
  const payload = await parseResponse<{ request: AccessRequest; email_sent: boolean }>(response)
  return payload
}
