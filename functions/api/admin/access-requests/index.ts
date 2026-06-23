import { json, methodNotAllowed } from '../../_shared/http'
import { requireAdmin, type Env } from '../../_shared/supabase-admin'

interface PagesContext {
  request: Request
  env: Env
}

const validStatuses = new Set(['pending', 'approved', 'denied', 'more_info'])

export const onRequestGet = async ({ request, env }: PagesContext) => {
  const auth = await requireAdmin(request, env)
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'pending'

  if (status !== 'all' && !validStatuses.has(status)) {
    return json({ error: 'Invalid status filter.' }, 400)
  }

  let query = auth.admin
    .from('access_requests')
    .select('id,first_name,last_name,email,phone,relationship,verifier,message,status,admin_notes,created_at,reviewed_at,reviewed_by')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) {
    console.error('Access request list failed', error)
    return json({ error: 'Could not load access requests.' }, 500)
  }

  return json({ requests: data ?? [] })
}

export const onRequest = methodNotAllowed
