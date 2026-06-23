-- Link approved profile records to Supabase Auth users when a user signs in/signs up.
-- This lets admins approve an email first, then the member can create/login with that same email.

create or replace function public.link_auth_user_to_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  linked_profile_id uuid;
begin
  update public.profiles
  set auth_user_id = new.id
  where auth_user_id is null
    and lower(email) = lower(new.email)
  returning id into linked_profile_id;

  if linked_profile_id is null then
    insert into public.profiles (
      auth_user_id,
      email,
      first_name,
      last_name,
      display_name,
      role,
      status
    ) values (
      new.id,
      lower(coalesce(new.email, '')),
      coalesce(new.raw_user_meta_data->>'first_name', ''),
      coalesce(new.raw_user_meta_data->>'last_name', ''),
      coalesce(new.raw_user_meta_data->>'display_name', new.email, 'Pending member'),
      'pending',
      'pending'
    )
    on conflict (email) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_link_profile on auth.users;

create trigger on_auth_user_created_link_profile
after insert on auth.users
for each row execute function public.link_auth_user_to_profile();
