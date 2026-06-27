-- Account activation refinements for the access-review workflow.
-- Pending, denied, and suspended users must be able to read only their own
-- profile status so the app can show the correct access state after login.

create policy "users view own profile status" on public.profiles
for select
using (auth_user_id = auth.uid());

-- Keep request review, account activation, denied-account status, and audit
-- logging together in one transaction.
create or replace function public.review_access_request(
  p_request_id uuid,
  p_status public.request_status,
  p_admin_profile_id uuid,
  p_admin_notes text default null
)
returns public.access_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewed public.access_requests;
  previous_status public.request_status;
begin
  if p_status not in ('approved', 'denied', 'more_info') then
    raise exception 'Invalid access request review status: %', p_status;
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = p_admin_profile_id
      and status = 'approved'
      and role in ('admin', 'super_admin')
  ) then
    raise exception 'Admin profile required to review access requests.';
  end if;

  select status into previous_status
  from public.access_requests
  where id = p_request_id
  for update;

  if previous_status is null then
    raise exception 'Access request not found: %', p_request_id;
  end if;

  update public.access_requests
  set
    status = p_status,
    admin_notes = nullif(trim(coalesce(p_admin_notes, '')), ''),
    reviewed_at = now(),
    reviewed_by = p_admin_profile_id
  where id = p_request_id
  returning * into reviewed;

  if p_status = 'approved' then
    insert into public.profiles (
      email,
      first_name,
      last_name,
      display_name,
      phone,
      role,
      status,
      approved_at,
      approved_by
    ) values (
      lower(reviewed.email),
      reviewed.first_name,
      reviewed.last_name,
      trim(reviewed.first_name || ' ' || reviewed.last_name),
      reviewed.phone,
      'member',
      'approved',
      now(),
      p_admin_profile_id
    )
    on conflict (email) do update
    set
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      display_name = excluded.display_name,
      phone = coalesce(excluded.phone, public.profiles.phone),
      role = case
        when public.profiles.role in ('admin', 'super_admin') then public.profiles.role
        else 'member'
      end,
      status = 'approved',
      approved_at = excluded.approved_at,
      approved_by = excluded.approved_by;
  elsif p_status = 'denied' then
    update public.profiles
    set
      role = case
        when role in ('admin', 'super_admin') then role
        else 'pending'
      end,
      status = case
        when role in ('admin', 'super_admin') then status
        else 'denied'
      end
    where lower(email) = lower(reviewed.email)
      and status <> 'approved';
  end if;

  insert into public.audit_log (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    details
  ) values (
    p_admin_profile_id,
    'access_request.' || p_status::text,
    'access_request',
    p_request_id,
    jsonb_build_object(
      'requester_email', reviewed.email,
      'previous_status', previous_status,
      'next_status', p_status
    )
  );

  return reviewed;
end;
$$;
