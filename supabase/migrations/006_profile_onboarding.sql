-- Profile onboarding and public-profile metadata for approved members.
-- Run after 001_initial_schema.sql and 004_account_activation_and_profile_visibility.sql.

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'Run 001_initial_schema.sql before 006_profile_onboarding.sql.';
  end if;
end $$;

alter type public.visibility_level add value if not exists 'public_profile';

alter table public.profiles add column if not exists middle_name text;
alter table public.profiles add column if not exists preferred_name text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists pronouns text;
alter table public.profiles add column if not exists birthdate date;
alter table public.profiles add column if not exists birthdate_visibility text not null default 'month_day' check (birthdate_visibility in ('full', 'month_day', 'private'));
alter table public.profiles add column if not exists profile_photo_url text;
alter table public.profiles add column if not exists short_bio text;
alter table public.profiles add column if not exists mailing_address text;
alter table public.profiles add column if not exists mailing_city text;
alter table public.profiles add column if not exists mailing_state text;
alter table public.profiles add column if not exists mailing_postal_code text;
alter table public.profiles add column if not exists mailing_country text not null default 'US';
alter table public.profiles add column if not exists contact_preference text;
alter table public.profiles add column if not exists allow_family_announcements boolean not null default true;
alter table public.profiles add column if not exists emergency_contact_notes text;

alter table public.library_items alter column storage_path drop not null;
alter table public.library_items add column if not exists document_type text;
alter table public.library_items add column if not exists document_date date;
alter table public.library_items add column if not exists notes text;

create table if not exists public.profile_onboarding_state (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  current_step text not null default 'welcome',
  completed_steps text[] not null default '{}'::text[],
  completed_at timestamptz,
  dismissed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_aliases (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  alias_type text not null check (alias_type in ('nickname', 'former_name')),
  value text not null,
  visibility public.visibility_level not null default 'private',
  created_at timestamptz not null default now()
);

create table if not exists public.profile_phone_numbers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  phone_type text not null default 'mobile' check (phone_type in ('mobile', 'home', 'work', 'other')),
  number text not null,
  label text,
  visibility public.visibility_level not null default 'private',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_relationships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('spouse_partner', 'child', 'parent', 'sibling', 'other')),
  name text not null,
  notes text,
  visibility public.visibility_level not null default 'members',
  created_at timestamptz not null default now()
);

create table if not exists public.profile_important_dates (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  date_type text not null default 'other' check (date_type in ('anniversary', 'wedding', 'graduation', 'military_service', 'memorial', 'birthday', 'reunion', 'other')),
  title text not null,
  event_date date not null,
  notes text,
  visibility public.visibility_level not null default 'private',
  created_at timestamptz not null default now()
);

create table if not exists public.profile_public_pages (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  slug text unique,
  public_profile_enabled boolean not null default false,
  public_display_name text,
  public_bio text,
  interests text[] not null default '{}'::text[],
  skills_occupations text[] not null default '{}'::text[],
  family_story text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint profile_public_pages_slug_format check (
    slug is null
    or (
      slug = lower(slug)
      and slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'
      and slug not in ('admin', 'api', 'app', 'assets', 'calendar', 'directory', 'documents', 'login', 'logout', 'photos', 'privacy', 'request-access', 'settings')
    )
  )
);

create table if not exists public.profile_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  url text not null,
  visibility public.visibility_level not null default 'private',
  created_at timestamptz not null default now()
);

create index if not exists profile_aliases_profile_idx on public.profile_aliases(profile_id);
create index if not exists profile_phone_numbers_profile_idx on public.profile_phone_numbers(profile_id);
create index if not exists profile_relationships_profile_idx on public.profile_relationships(profile_id);
create index if not exists profile_important_dates_profile_idx on public.profile_important_dates(profile_id);
create index if not exists profile_links_profile_idx on public.profile_links(profile_id);
create index if not exists profile_public_pages_slug_idx on public.profile_public_pages(slug) where public_profile_enabled = true;

alter table public.profile_onboarding_state enable row level security;
alter table public.profile_aliases enable row level security;
alter table public.profile_phone_numbers enable row level security;
alter table public.profile_relationships enable row level security;
alter table public.profile_important_dates enable row level security;
alter table public.profile_public_pages enable row level security;
alter table public.profile_links enable row level security;

