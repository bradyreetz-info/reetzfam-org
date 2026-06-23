import { approvedWelcomeEmail, deniedOrMoreInfoEmail } from '../../_shared/email-templates'
import { cleanString, json, methodNotAllowed, readJson } from '../../_shared/http'
import { sendEmail } from '../../_shared/send-email'
import { requireAdmin, type Env } from '../../_shared/supabase-admin'

interface PagesContext {
  request: Request
  env: Env
  params: { id?: string }
}

type ReviewStatus = 'approved' | 'denied' | 'more_info'

interface AccessRequestRecord {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  relationship: string
  verifier: string
  message: string | null
  status: ReviewStatus | 'pending'
  admin_notes: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

const reviewStatuses = new Set(['approved', 'denied', 'more_info'])

export const onRequestPatch = async ({ request, env, params }: PagesContext) => {
  const auth = await requireAdmin(request, env)
  if (!auth.ok) return auth.response

  const id = params.id
  if (!id) return json({ error: 'Missing access request id.' }, 400)

  const input = await readJson(request)
  if (!input) return json({ error: 'Please submit a valid JSON body.' }, 400)

  const status = cleanString(input.status, 20) as ReviewStatus
  if (!reviewStatuses.has(status)) return json({ error: 'Invalid review status.' }, 400)

  const adminNotes = cleanString(input.admin_notes, 2000) || null

  const { data: updated, error: reviewError } = await auth.admin
    .rpc('review_access_request', {
      p_request_id: id,
      p_status: status,
      p_admin_profile_id: auth.profile.id,
      p_admin_notes: adminNotes,
    })
    .single<AccessRequestRecord>()

  if (reviewError || !updated) {
    console.error('Access request review failed', reviewError)
    const notFound = reviewError?.message?.toLowerCase().includes('not found')
    return json({ error: notFound ? 'Access request not found.' : 'Could not update access request.' }, notFound ? 404 : 500)
  }

  const requesterName = `${updated.first_name} ${updated.last_name}`.trim()
  const baseUrl = env.APP_BASE_URL || new URL(request.url).origin
  const emailTemplate = status === 'approved'
    ? approvedWelcomeEmail(requesterName, `${baseUrl}/login`)
    : deniedOrMoreInfoEmail(
      requesterName,
      adminNotes || (status === 'more_info'
        ? 'A family administrator needs a little more information before approving your request.'
        : 'A family administrator reviewed your request and could not approve access at this time.'),
    )
  const emailSent = await sendEmail(env, updated.email, emailTemplate)

  return json({ request: updated, email_sent: emailSent })
}

export const onRequest = methodNotAllowed
