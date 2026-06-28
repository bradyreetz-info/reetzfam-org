import { onRequest as accessRequestsMethodNotAllowed, onRequestPost as createAccessRequest } from '../functions/api/access-requests'
import { onRequest as adminRequestsMethodNotAllowed, onRequestGet as listAdminAccessRequests } from '../functions/api/admin/access-requests/index'
import { onRequest as adminRequestMethodNotAllowed, onRequestPatch as reviewAdminAccessRequest } from '../functions/api/admin/access-requests/[id]'

interface WorkerEnv {
  ASSETS: Fetcher
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  RESEND_API_KEY?: string
  ADMIN_APPROVAL_EMAIL?: string
  APP_BASE_URL?: string
  RESEND_FROM_EMAIL?: string
}

const apiNotFound = () => Response.json({ error: 'API route not found.' }, { status: 404 })

function trimTrailingSlash(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
}

export default {
  async fetch(request: Request, env: WorkerEnv) {
    const url = new URL(request.url)
    const pathname = trimTrailingSlash(url.pathname)

    if (pathname === '/api/access-requests') {
      if (request.method === 'POST') return createAccessRequest({ request, env })
      return accessRequestsMethodNotAllowed()
    }

    if (pathname === '/api/admin/access-requests') {
      if (request.method === 'GET') return listAdminAccessRequests({ request, env })
      return adminRequestsMethodNotAllowed()
    }

    const reviewMatch = pathname.match(/^\/api\/admin\/access-requests\/([^/]+)$/)
    if (reviewMatch) {
      if (request.method === 'PATCH') {
        return reviewAdminAccessRequest({
          request,
          env,
          params: { id: decodeURIComponent(reviewMatch[1]) },
        })
      }
      return adminRequestMethodNotAllowed()
    }

    if (pathname.startsWith('/api/')) return apiNotFound()

    return env.ASSETS.fetch(request)
  },
}
