# Phase 2 backend activation

This project should keep the browser app and Cloudflare edge Functions/Workers as the default request path. Use the VPS only for work that benefits from a long-running Node process.

## Required providers

### Cloudflare

- Workers/Pages project connected to `bradyreetz-info/reetzfam-org`
- Production branch: `main`
- Build command: `pnpm run build`
- Deploy command: `npx wrangler deploy`
- Static assets directory: `dist`, configured in `wrangler.toml`
- Worker entrypoint: `worker/index.ts`
- Custom domains: `reetzfam.org` and optionally `www.reetzfam.org`
- Function secrets: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ADMIN_APPROVAL_EMAIL`, later `TURNSTILE_SECRET_KEY`
- Build/runtime variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DEMO_MODE=false`, `APP_BASE_URL=https://reetzfam.org`, optional `RESEND_FROM_EMAIL`

### Supabase

- Hosted project for Auth and Postgres
- Apply migrations in order from `supabase/migrations`
- Configure Auth site URL and redirect URLs for `https://reetzfam.org/app`
- Manually create the first approved admin profile
- Test RLS with anon, pending, member, editor, admin, and super-admin users
- Run `005_private_storage_buckets.sql` after enabling Supabase Storage to create the private `family-photos` and `family-documents` buckets

### Resend

- Verify a sending subdomain such as `mail.reetzfam.org`
- Add DNS records in Cloudflare
- Store the API key only as a Cloudflare Function secret
- Use a verified sender for access-review and welcome messages

## VPS role

Good VPS uses:

- scheduled digest emails
- background imports/exports
- image/document processing
- antivirus or content scanning for uploads
- family-tree import jobs
- admin maintenance scripts

Avoid using the VPS for first-pass auth or primary database storage. Supabase already covers Auth, Postgres, RLS, and API access with less operational risk.

If a VPS API is added later:

- expose it at `https://api.reetzfam.org`
- set `VITE_API_BASE_URL=https://api.reetzfam.org`
- verify Supabase JWTs on every private request
- keep service keys in the VPS environment, never in the browser
- restrict CORS to `https://reetzfam.org`
- run the Node service under `systemd` or PM2 behind Caddy/Nginx

## Current backend slice

- Public request form posts to `/api/access-requests`
- Admin approvals read from `/api/admin/access-requests`
- Admin review actions patch `/api/admin/access-requests/:id`
- `worker/index.ts` routes `/api/*` requests to the same handler modules used by the original Pages Functions layout, then serves static assets for everything else
- Admin endpoints require a valid Supabase session and an approved `admin` or `super_admin` profile
- Approval calls the `review_access_request(...)` RPC so request review, account activation/denial, member profile provisioning, and audit logging happen atomically
- The auth-linking migration connects approved profiles to future Supabase Auth users by email
- The profile visibility migration lets logged-in pending/denied users read only their own status so the app can show the correct access screen without exposing family data
