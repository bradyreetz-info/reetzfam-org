# Data model

The source-of-truth draft starts in [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql). It creates the first Postgres schema, indexes, helper functions, and starter Row Level Security policies. [`supabase/migrations/002_auth_profile_linking.sql`](../supabase/migrations/002_auth_profile_linking.sql) links future Supabase Auth users to already-approved profile records by matching email addresses. [`supabase/migrations/003_admin_review_access_requests.sql`](../supabase/migrations/003_admin_review_access_requests.sql) keeps request review, member profile provisioning, and audit logging together in one database transaction.

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
4. The API calls `review_access_request(...)` so Supabase updates the request, creates or updates the approved `profiles` row, and writes an audit event atomically.
5. When the approved person later signs in or creates a Supabase Auth account with the same email address, migration `002` links `auth.users.id` to `profiles.auth_user_id`.
6. A welcome or review-status email is sent after the server-side update succeeds.

Never run the approval lifecycle in browser code and never expose the Supabase service-role key.

## Storage

`library_items` stores metadata only. Files should live in private Supabase Storage buckets or private Cloudflare R2. Serve files through short-lived signed URLs after a member authorization check; do not save public object URLs.
