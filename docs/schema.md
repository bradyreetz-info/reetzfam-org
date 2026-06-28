# Data model

The source-of-truth draft starts in [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql). It creates the first Postgres schema, indexes, helper functions, and starter Row Level Security policies. [`supabase/migrations/002_auth_profile_linking.sql`](../supabase/migrations/002_auth_profile_linking.sql) links future Supabase Auth users to already-approved profile records by matching email addresses. [`supabase/migrations/003_admin_review_access_requests.sql`](../supabase/migrations/003_admin_review_access_requests.sql) keeps request review, member profile provisioning, and audit logging together in one database transaction. [`supabase/migrations/004_account_activation_and_profile_visibility.sql`](../supabase/migrations/004_account_activation_and_profile_visibility.sql) lets signed-in users read only their own profile status and refines approved/denied account activation. [`supabase/migrations/005_private_storage_buckets.sql`](../supabase/migrations/005_private_storage_buckets.sql) creates private Supabase Storage buckets and object policies for family photos and documents. [`supabase/migrations/006_profile_onboarding.sql`](../supabase/migrations/006_profile_onboarding.sql) adds the onboarding, relationship, important-date, public-profile, link, and archive-metadata tables.

If applying through the Supabase SQL Editor, run the files in numeric order. The editor’s saved query names are not reliable evidence of what is pasted into the editor; check the opening comments before pressing Run. `001_initial_schema.sql` is intentionally idempotent for manual setup so it can repair a partial run where enum types were created before tables/policies.

## Core entities

| Table | Purpose | Sensitive by default |
| --- | --- | --- |
| `profiles` | Authentication-linked portal account, role, and approval status | Yes |
| `access_requests` | Manually reviewed requests from the public form | Yes |
| `households` | Shared household/address grouping | Yes |
| `family_members` | Directory, birthday, relationships, and privacy choices | Yes |
| `calendar_events` | Birthdays and approved family events | Yes |
| `announcements` | Member-only family updates | Yes |
| `library_items` | Metadata for private photos/documents | Yes |
| `audit_log` | Immutable record of administrative actions | Admin only |
| `profile_onboarding_state` | Wizard progress and completion/dismissal state | Yes |
| `profile_aliases` | Nicknames and former names | Yes |
| `profile_phone_numbers` | Typed phone numbers and visibility | Yes |
| `profile_relationships` | Simple manually entered relatives | Yes |
| `profile_important_dates` | Anniversaries, memorials, and milestones | Yes |
| `profile_public_pages` | Explicitly enabled public profile content | Public only when enabled |
| `profile_links` | Member or public-profile links | Depends on visibility |

`auth.users` remains owned by Supabase Auth. `profiles.auth_user_id` is the bridge from authentication to application authorization.

## Roles and status

- `pending`: authenticated but not allowed into member data.
- `member`: standard approved family member; can edit their own profile.
- `editor`: member permissions plus event/announcement management.
- `admin`: access review and management permissions.
- `super_admin`: highest-trust administrative account.

Role never overrides account status. Only `status = approved` may enter the member portal.

## Approval lifecycle

1. The Cloudflare Function validates the public form and inserts an `access_requests` row with `pending` status using the service role.
2. An admin receives a Resend notification and verifies the relationship outside the portal when necessary.
3. The protected admin API verifies the caller's Supabase session and confirms an approved admin profile.
4. The API calls `review_access_request(...)` so Supabase updates the request, creates or updates the approved `profiles` row, marks an existing pending profile denied when appropriate, and writes an audit event atomically.
5. When the approved person later signs in or creates a Supabase Auth account with the same email address, migration `002` links `auth.users.id` to `profiles.auth_user_id`.
6. A welcome or review-status email is sent after the server-side update succeeds.

Never run the approval lifecycle in browser code and never expose the Supabase service-role key.

## Onboarding lifecycle

Approved members without a completed or dismissed onboarding state are redirected to `/app/onboarding`. Each step saves independently through the Supabase anon client and RLS, so normal members can only edit rows tied to `current_profile_id()`. “Save and continue later” records `dismissed_at` so the member can enter the app and return from the sidebar. “Finish profile” records `completed_at`.

The optional public page uses `profile_public_pages.slug` and stays disabled by default. The public `/:slug` route reads only rows where `public_profile_enabled = true` and links marked `public_profile`; it does not read private contact details, full birthdays, emergency notes, documents, or family-only profile fields.

## Storage

`library_items` stores metadata for private files. Migration `005` creates `family-photos` and `family-documents` as private Supabase Storage buckets. Storage object reads are limited to admins, uploaders, and approved members when a matching `library_items` row is visible to members. Serve files through short-lived signed URLs after a member authorization check; do not save public object URLs.