drop policy if exists "members manage own onboarding state" on public.profile_onboarding_state;
drop policy if exists "admins manage onboarding state" on public.profile_onboarding_state;
drop policy if exists "members manage own aliases" on public.profile_aliases;
drop policy if exists "members view visible aliases" on public.profile_aliases;
drop policy if exists "admins manage aliases" on public.profile_aliases;
drop policy if exists "members manage own phone numbers" on public.profile_phone_numbers;
drop policy if exists "members view visible phone numbers" on public.profile_phone_numbers;
drop policy if exists "admins manage phone numbers" on public.profile_phone_numbers;
drop policy if exists "members manage own relationships" on public.profile_relationships;
drop policy if exists "members view visible relationships" on public.profile_relationships;
drop policy if exists "admins manage relationships" on public.profile_relationships;
drop policy if exists "members manage own important dates" on public.profile_important_dates;
drop policy if exists "members view visible important dates" on public.profile_important_dates;
drop policy if exists "admins manage important dates" on public.profile_important_dates;
drop policy if exists "members manage own public page" on public.profile_public_pages;
drop policy if exists "public reads enabled public profile pages" on public.profile_public_pages;
drop policy if exists "admins manage public profile pages" on public.profile_public_pages;
drop policy if exists "members manage own links" on public.profile_links;
drop policy if exists "public reads public profile links" on public.profile_links;
drop policy if exists "members view visible links" on public.profile_links;
drop policy if exists "admins manage links" on public.profile_links;

create policy "members manage own onboarding state" on public.profile_onboarding_state
for all using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

create policy "admins manage onboarding state" on public.profile_onboarding_state
for all using (public.has_role(array['admin','super_admin']::public.user_role[]))
with check (public.has_role(array['admin','super_admin']::public.user_role[]));

create policy "members manage own aliases" on public.profile_aliases
for all using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

create policy "members view visible aliases" on public.profile_aliases
for select using (public.is_approved_member() and visibility::text in ('members', 'public_profile'));

create policy "admins manage aliases" on public.profile_aliases
for all using (public.has_role(array['admin','super_admin']::public.user_role[]))
with check (public.has_role(array['admin','super_admin']::public.user_role[]));

create policy "members manage own phone numbers" on public.profile_phone_numbers
for all using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

create policy "members view visible phone numbers" on public.profile_phone_numbers
for select using (public.is_approved_member() and visibility::text = 'members');

create policy "admins manage phone numbers" on public.profile_phone_numbers
for all using (public.has_role(array['admin','super_admin']::public.user_role[]))
with check (public.has_role(array['admin','super_admin']::public.user_role[]));

create policy "members manage own relationships" on public.profile_relationships
for all using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

create policy "members view visible relationships" on public.profile_relationships
for select using (public.is_approved_member() and visibility::text in ('members', 'public_profile'));

create policy "admins manage relationships" on public.profile_relationships
for all using (public.has_role(array['admin','super_admin']::public.user_role[]))
with check (public.has_role(array['admin','super_admin']::public.user_role[]));

create policy "members manage own important dates" on public.profile_important_dates
for all using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

create policy "members view visible important dates" on public.profile_important_dates
for select using (public.is_approved_member() and visibility::text in ('members', 'public_profile'));

create policy "admins manage important dates" on public.profile_important_dates
for all using (public.has_role(array['admin','super_admin']::public.user_role[]))
with check (public.has_role(array['admin','super_admin']::public.user_role[]));

create policy "members manage own public page" on public.profile_public_pages
for all using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

create policy "public reads enabled public profile pages" on public.profile_public_pages
for select using (public_profile_enabled = true and slug is not null);

create policy "admins manage public profile pages" on public.profile_public_pages
for all using (public.has_role(array['admin','super_admin']::public.user_role[]))
with check (public.has_role(array['admin','super_admin']::public.user_role[]));

create policy "members manage own links" on public.profile_links
for all using (profile_id = public.current_profile_id())
with check (profile_id = public.current_profile_id());

create policy "public reads public profile links" on public.profile_links
for select using (
  visibility::text = 'public_profile'
  and exists (
    select 1
    from public.profile_public_pages page
    where page.profile_id = profile_links.profile_id
      and page.public_profile_enabled = true
      and page.slug is not null
  )
);

create policy "members view visible links" on public.profile_links
for select using (public.is_approved_member() and visibility::text in ('members', 'public_profile'));

create policy "admins manage links" on public.profile_links
for all using (public.has_role(array['admin','super_admin']::public.user_role[]))
with check (public.has_role(array['admin','super_admin']::public.user_role[]));
