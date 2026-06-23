-- ReetzFam.org initial schema draft
-- Review in a staging Supabase project before applying to production.
create extension if not exists pgcrypto;

create type public.user_role as enum ('pending', 'member', 'editor', 'admin', 'super_admin');
create type public.user_status as enum ('pending', 'approved', 'denied', 'suspended');
create type public.request_status as enum ('pending', 'approved', 'denied', 'more_info');
create type public.visibility_level as enum ('members', 'editors', 'admins', 'private');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text not null unique,
  first_name text not null,
  last_name text not null,
  display_name text not null,
  phone text,
  role public.user_role not null default 'pending',
  status public.user_status not null default 'pending',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id)
);

create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  relationship text not null,
  verifier text not null,
  message text,
  status public.request_status not null default 'pending',
  admin_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id)
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  household_name text not null,
  address text,
  city text,
  state text,
  postal_code text,
  country text default 'US',
  notes text,
  privacy_level public.visibility_level not null default 'private',
  created_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  household_id uuid references public.households(id) on delete set null,
  first_name text not null,
  middle_name text,
  last_name text not null,
  preferred_name text,
  birthdate date,
  birthdate_visibility text not null default 'month_day' check (birthdate_visibility in ('full', 'month_day', 'private')),
  email text,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  spouse_partner text,
  children_notes text,
  relationship_notes text,
  emergency_contact text,
  profile_photo_url text,
  privacy_level public.visibility_level not null default 'private',
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null,
  start_date timestamptz not null,
  end_date timestamptz,
  all_day boolean not null default false,
  location text,
  visibility public.visibility_level not null default 'members',
  created_by uuid not null references public.profiles(id),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  pinned boolean not null default false,
  visibility public.visibility_level not null default 'members',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_url text,
  storage_path text not null,
  file_type text not null,
  item_type text not null check (item_type in ('photo', 'document')),
  visibility public.visibility_level not null default 'private',
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index access_requests_status_created_idx on public.access_requests(status, created_at desc);
create index family_members_household_idx on public.family_members(household_id);
create index family_members_name_idx on public.family_members(last_name, first_name);
create index calendar_events_start_idx on public.calendar_events(start_date);
create index announcements_pinned_created_idx on public.announcements(pinned desc, created_at desc);
create index audit_log_created_idx on public.audit_log(created_at desc);

create or replace function public.current_profile_id() returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1;
$$;
create or replace function public.is_approved_member() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where auth_user_id = auth.uid() and status = 'approved');
$$;
create or replace function public.has_role(required_roles public.user_role[]) returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where auth_user_id = auth.uid() and status = 'approved' and role = any(required_roles));
$$;

alter table public.profiles enable row level security;
alter table public.access_requests enable row level security;
alter table public.households enable row level security;
alter table public.family_members enable row level security;
alter table public.calendar_events enable row level security;
alter table public.announcements enable row level security;
alter table public.library_items enable row level security;
alter table public.audit_log enable row level security;

create policy "approved members view profiles" on public.profiles for select using (public.is_approved_member());
create policy "members update own profile" on public.profiles for update using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy "admins manage profiles" on public.profiles for all using (public.has_role(array['admin','super_admin']::public.user_role[])) with check (public.has_role(array['admin','super_admin']::public.user_role[]));

-- Public access requests are inserted only by the Cloudflare Function using the service role.
create policy "admins review access requests" on public.access_requests for select using (public.has_role(array['admin','super_admin']::public.user_role[]));
create policy "admins update access requests" on public.access_requests for update using (public.has_role(array['admin','super_admin']::public.user_role[]));

create policy "members view permitted households" on public.households for select using (
  public.is_approved_member() and (privacy_level = 'members' or public.has_role(array['admin','super_admin']::public.user_role[]))
);
create policy "admins manage households" on public.households for all using (public.has_role(array['admin','super_admin']::public.user_role[])) with check (public.has_role(array['admin','super_admin']::public.user_role[]));

create policy "members view permitted family records" on public.family_members for select using (
  public.is_approved_member() and (
    privacy_level = 'members'
    or (privacy_level = 'editors' and public.has_role(array['editor','admin','super_admin']::public.user_role[]))
    or profile_id = public.current_profile_id()
    or public.has_role(array['admin','super_admin']::public.user_role[])
  )
);
create policy "members update own family record" on public.family_members for update using (profile_id = public.current_profile_id()) with check (profile_id = public.current_profile_id());
create policy "admins manage family records" on public.family_members for all using (public.has_role(array['admin','super_admin']::public.user_role[])) with check (public.has_role(array['admin','super_admin']::public.user_role[]));

create policy "members view approved events" on public.calendar_events for select using (public.is_approved_member() and approved = true and visibility = 'members');
create policy "editors manage events" on public.calendar_events for all using (public.has_role(array['editor','admin','super_admin']::public.user_role[])) with check (public.has_role(array['editor','admin','super_admin']::public.user_role[]));
create policy "members view announcements" on public.announcements for select using (public.is_approved_member() and visibility = 'members');
create policy "editors manage announcements" on public.announcements for all using (public.has_role(array['editor','admin','super_admin']::public.user_role[])) with check (public.has_role(array['editor','admin','super_admin']::public.user_role[]));

create policy "members view permitted library items" on public.library_items for select using (
  public.is_approved_member() and (
    visibility = 'members' or uploaded_by = public.current_profile_id() or public.has_role(array['admin','super_admin']::public.user_role[])
  )
);
create policy "members upload private library items" on public.library_items for insert with check (public.is_approved_member() and uploaded_by = public.current_profile_id());
create policy "uploaders or admins manage library items" on public.library_items for update using (uploaded_by = public.current_profile_id() or public.has_role(array['admin','super_admin']::public.user_role[]));
create policy "admins view audit log" on public.audit_log for select using (public.has_role(array['admin','super_admin']::public.user_role[]));

-- TODO before launch: create private Supabase Storage buckets and storage.objects RLS policies.
-- TODO before launch: implement approval as one server-side transaction that updates the request,
-- links/creates the auth user and profile, writes audit_log, and only then sends the welcome email.
