import { newAccessRequestEmail } from './_shared/email-templates'

interface Env {
  VITE_SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  RESEND_API_KEY: string
  ADMIN_APPROVAL_EMAIL: string
  APP_BASE_URL?: string
}

interface PagesContext { request: Request; env: Env }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})

export const onRequestPost = async ({ request, env }: PagesContext) => {
  // TODO: Add Cloudflare Turnstile and a durable per-IP rate limit before production launch.
  if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.RESEND_API_KEY || !env.ADMIN_APPROVAL_EMAIL) {
    return json({ error: 'Access requests are not configured yet. Please contact the family administrator.' }, 503)
  }

  let input: Record<string, unknown>
  try { input = await request.json() as Record<string, unknown> }
  catch { return json({ error: 'Please submit a valid request.' }, 400) }

  const required = ['first_name', 'last_name', 'email', 'relationship', 'verifier'] as const
  for (const key of required) {
    if (typeof input[key] !== 'string' || !input[key].trim()) return json({ error: 'Please complete every required field.' }, 400)
  }
  const email = String(input.email).trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email address.' }, 400)

  const record = {
    first_name: String(input.first_name).trim().slice(0, 80),
    last_name: String(input.last_name).trim().slice(0, 80),
    email,
    phone: typeof input.phone === 'string' ? input.phone.trim().slice(0, 40) || null : null,
    relationship: String(input.relationship).trim().slice(0, 1000),
    verifier: String(input.verifier).trim().slice(0, 240),
    message: typeof input.message === 'string' ? input.message.trim().slice(0, 2000) || null : null,
    status: 'pending',
  }

  const insertResponse = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/access_requests`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(record),
  })
  if (!insertResponse.ok) {
    console.error('Supabase access request insert failed', insertResponse.status)
    return json({ error: 'We could not save your request. Please try again later.' }, 500)
  }
  const [created] = await insertResponse.json() as Array<{ id: string }>
  const baseUrl = env.APP_BASE_URL || new URL(request.url).origin
  const emailTemplate = newAccessRequestEmail({
    name: `${record.first_name} ${record.last_name}`, email: record.email, phone: record.phone ?? undefined,
    relationship: record.relationship, verifier: record.verifier, message: record.message ?? undefined,
    reviewUrl: `${baseUrl}/admin/approvals?request=${encodeURIComponent(created.id)}`,
  })
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'ReetzFam.org <access@reetzfam.org>', to: [env.ADMIN_APPROVAL_EMAIL], subject: emailTemplate.subject, html: emailTemplate.html }),
  })
  if (!emailResponse.ok) console.error('Resend notification failed', emailResponse.status)

  // The request is safely pending even if email delivery fails; admin dashboards should also query pending records.
  return json({ ok: true, id: created.id, status: 'pending' }, 201)
}

export const onRequest = () => json({ error: 'Method not allowed.' }, 405)
