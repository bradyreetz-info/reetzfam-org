# ReetzFam.org

ReetzFam.org is a private, mobile-first family portal for approved Reetz family members. The public site is intentionally small; the member experience provides a foundation for the family directory, birthdays, events, announcements, photos, documents, profiles, family history, and role-based administration.

This repository contains a polished first product pass. It runs with fictional preview data locally and is structured to connect cleanly to Supabase, Cloudflare Pages Functions, and Resend. No real family information or secrets belong in source control.

## What is included

- Public homepage, privacy page, login, and manually reviewed access-request flow
- Supabase-aware email/password, sign-up, password reset, and magic-link authentication provider
- Authentication guard for all `/app/*` routes and role guard for all `/admin/*` routes
- Member dashboard, searchable family directory, profile detail, FullCalendar month/list views, announcements, profile editing, library placeholders, and family-history placeholder
- Admin dashboard, approval workflow preview, protected management sections, and audit-log placeholder
- Cloudflare Pages Function that validates and stores a pending access request, then notifies the admin through Resend
- Protected admin approval actions that activate approved profiles, deny pending profiles when appropriate, write audit logs, and send requester emails
- Responsive visual system with accessible labels, focus states, reduced-motion support, empty/error/success states, and older-user-friendly sizing
- Initial Supabase schema/RLS migration, email templates, security model, and deployment notes

## Stack

- React 18 + TypeScript + Vite
- React Router
- Supabase Auth, Postgres, Row Level Security, and future private Storage
- Cloudflare Pages + Pages Functions
- Resend transactional email
- FullCalendar
- Plain CSS design tokens and reusable layout/component patterns

## Local development

Requirements: Node.js 20+ and pnpm (npm also works).

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:5173`.

Local Vite development automatically enables fictional preview mode. Sign in with any email and a password of at least eight characters:

- Include `admin` in the email to preview admin routes.
- Include `pending` in the email to preview pending-access behavior.
- Any other email previews the standard member role.

Preview mode uses `sessionStorage`, does not create an account, and must not be used with real family data.

Validation commands:

```bash
pnpm check
pnpm lint
pnpm build
pnpm preview
```

## Environment variables

Copy `.env.example` for local development. In Cloudflare Pages, configure browser variables under build environment variables and sensitive server variables as encrypted secrets.

| Variable | Location | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Browser + Function | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser | Public Supabase anon key; safe only with tested RLS |
| `SUPABASE_URL` | Worker runtime | Optional server-side alias for `VITE_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | Worker runtime | Optional server-side alias for `VITE_SUPABASE_ANON_KEY` |
| `VITE_DEMO_MODE` | Build | `true` only for non-production previews |
| `VITE_TURNSTILE_SITE_KEY` | Browser | Public Cloudflare Turnstile site key once enabled |
| `VITE_API_BASE_URL` | Browser | Optional VPS/API origin if a long-running backend is added |
| `SUPABASE_SERVICE_ROLE_KEY` | Function secret | Server-only access-request and admin operations |
| `RESEND_API_KEY` | Function secret | Transactional email delivery |
| `RESEND_FROM_EMAIL` | Function | Verified sender, for example `ReetzFam.org <access@reetzfam.org>` |
| `ADMIN_APPROVAL_EMAIL` | Function secret | Family admin receiving access-review notices |
| `APP_BASE_URL` | Function | Canonical site URL, normally `https://reetzfam.org` |
| `TURNSTILE_SECRET_KEY` | Function secret | Private Turnstile token validation secret once enabled |

Never prefix a secret with `VITE_`; Vite exposes those variables to browser bundles. Never commit `.env`, `.env.local`, or `.dev.vars`.

## Cloudflare deployment

1. Create a Cloudflare Workers/Pages project connected to the GitHub repository.
2. Use build command `pnpm run build`.
3. Use deploy command `npx wrangler deploy`.
4. Keep `wrangler.toml` committed. It defines the Worker entrypoint, the static assets directory, SPA fallback behavior, and API-first routing for `/api/*`.
5. Set Node.js 20 or newer in the build environment.
6. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; set `VITE_DEMO_MODE=false` for production.
7. Add `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ADMIN_APPROVAL_EMAIL`, and later `TURNSTILE_SECRET_KEY` as encrypted Function secrets.
8. Add `APP_BASE_URL=https://reetzfam.org`.
9. Connect the custom domain and enforce HTTPS.

`wrangler.toml` now uses Workers static assets with `not_found_handling = "single-page-application"` so client-side routes work after deployment. `public/_headers` supplies a starter security policy. Tighten the Content Security Policy whenever new services are added.

