import { createClient } from '@supabase/supabase-js'
import { json } from './http'

export interface Env {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  RESEND_API_KEY?: string
  ADMIN_APPROVAL_EMAIL?: string
  APP_BASE_URL?: string
  RESEND_FROM_EMAIL?: string
}

interface AdminProfile {
  id: string
  email: string
  role: 'pending' | 'member' | 'editor' | 'admin' | 'super_admin'
  status: 'pending' | 'approved' | 'denied' | 'suspended'
  display_name: string
}

const adminRoles = new Set(['admin', 'super_admin'])

export function createSupabaseAdmin(env: Env) {
  return createClient(env.VITE_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get('Authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

export async function requireAdmin(request: Request, env: Env) {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false as const, response: json({ error: 'Supabase admin API is not configured.' }, 503) }
  }

  const token = getBearerToken(request)
  if (!token) return { ok: false as const, response: json({ error: 'Authentication required.' }, 401) }

  const userClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: userData, error: userError } = await userClient.auth.getUser(token)
  if (userError || !userData.user) return { ok: false as const, response: json({ error: 'Invalid or expired session.' }, 401) }

  const admin = createSupabaseAdmin(env)
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id,email,role,status,display_name')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle<AdminProfile>()

  if (profileError) {
    console.error('Admin profile lookup failed', profileError)
    return { ok: false as const, response: json({ error: 'Could not verify admin permissions.' }, 500) }
  }
  if (!profile || profile.status !== 'approved' || !adminRoles.has(profile.role)) {
    return { ok: false as const, response: json({ error: 'Admin access required.' }, 403) }
  }

  return { ok: true as const, admin, profile, user: userData.user }
}

export async function insertAuditLog(
  admin: ReturnType<typeof createSupabaseAdmin>,
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> = {},
) {
  const { error } = await admin.from('audit_log').insert({
    actor_user_id: actorUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  })
  if (error) console.error('Audit log insert failed', error)
}
