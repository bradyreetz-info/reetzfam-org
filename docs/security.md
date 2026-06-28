# Security and privacy model

ReetzFam.org handles contact details, birthdays, relationships, addresses, photographs, and family history. Treat all of it as private personal data.

## Required controls before inviting real members

- Enable Supabase Auth email verification and choose a deliberate password/magic-link policy.
- Apply and test every RLS policy in a staging project with pending, member, editor, and admin accounts.
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` only in Cloudflare encrypted secrets.
- Add Cloudflare Turnstile and rate limiting to the access-request endpoint.
- Create private storage buckets and `storage.objects` RLS policies. If the SQL Editor warns that it is not the owner of `storage.objects`, finish those policies in Supabase Storage > Policies before enabling browser uploads. Use short-lived signed URLs.
- Keep approval in protected server-side Functions and write admin actions to `audit_log`.
- Require MFA for admins, restrict the number of `super_admin` accounts, and review roles periodically.
- Configure security headers (CSP, HSTS, `Referrer-Policy`, `Permissions-Policy`) at Cloudflare.
- Set a retention period for denied access requests, logs, and unneeded uploads.
- Back up the database and test restore procedures before storing family archives.

## Application boundaries

Client-side route guards improve user experience but are not a security boundary. Database RLS and server-side role checks are authoritative. Browser code may use only the Supabase anon key. Cloudflare Functions may use the service-role key for narrowly scoped administrative operations after authenticating and authorizing the caller.

The included demo mode is for local interface review only. It stores a fictional session in `sessionStorage` and contains only fictional mock records. Build production with `VITE_DEMO_MODE=false` and configured Supabase variables.

## Privacy defaults

- No real family information belongs in source code, logs, public HTML, analytics payloads, or error messages.
- New users and access requests remain pending until manually approved.
- New member records and uploaded files default to the narrowest practical visibility.
- Public profile pages are disabled by default and can only expose fields saved in `profile_public_pages` plus links explicitly marked `public_profile`.
- Emergency contacts, full birthdates, street addresses, and relationship notes need field-level visibility decisions before launch.
- Do not email private announcement bodies unless recipients have opted in; prefer a short notice linking back to the authenticated portal.

## Launch verification

Test these cases in an incognito browser and directly against the Supabase API: anonymous visitor, pending user, approved member, editor, suspended account, admin, and super admin. Confirm that guessed URLs and direct REST queries cannot read or mutate data outside each role.

For the approval workflow, test: anonymous API request, approved non-admin member, approved admin, denied request, more-info request, approved request with a new email, and approved request where a matching pending profile already exists.