Important runtime note: because deployment runs through `npx wrangler deploy`, `/api/*` executes as the Worker defined by `worker/index.ts`. If an API route returns `missing_runtime_bindings`, set those variables/secrets on the deployed Worker runtime environment, not only as Pages build variables. Non-secret values may be set as Worker variables; `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` must be Worker secrets.

To test locally after configuring `.dev.vars`, build and use Wrangler:

```bash
pnpm build
pnpm dlx wrangler dev
```

## Supabase setup checklist

1. Create separate development/staging and production projects.
2. Review and apply all SQL files in `supabase/migrations` in order.
3. Create pending, member, editor, admin, suspended, and super-admin test accounts.
4. Test every RLS policy through the anon client and direct REST requests; do not rely on route guards.
5. Configure email verification, site URL, and allowed redirect URLs for `/app`.
6. Decide whether password, magic link, or both are enabled.
7. Require MFA for admins.
8. Create private photo/document buckets and `storage.objects` policies before enabling upload.
9. Create the first admin profile manually, then test the protected approval endpoints from `/admin/approvals`.
10. Remove fictional mock data from production queries and keep a separate seed path for development.

See [`docs/schema.md`](docs/schema.md) and [`docs/security.md`](docs/security.md) before launch.

When using the Supabase SQL Editor manually, paste and run the actual file contents in this exact order:

1. `001_initial_schema.sql`
2. `002_auth_profile_linking.sql`
3. `003_admin_review_access_requests.sql`
4. `004_account_activation_and_profile_visibility.sql`
5. `005_private_storage_buckets.sql`

The query tab name in Supabase is only a label; verify the first comment line matches the migration you intend to run. Migration `001` is safe to re-run if an earlier attempt already created enum types or policies. Migration `005` creates private Supabase Storage buckets named `family-photos` and `family-documents`.

### Current approval and login flow

1. A visitor submits `/request-access`.
2. `/api/access-requests` inserts a pending `access_requests` row with the service role and sends the admin approval email.
3. An approved admin reviews the request at `/admin/approvals`.
4. Approval calls `review_access_request(...)`, activates or creates the matching approved profile, writes `audit_log`, and sends the welcome email.
5. The approved person uses `/login` to create an account, sign in with password, or request an email link. Supabase links the Auth user to the approved profile by matching email.
6. Pending or denied users can sign in, but route guards and RLS keep member data private.

## Resend setup checklist

1. Verify `reetzfam.org` in Resend and publish SPF/DKIM records.
2. Create a production sender such as `access@reetzfam.org`.
3. Add `RESEND_API_KEY` only to Cloudflare Function secrets.
4. Set `ADMIN_APPROVAL_EMAIL` to the reviewed administrator inbox.
5. Test the four templates in `functions/api/_shared/email-templates.ts`: new request, approval, denial/more information, and family announcement.
6. Add retry/alert handling for failed admin notifications; a pending row remains the source of truth.
7. Send only short announcement excerpts by email and link members back to the authenticated portal.

## Project structure

```text
src/
  components/       Shared brand, feedback, and status UI
  data/mock/        Fictional interface-preview data only
  layouts/          Public and authenticated application shells
  lib/              Supabase client and authentication provider
  pages/            Public, member, and admin routes
  styles/           Design tokens and responsive visual system
  types/            Shared application models
functions/api/      Cloudflare Pages Functions and email templates
supabase/migrations Initial Postgres schema and RLS draft
docs/               Data-model and security guidance
```

## Privacy and security notes

- All family data is private by default. The public bundle contains fictional examples only.
- Client-side guards are navigation conveniences; Supabase RLS and server-side authorization are the security boundary.
- New requests and newly created accounts remain pending until an admin explicitly approves them.
- Service-role operations belong in narrowly scoped Cloudflare Functions, never React code.
- Avoid analytics until a privacy decision is made. Do not send profile data to logging or monitoring services.
- Add rate limiting and Turnstile to the public form before launch.
- Use signed URLs for private files and define retention/removal procedures.

## Roadmap

1. Connect Supabase Auth and replace preview reads with RLS-protected queries.
2. Add Turnstile token validation and durable rate limiting to public request submission.
3. Replace directory, calendar, and announcements mock reads with RLS-protected Supabase queries.
4. Add household and field-level privacy controls, profile photos, and birthday generation.
5. Add event creation/approval, RSVP support, reminders, and calendar subscriptions.
6. Connect private Storage or R2 for albums and documents with upload scanning.
7. Build family-tree relationships, story/source records, and archive-photo identification.
8. Add admin reporting, data export/removal, backups, accessibility testing, and operational monitoring.

## License

Private family project. No license is granted for redistribution unless the repository owner adds one.
